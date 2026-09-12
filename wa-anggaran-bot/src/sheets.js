const fs = require("fs");
const path = require("path");
const ledger = require("./ledger");

const SHEET_ID = "1HVtpuXBVkBFMIF-ydRRTTlhasRk1Dg7V23uKBiXY4Sg";
const WEBHOOK_FILE = path.join(__dirname, "..", "data", "webhook.txt");

function webhookUrl() {
  if (process.env.SHEET_WEBHOOK) return process.env.SHEET_WEBHOOK.trim();
  try {
    return fs.readFileSync(WEBHOOK_FILE, "utf8").trim();
  } catch {
    return "";
  }
}

function nowWib() {
  const d = new Date();
  const tanggal = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  const jam = d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { tanggal, jam };
}

async function appendCostSeo(entry, imageBuf) {
  const SHEET_WEBHOOK = webhookUrl();
  if (!SHEET_WEBHOOK) {
    return { ok: false, skip: true };
  }
  const { tanggal, jam } = nowWib();
  const body = {
    sheetId: SHEET_ID,
    tab: "Cost SEO",
    row: {
      tanggal,
      jam,
      tipe: entry.type === "in" ? "Masuk" : "Keluar",
      jumlah: entry.amount,
      keperluan: entry.note || "",
      siapa: "lordpors",
      bulan: entry.month,
      id: ledger.monthLocalId(entry),
      sumber: "WhatsApp",
      currency: entry.currency === "USD" ? "USD" : "IDR",
    },
  };
  if (imageBuf && imageBuf.length && imageBuf.length < 4.5 * 1024 * 1024) {
    body.buktiMime = "image/jpeg";
    body.buktiBase64 = Buffer.from(imageBuf).toString("base64");
  }
  try {
    const res = await fetch(SHEET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      return { ok: false, skip: false, error: `HTTP ${res.status}` };
    }
    return { ok: true, bukti: /bukti/i.test(text) || !!body.buktiBase64 };
  } catch (err) {
    return { ok: false, skip: false, error: err.message };
  }
}

async function postSheet(body) {
  const SHEET_WEBHOOK = webhookUrl();
  if (!SHEET_WEBHOOK) return { ok: false, skip: true };
  try {
    const res = await fetch(SHEET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow",
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) return { ok: false, skip: false, error: `HTTP ${res.status}` };
    return { ok: true, text };
  } catch (err) {
    return { ok: false, skip: false, error: err.message };
  }
}

async function resetSheet() {
  const r = await postSheet({ action: "reset" });
  return r;
}

async function cleanupSheet() {
  return postSheet({ action: "cleanup" });
}

async function newMonth(month) {
  return postSheet({
    action: "newMonth",
    month: month || ledger.monthKey(),
  });
}

async function rotateMonthIfNeeded() {
  const month = ledger.monthKey();
  const state = ledger.load();
  if (state.lastSheetMonth === month) return { ok: true, skipped: true };
  const r = await newMonth(month);
  const next = ledger.load();
  next.lastSheetMonth = month;
  ledger.save(next);
  return r;
}

module.exports = { appendCostSeo, resetSheet, cleanupSheet, newMonth, rotateMonthIfNeeded, SHEET_ID };
