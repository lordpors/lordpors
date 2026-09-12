process.env.TZ = process.env.TZ || "Asia/Jakarta";

const path = require("path");
const qrcode = require("qrcode-terminal");

/* Kantor LordPors — penerima QR & kehadiran.
   Bot ini jalan di PC yang sama, jadi cukup localhost. Kuncinya sama
   dengan yang dipakai skrip detak. */
const KANTOR_QR = "http://127.0.0.1:8790";
const KANTOR_KUNCI = "kKEXGCMhez5eCMnfIukF4d3bb39Up4qA";

function kirimKeKantor(jalur, badan) {
  return fetch(KANTOR_QR + jalur, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Kunci": KANTOR_KUNCI },
    body: JSON.stringify(badan),
  }).catch(() => {});
}
function kirimQrKeKantor(teks) { return kirimKeKantor("/qr", { teks }); }
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const ledger = require("./ledger");
const sheets = require("./sheets");

const SHEET_COST_URL =
  "https://docs.google.com/spreadsheets/d/1HVtpuXBVkBFMIF-ydRRTTlhasRk1Dg7V23uKBiXY4Sg/edit#gid=0";

function sheetLinks() {
  return `Cost SEO:\n${SHEET_COST_URL}`;
}

const AUTH_DIR = path.join(__dirname, "..", "auth");
const logger = pino({ level: "silent" });

const OWNER_NUMBER = "6281225468821";
const OWNER_NAME = "lordpors";

function digits(jid) {
  let d = String(jid || "").split("@")[0].replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return d;
}

function senderIds(m) {
  return [
    m.key?.participant,
    m.key?.participantAlt,
    m.key?.participantPn,
    m.key?.remoteJid,
    m.participant,
    m.senderPn,
    m.sender,
  ].filter(Boolean);
}

function isBotReply(text) {
  return /^(Tercatat|Dihapus|Cost SEO|Bukti Cost SEO|Jumlah |Keperluan:|Grup ini|Ketuk sekali|Sheet:|Sisa typo|Saldo bulan)/i.test(
    String(text || "")
  );
}

let lastProofBuf = null;
let restarting = false;
let reconnectWait = 3000;

function unwrapMessage(msg) {
  if (!msg) return {};
  return (
    msg.viewOnceMessage?.message ||
    msg.viewOnceMessageV2?.message ||
    msg.viewOnceMessageV2Extension?.message ||
    msg.ephemeralMessage?.message ||
    msg
  );
}

function textOf(msg) {
  const inner = unwrapMessage(msg);
  return (
    inner.conversation ||
    inner.extendedTextMessage?.text ||
    inner.imageMessage?.caption ||
    inner.videoMessage?.caption ||
    inner.documentMessage?.caption ||
    ""
  ).trim();
}

async function downloadProof(sock, m) {
  const inner = unwrapMessage(m.message);
  if (!inner.imageMessage) return null;
  try {
    return await downloadMediaMessage(
      { ...m, message: inner },
      "buffer",
      {},
      { logger, reuploadRequest: sock.updateMediaMessage }
    );
  } catch (err) {
    console.error("download gambar:", err.message);
    return null;
  }
}

function botIsOwner(sock) {
  const ids = [sock.user?.id, sock.user?.lid, sock.user?.pn, sock.user?.jid];
  return ids.some((id) => digits(id) === OWNER_NUMBER);
}

