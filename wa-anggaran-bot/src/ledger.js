const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DATA_DIR, "ledger.json");

function empty() {
  return {
    groupJid: "",
    nextId: 1,
    ownerLid: "",
    pending: null,
    lastSheetMonth: "",
    entries: [],
  };
}

function load() {
  try {
    return { ...empty(), ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
  } catch {
    return empty();
  }
}

function save(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

function monthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLocalId(entry) {
  const same = load().entries.filter((e) => e.month === entry.month);
  const idx = same.findIndex((e) => e.id === entry.id);
  return idx >= 0 ? idx + 1 : same.length;
}

function rupiah(n) {
  const abs = Math.abs(Math.round(n));
  const s = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (n < 0 ? "-Rp" : "Rp") + s;
}

function usd(n) {
  const abs = Math.abs(Number(n) || 0).toFixed(2);
  return (n < 0 ? "-$" : "$") + abs;
}

function money(n, currency) {
  return currency === "USD" ? usd(n) : rupiah(n);
}

function peekNextId(state) {
  const maxId = (state.entries || []).reduce(
    (m, e) => Math.max(m, Number(e.id) || 0),
    0
  );
  return Math.max(Number(state.nextId) || 1, maxId + 1);
}

function add(author, type, amount, note, currency) {
  const state = load();
  const id = peekNextId(state);
  const entry = {
    id,
    ts: new Date().toISOString(),
    month: monthKey(),
    author,
    type,
    amount,
    currency: currency === "USD" ? "USD" : "IDR",
    note: (note || "").trim().slice(0, 80),
  };
  state.entries.push(entry);
  state.nextId = id + 1;
  save(state);
  return entry;
}

function setPending(pending) {
  const state = load();
  state.pending = pending;
  save(state);
}

function clearPending() {
  const state = load();
  state.pending = null;
  save(state);
}

function resetAll() {
  const state = load();
  const n = state.entries.length;
  state.entries = [];
  state.nextId = 1;
  state.pending = null;
  save(state);
  return n;
}

function undo(author) {
  const state = load();
  for (let i = state.entries.length - 1; i >= 0; i--) {
    if (state.entries[i].author === author) {
      const [removed] = state.entries.splice(i, 1);
      save(state);
      return removed;
    }
  }
  return null;
}

function monthEntries(month) {
  return load().entries.filter((e) => e.month === month);
}

function bucket() {
  return { masuk: 0, keluar: 0, saldo: 0 };
}

function totals(month) {
  const rows = monthEntries(month);
  const idr = bucket();
  const usdTot = bucket();
  for (const e of rows) {
    const b = e.currency === "USD" ? usdTot : idr;
    if (e.type === "in") b.masuk += e.amount;
    else b.keluar += e.amount;
  }
  idr.saldo = idr.masuk - idr.keluar;
  usdTot.saldo = usdTot.masuk - usdTot.keluar;
  return { rows, idr, usd: usdTot };
}

function hasCurrency(bucket) {
  return Math.abs(bucket.masuk) > 0 || Math.abs(bucket.keluar) > 0;
}

/** Typo 6.55 tanpa $ jadi IDR 655/659. Belum ada pengeluaran IDR nyata. */
function fixIdrTypo() {
  const state = load();
  const usdNotes = new Set(
    state.entries
      .filter((e) => e.currency === "USD")
      .map((e) => String(e.note || "").toLowerCase().trim())
  );
  const keep = [];
  let converted = 0;
  let removed = 0;
  for (const e of state.entries) {
    if (e.currency === "USD") {
      keep.push(e);
      continue;
    }
    const noteKey = String(e.note || "").toLowerCase().trim();
    if (noteKey && usdNotes.has(noteKey)) {
      removed += 1;
      continue;
    }
    const amt = Number(e.amount);
    if (amt > 0 && amt < 100) {
      e.amount = Math.round(amt * 100) / 100;
      e.currency = "USD";
      keep.push(e);
      if (noteKey) usdNotes.add(noteKey);
      converted += 1;
      continue;
    }
    if (Number.isInteger(amt) && amt >= 100 && amt < 1000) {
      e.amount = Math.round(amt) / 100;
      e.currency = "USD";
      keep.push(e);
      if (noteKey) usdNotes.add(noteKey);
      converted += 1;
      continue;
    }
    removed += 1;
  }
  state.entries = keep;
  save(state);
  return { converted, removed, changed: converted + removed > 0 };
}

function applyCanonicalCosts() {
  const seedFile = path.join(__dirname, "canonical-costs.json");
  const flagFile = path.join(DATA_DIR, "canonical-applied.txt");
  if (!fs.existsSync(seedFile)) return { applied: false };
  let seed;
  try {
    seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  } catch {
    return { applied: false };
  }
  if (!Array.isArray(seed.entries) || !seed.entries.length) return { applied: false };
  const version = String(seed.version || "1");
  const applied = fs.existsSync(flagFile)
    ? fs.readFileSync(flagFile, "utf8").trim()
    : "";
  if (applied === version) return { applied: false, nextId: peekNextId(load()) };
  const state = load();
  state.entries = seed.entries;
  state.nextId = Number(seed.nextId) || peekNextId({ ...state, entries: seed.entries });
  state.pending = null;
  save(state);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(flagFile, version);
  return { applied: true, count: seed.entries.length, nextId: state.nextId };
}

module.exports = {
  load,
  save,
  monthKey,
  rupiah,
  usd,
  money,
  add,
  undo,
  resetAll,
  totals,
  hasCurrency,
  fixIdrTypo,
  applyCanonicalCosts,
  monthLocalId,
  setPending,
  clearPending,
};