async function isOwner(sock, m, state) {
  if (m.key.fromMe) return true;
  for (const id of senderIds(m)) {
    if (digits(id) === OWNER_NUMBER) return true;
    const lid = String(id || "");
    if (state.ownerLid && (lid === state.ownerLid || lid.split("@")[0] === String(state.ownerLid).split("@")[0])) {
      return true;
    }
  }
  try {
    const meta = await sock.groupMetadata(m.key.remoteJid);
    const partId = m.key.participant;
    for (const p of meta.participants || []) {
      const ids = [p.id, p.lid, p.jid, p.phoneNumber].filter(Boolean);
      const same = ids.some((id) => id === partId);
      if (!same && !m.key.fromMe) continue;
      if (ids.some((id) => digits(id) === OWNER_NUMBER)) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function rememberOwner(m, state) {
  const lid = senderIds(m).find((id) => String(id).endsWith("@lid"));
  if (lid && state.ownerLid !== lid) {
    state.ownerLid = lid;
    ledger.save(state);
  }
}

function parseIdr(raw) {
  const s = String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/rp|rupiah/g, "");
  const m = s.match(/^([\d.,]+)(rb|ribu|k|jt|juta)?$/);
  if (!m) return null;
  let n = Number(m[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const u = m[2] || "";
  if (u === "rb" || u === "ribu" || u === "k") n *= 1000;
  if (u === "jt" || u === "juta") n *= 1000000;
  return Math.round(n);
}

function parseUsd(raw) {
  let s = String(raw)
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/usd/gi, "");
  if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 1e12) return null;
  return Math.round(n * 100) / 100;
}

function classifyMoney(raw) {
  const original = String(raw || "").trim();
  if (!original) return { amount: null, currency: "IDR" };
  const compact = original.replace(/\s+/g, "");
  if (/\$/i.test(compact) || /^usd/i.test(compact)) {
    return { amount: parseUsd(original), currency: "USD" };
  }
  if (/rp|rupiah/i.test(compact)) {
    return { amount: parseIdr(original), currency: "IDR" };
  }
  const core = compact.replace(/^(rp|usd)/i, "");
  if (/(rb|ribu|k|jt|juta)$/i.test(core)) {
    return { amount: parseIdr(core), currency: "IDR" };
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(core)) {
    return { amount: parseIdr(core), currency: "IDR" };
  }
  if (/^\d+[.,]\d{1,2}$/.test(core)) {
    return { amount: parseUsd(core), currency: "USD" };
  }
  return { amount: parseIdr(core), currency: "IDR" };
}

function extractMoney(text) {
  const t = String(text || "");
  const usdM = t.match(/\$\s*([\d.,]+)/);
  if (usdM) {
    const amount = parseUsd(usdM[1]);
    if (amount) return { currency: "USD", amount, raw: usdM[0] };
  }
  const rpM = t.match(/rp\s*[\d.,]+/i);
  if (rpM) {
    const got = classifyMoney(rpM[0]);
    if (got.amount) return { ...got, raw: rpM[0] };
  }
  const thouM = t.match(/\d{1,3}(?:\.\d{3})+/);
  if (thouM) {
    const amount = parseIdr(thouM[0]);
    if (amount) return { currency: "IDR", amount, raw: thouM[0] };
  }
  const decM = t.match(/(^|[^\d])(\d{1,6}[.,]\d{1,2})(?![\d])/);
  if (decM && !/^\d{1,3}(\.\d{3})+$/.test(decM[2])) {
    const amount = parseUsd(decM[2]);
    if (amount) return { currency: "USD", amount, raw: decM[2] };
  }
  const unitM = t.match(/\d+(?:[.,]\d+)?\s*(?:rb|ribu|k|jt|juta)/i);
  if (unitM) {
    const amount = parseIdr(unitM[0]);
    if (amount) return { currency: "IDR", amount, raw: unitM[0] };
  }
  const intM = t.match(/(^|[^\d])(\d{4,})(?![\d])/);
  if (intM) {
    const amount = parseIdr(intM[2]);
    if (amount) return { currency: "IDR", amount, raw: intM[2] };
  }
  return null;
}

function stripNoise(note) {
  return String(note || "")
    .replace(/^(untuk|buat|beli|belanja|keperluan|yg|yang|adalah)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function parseNatural(text) {
  const t = text.replace(/\u00a0/g, " ").trim();
  const lower = t.toLowerCase();
  const money = extractMoney(t);
  const amount = money ? money.amount : null;
  const currency = money ? money.currency : "IDR";
  const expenseCue = /(habis|keluar|bayar|beli|belanja|anggaran|cost|spent|pengeluaran)/i.test(
    lower
  );
  const incomeCue = /(masuk|gaji|pemasukan|terima|refund)/i.test(lower);

  if (!amount && !expenseCue && !incomeCue) return null;

  let note = t
    .replace(money ? money.raw : "", " ")
    .replace(/^(habis|keluar|bayar|beli|belanja|masuk|anggaran|cost)\s+/i, "")
    .replace(/\b(rp|rupiah|usd)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  note = stripNoise(note);

  if (amount && (expenseCue || incomeCue || note)) {
    return {
      cmd: "add",
      type: incomeCue && !expenseCue ? "in" : "out",
      amount,
      currency,
      note,
    };
  }
  if (amount && !note) {
    return { cmd: "need_note", type: "out", amount, currency };
  }
  return null;
}

function parseCommand(text) {
  const t = text.replace(/\u00a0/g, " ").trim();
  const lower = t.toLowerCase();

  if (lower === "!bot" || lower === "!daftar" || lower === "daftar grup") return { cmd: "daftar" };
  if (lower === "bantuan" || lower === "help" || lower === "!help") {
    return { cmd: "help" };
  }
  if (lower === "saldo") return { cmd: "saldo" };
  if (lower === "hapus terakhir") return { cmd: "undo" };
  if (lower === "hapus semua konfirmasi") return { cmd: "reset_yes" };
  if (lower === "hapus semua") return { cmd: "reset_ask" };
  if (lower === "hapus idr") return { cmd: "purge_idr" };
  if (lower === "bulan baru") return { cmd: "new_month" };

  let m = t.match(/^\+\s*(\$?\s*[\d.,]+)\s*(.*)$/);
  if (m) {
    const got = classifyMoney(m[1]);
    return { cmd: "add", type: "in", amount: got.amount, currency: got.currency, note: m[2] };
  }
  m = t.match(/^-\s*(\$?\s*[\d.,]+)\s*(.*)$/);
  if (m) {
    const got = classifyMoney(m[1]);
    return { cmd: "add", type: "out", amount: got.amount, currency: got.currency, note: m[2] };
  }
  m = t.match(/^masuk\s+(\$?\s*[\d.,]+)\s*(.*)$/i);
  if (m) {
    const got = classifyMoney(m[1]);
    return { cmd: "add", type: "in", amount: got.amount, currency: got.currency, note: m[2] };
  }
  m = t.match(/^keluar\s+(\$?\s*[\d.,]+)\s*(.*)$/i);
  if (m) {
    const got = classifyMoney(m[1]);
    return { cmd: "add", type: "out", amount: got.amount, currency: got.currency, note: m[2] };
  }

  return parseNatural(t);
}

function helpText() {
  return [
    "Bot Cost SEO",
    "",
    "!bot                       daftar grup",
    "habis 50rb beli domain     (IDR)",
    "habis $12 beli tool        (USD)",
    "-$5.99 ssl",
    "-12000 tools",
    "+$10 refund",
    "saldo",
    "hapus terakhir",
    "hapus semua",
    "hapus idr",
    "bulan baru",
    "bantuan",
    "",
    "Kirim screenshot bukti, caption: habis 50rb domain",
    "",
    sheetLinks(),
  ].join("\n");
}

function tanggalId() {
  return new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function confirmAdd(sock, jid, author, type, amount, note, currency, imageBuf) {
  await sheets.rotateMonthIfNeeded();
  const cur = currency === "USD" ? "USD" : "IDR";
  const e = ledger.add(author, type, amount, note, cur);
  ledger.clearPending();
  const sign = e.type === "in" ? "+" : "-";
  const proof = imageBuf || lastProofBuf;
  lastProofBuf = null;
  const sheet = await sheets.appendCostSeo(e, proof);
  let sheetLine = "Sudah masuk sheet :";
  if (sheet.skip) sheetLine = "Sheet: belum disambung.";
  else if (!sheet.ok) sheetLine = "Sheet gagal: " + (sheet.error || "error");
  else if (sheet.bukti) sheetLine = "Sudah masuk sheet (bukti terlampir) :";
  const t = ledger.totals(e.month);
  const text = [
    `Cost SEO (${tanggalId()})`,
    `Senilai : ${sign}${ledger.money(e.amount, e.currency)}`,
    e.note ? `Keperluan : ${e.note}` : "",
    "",
    ...saldoLines(t),
    "",
    sheetLine,
    sheetLinks(),
  ]
    .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
    .join("\n");
  await sock.sendMessage(jid, { text });
}

function saldoLines(t) {
  const lines = ["Saldo bulan ini (bukan kurs):"];
  if (ledger.hasCurrency(t.idr)) {
    lines.push(`IDR : ${ledger.money(t.idr.saldo, "IDR")}`);
  }
  if (ledger.hasCurrency(t.usd) || !ledger.hasCurrency(t.idr)) {
    lines.push(`USD : ${ledger.money(t.usd.saldo, "USD")}`);
  }
  return lines;
}

async function runIdrCleanup() {
  const n = ledger.fixIdrTypo();
  const sheet = await sheets.cleanupSheet();
  return { ...n, sheet };
}

async function handle(sock, m) {
  if (!m?.message) return;
  const jid = m.key.remoteJid;
  const raw = textOf(m.message);
  const rawLower = raw.toLowerCase().trim();
  if (!jid || jid === "status@broadcast") return;
  if (!jid.endsWith("@g.us")) {
    if (rawLower === "!bot" || rawLower === "!daftar") {
      await sock.sendMessage(jid, {
        text: "Ketik !bot di dalam GRUP Cost SEO, bukan chat pribadi.",
      });
    }
    console.log("[msg] bukan grup", jid, raw.slice(0, 40));
    return;
  }

  if (m.key.fromMe && isBotReply(raw)) return;

  const state = ledger.load();
  const owner = await isOwner(sock, m, state);
  console.log(
    "[msg]",
    "fromMe=" + !!m.key.fromMe,
    "owner=" + owner,
    "part=" + (m.key.participant || "-"),
    "text=" + raw.slice(0, 80)
  );
  if (!owner) {
    console.log("[msg] diabaikan, bukan owner");
    return;
  }
  rememberOwner(m, state);
  const author = OWNER_NUMBER;

  const proofBuf = await downloadProof(sock, m);
  if (proofBuf) lastProofBuf = proofBuf;
  if (state.groupJid && state.groupJid !== jid && rawLower !== "!bot" && rawLower !== "!daftar" && rawLower !== "daftar grup") {
    return;
  }

  if (state.pending && Date.now() - (state.pending.ts || 0) < 15 * 60 * 1000) {
    const p = state.pending;
    const asCmd = parseCommand(raw);
    if (asCmd && asCmd.cmd === "add") {
      await confirmAdd(sock, jid, author, asCmd.type, asCmd.amount, asCmd.note, asCmd.currency);
      return;
    }
    if (p.need === "note") {
      const note = stripNoise(raw);
      if (!note) {
        await sock.sendMessage(jid, { text: "Keperluannya apa? Contoh: beli domain" });
        return;
      }
      await confirmAdd(sock, jid, author, p.type || "out", p.amount, note, p.currency);
      return;
    }
    if (p.need === "amount") {
      const got = extractMoney(raw) || parseNatural(raw);
      const amount = got?.amount;
      if (!amount) {
        ledger.clearPending();
        return;
      }
      await confirmAdd(
        sock,
        jid,
        author,
        p.type || "out",
        amount,
        p.note || got.note,
        got.currency || p.currency || "IDR"
      );
      return;
    }
  }

  const parsed = parseCommand(raw);
  if (!parsed) return;

  if (parsed.cmd === "daftar") {
    state.groupJid = jid;
    state.pending = null;
    ledger.save(state);
    await sock.sendMessage(jid, {
      text: "Grup ini didaftarkan untuk Cost SEO.\n\n" + sheetLinks(),
    });
    return;
  }

  if (state.groupJid && state.groupJid !== jid) return;
  if (!state.groupJid) {
    await sock.sendMessage(jid, {
      text: "Ketuk sekali: !bot  (supaya bot pakai grup ini)",
    });
    return;
  }

  if (parsed.cmd === "help") {
    await sock.sendMessage(jid, { text: helpText() });
    return;
  }

  if (parsed.cmd === "need_note") {
    ledger.setPending({
      need: "note",
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      ts: Date.now(),
    });
    await sock.sendMessage(jid, {
      text: `Jumlah ${ledger.money(parsed.amount, parsed.currency)}. Untuk apa / beli apa?`,
    });
    return;
  }

  if (parsed.cmd === "add") {
    if (!parsed.amount) return;
    if (!parsed.note) {
      ledger.setPending({
        need: "note",
        type: parsed.type,
        amount: parsed.amount,
        currency: parsed.currency,
        ts: Date.now(),
      });
      await sock.sendMessage(jid, {
        text: `Jumlah ${ledger.money(parsed.amount, parsed.currency)}. Untuk apa / beli apa?`,
      });
      return;
    }
    await confirmAdd(sock, jid, author, parsed.type, parsed.amount, parsed.note, parsed.currency);
    return;
  }

  if (parsed.cmd === "new_month") {
    const month = ledger.monthKey();
    const sheet = await sheets.rotateMonthIfNeeded();
    let extra = "Sheet Cost SEO sekarang hanya " + month + ".";
    if (sheet.skip) extra = "Sheet belum disambung.";
    else if (!sheet.ok) extra = "Sheet gagal: " + (sheet.error || "error");
    else if (sheet.text) extra = String(sheet.text);
    await sock.sendMessage(jid, {
      text: "Bulan baru " + month + ".\n" + extra + "\nCost berikutnya ID 1 di baris 2, atau lanjut ID bulan ini.",
    });
    return;
  }

  if (parsed.cmd === "reset_ask") {
    await sock.sendMessage(jid, {
      text: "Ini menghapus SEMUA hitungan Cost SEO (bot + sheet).\nKetik persis:\nhapus semua konfirmasi",
    });
    return;
  }

  if (parsed.cmd === "reset_yes") {
    const n = ledger.resetAll();
    const sheet = await sheets.resetSheet();
    let extra = "";
    if (sheet.skip) extra = "\nSheet tidak disambung, hanya data bot yang direset.";
    else if (!sheet.ok) extra = "\nSheet gagal: " + (sheet.error || "error");
    else extra = "\nSheet Cost SEO juga dikosongkan.";
    await sock.sendMessage(jid, {
      text: "Semua hitungan dihapus (" + n + " transaksi)." + extra,
    });
    return;
  }

  if (parsed.cmd === "undo") {
    const removed = ledger.undo(author);
    if (!removed) {
      await sock.sendMessage(jid, { text: "Tidak ada transaksi milikmu yang bisa dihapus." });
      return;
    }
    await sock.sendMessage(jid, {
      text: `Dihapus: ${removed.type === "in" ? "+" : "-"}${ledger.money(removed.amount, removed.currency)} ${removed.note || ""}`.trim(),
    });
    return;
  }

  if (parsed.cmd === "purge_idr") {
    const n = await runIdrCleanup();
    await sock.sendMessage(jid, {
      text: [
        "Sisa typo IDR dibersihkan.",
        n.converted ? `Dipindah ke USD: ${n.converted}` : "",
        n.removed ? `Dihapus: ${n.removed}` : "",
        n.sheet?.ok ? "Sheet ikut dibersihkan." : n.sheet?.skip ? "Sheet belum disambung." : "Sheet: " + (n.sheet?.error || "gagal"),
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return;
  }

  if (parsed.cmd === "saldo") {
    const month = ledger.monthKey();
    const t = ledger.totals(month);
    const lines = [`Cost SEO saldo ${month}`];
    if (ledger.hasCurrency(t.idr)) {
      lines.push(
        `IDR  Masuk ${ledger.money(t.idr.masuk, "IDR")} · Keluar ${ledger.money(t.idr.keluar, "IDR")} · Saldo ${ledger.money(t.idr.saldo, "IDR")}`
      );
    }
    lines.push(
      `USD  Masuk ${ledger.money(t.usd.masuk, "USD")} · Keluar ${ledger.money(t.usd.keluar, "USD")} · Saldo ${ledger.money(t.usd.saldo, "USD")}`
    );
    lines.push(`${t.rows.length} transaksi`);
    await sock.sendMessage(jid, { text: lines.join("\n") });
    return;
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["CostSEO", "Chrome", "1.0"],
    markOnlineOnConnect: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      console.log("\nScan QR ini dengan WhatsApp nomor KHUSUS bot (bukan nomor blast):\n");
      qrcode.generate(qr, { small: true });
      // Kirim juga ke kantor supaya QR-nya bisa dipindai dari layar kantor,
      // bukan cuma dari terminal. Yang dikirim TEKS MENTAHNYA; kantor yang
      // menggambarnya jadi QR. Sengaja begitu supaya bot ini tidak perlu
      // pustaka tambahan -- npm tidak terpasang di PC ini.
      // Gagal mengirim tidak boleh menjatuhkan bot: QR di terminal tetap ada.
      kirimQrKeKantor(qr);
    }
    if (connection === "open") {
      reconnectWait = 3000;
      console.log("Terhubung sebagai", sock.user?.id || sock.user?.pn || "?");
      // Kehadiran auditor di kantor = sambungan WhatsApp yang benar-benar
      // terbuka. Bukan "prosesnya hidup" seperti dulu waktu ditebak dari
      // luar oleh skrip detak di HP -- ini kabar dari dalam.
      kirimKeKantor("/detak", { online: true, pesan: "WhatsApp tersambung" });
      console.log("Di grup ketik: !bot  lalu tes: habis $1 tes usd");
      const seeded = ledger.applyCanonicalCosts();
      if (seeded.applied) {
        console.log(
          "ledger diset ke " + seeded.count + " cost valid, next ID " + seeded.nextId
        );
      }
      const n = ledger.fixIdrTypo();
      if (n.changed) {
        console.log("typo IDR di ledger dibersihkan", n);
      }
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log("Koneksi tutup", code || "", loggedOut ? "(logout, scan ulang)" : "");
      // Kabari kantor supaya kursinya benar-benar kosong. Inilah bedanya
      // dengan cara lama: dulu kehadiran ditebak dari "prosesnya hidup",
      // jadi bot yang tersambungnya putus tetap terlihat duduk bekerja.
      kirimKeKantor("/detak", { online: false, pesan: loggedOut ? "logout" : "koneksi tutup" });
      if (loggedOut || restarting) return;
      restarting = true;
      const wait = code === 515 ? 1500 : reconnectWait;
      reconnectWait = Math.min(Math.round(reconnectWait * 1.5), 20000);
      setTimeout(() => {
        restarting = false;
        start().catch((err) => console.error(err));
      }, wait);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type && type !== "notify" && type !== "append") {
      console.log("[msg] type", type);
    }
    for (const m of messages) {
      try {
        await handle(sock, m);
      } catch (err) {
        console.error("handle:", err.message);
      }
    }
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
