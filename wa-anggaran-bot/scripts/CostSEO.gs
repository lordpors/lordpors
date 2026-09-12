/**
 * Paste ke: spreadsheet Cost SEO → Ekstensi → Apps Script
 * Setelah edit: Deploy → Manage deployments → Edit → New version
 * Lalu Run setupHeaders sekali (izin Drive + Sheets).
 */

var SHEET_ID = "1HVtpuXBVkBFMIF-ydRRTTlhasRk1Dg7V23uKBiXY4Sg";
var TAB = "Cost SEO";
var HEADERS = [
  "Tanggal",
  "Jam",
  "Tipe",
  "Jumlah",
  "Keperluan",
  "Dicatat oleh",
  "Bulan",
  "ID",
  "Sumber",
  "Bukti",
  "Mata Uang",
];

function buktiFolder() {
  var name = "Cost SEO Bukti";
  var it = DriveApp.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(name);
}

function toAmount_(v) {
  if (typeof v === "number" && isFinite(v)) return v;
  var s = String(v == null ? "" : v).trim();
  if (!s) return 0;
  s = s.replace(/\s/g, "").replace(/^(Rp|rp|RP|\$)/, "");
  if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  else if (s.indexOf(",") >= 0 && s.indexOf(".") >= 0) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else {
    s = s.replace(/,/g, "");
  }
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function formatJumlah_(cell, currency) {
  if (currency === "USD") cell.setNumberFormat("$#,##0.00;($#,##0.00)");
  else cell.setNumberFormat("\"Rp\"#,##0;\"-Rp\"#,##0");
}

function removeRekap_(ss) {
  var recap = ss.getSheetByName("Rekap");
  if (recap && ss.getSheets().length > 1) ss.deleteSheet(recap);
}

var VALID_COSTS = [
  { tanggal: "2026-08-21", jam: "15:54:39", tipe: "Keluar", jumlah: 35, keperluan: "pembelian domain : macanterbang.id", bulan: "2026-08", id: 1, currency: "USD" },
  { tanggal: "2026-08-22", jam: "19:34:33", tipe: "Keluar", jumlah: 6.55, keperluan: "subscribe heylink miaw", bulan: "2026-08", id: 2, currency: "USD" },
  { tanggal: "2026-08-22", jam: "19:35:24", tipe: "Keluar", jumlah: 48.04, keperluan: "subscribe heylink miaw tahunan", bulan: "2026-08", id: 3, currency: "USD" },
  { tanggal: "2026-08-30", jam: "20:41:33", tipe: "Keluar", jumlah: 12.99, keperluan: "pembelian domain : miawslot1.com", bulan: "2026-08", id: 4, currency: "USD" },
  { tanggal: "2026-08-30", jam: "20:41:33", tipe: "Keluar", jumlah: 23.19, keperluan: "renewal domain : xtreme-technology.com (2 year)", bulan: "2026-08", id: 5, currency: "USD" },
];

function buktiKey_(note, id) {
  var n = String(note || "").toLowerCase();
  if (n.indexOf("macanterbang") >= 0) return "macanterbang";
  if (n.indexOf("tahunan") >= 0) return "heylink-tahun";
  if (n.indexOf("heylink") >= 0) return "heylink";
  if (n.indexOf("miawslot") >= 0) return "miawslot";
  if (n.indexOf("xtreme") >= 0) return "xtreme";
  if (id) return "id:" + id;
  return "";
}

function saveBuktiFile_(base64, mime, id) {
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64),
    mime || "image/jpeg",
    "bukti-" + (id || Date.now()) + ".jpg"
  );
  var file = buktiFolder().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://drive.google.com/uc?export=view&id=" + file.getId();
}

function setBuktiCell_(sh, row, url) {
  if (!url) return;
  sh.setRowHeight(row, 21);
  sh.getRange(row, 10).setFormula('=HYPERLINK("' + url + '","Lihat bukti")');
}

function collectBuktiMap_(sh) {
  var map = {};
  var last = sh.getLastRow();
  if (last < 2) return map;
  for (var r = 2; r <= last; r++) {
    var formula = String(sh.getRange(r, 10).getFormula() || "");
    var m = formula.match(/HYPERLINK\("([^"]+)"/i);
    if (!m) continue;
    var id = String(sh.getRange(r, 8).getDisplayValue() || "").trim();
    var note = sh.getRange(r, 5).getDisplayValue();
    var key = buktiKey_(note, id);
    if (key) map[key] = m[1];
    if (id) map["id:" + id] = m[1];
  }
  return map;
}

function writeValidRow_(sh, item, buktiUrl) {
  sh.appendRow([
    item.tanggal,
    item.jam,
    item.tipe,
    item.jumlah,
    item.keperluan,
    "lordpors",
    item.bulan,
    item.id,
    "WhatsApp",
    "",
    item.currency,
  ]);
  var row = sh.getLastRow();
  formatJumlah_(sh.getRange(row, 4), item.currency);
  setBuktiCell_(sh, row, buktiUrl);
}

function setupValidCosts() {
  var sh = ensureSheet();
  var bukti = collectBuktiMap_(sh);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, sh.getMaxColumns()).clearContent();
  var leftover = sh.getImages();
  for (var i = 0; i < leftover.length; i++) leftover[i].remove();
  for (var i = 0; i < VALID_COSTS.length; i++) {
    var item = VALID_COSTS[i];
    var key = buktiKey_(item.keperluan, item.id);
    var url = bukti[key] || bukti["id:" + item.id] || "";
    writeValidRow_(sh, item, url);
  }
  return "ok valid " + VALID_COSTS.length;
}

function attachBuktiToId_(id, base64, mime) {
  var sh = ensureSheet();
  var url = saveBuktiFile_(base64, mime, id);
  var last = sh.getLastRow();
  for (var r = 2; r <= last; r++) {
    if (String(sh.getRange(r, 8).getDisplayValue()) === String(id)) {
      setBuktiCell_(sh, r, url);
      formatJumlah_(sh.getRange(r, 4), "USD");
      return url;
    }
  }
  return url;
}

function findExistingRow_(sh, r) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var id = String(r.id || "").trim();
  if (!id) return 0;
  for (var row = 2; row <= last; row++) {
    var rid = String(sh.getRange(row, 8).getDisplayValue() || "").trim();
    if (rid === id) return row;
  }
  return 0;
}

/** Pindahkan bukti miawslot dari baris dobel ke baris 5, hapus baris 7, pasang $ */
function pindahBuktiKeBaris5() {
  var sh = ensureSheet();
  var last = sh.getLastRow();
  var target = 0;
  var url = "";
  var dup = [];
  for (var r = 2; r <= last; r++) {
    var note = String(sh.getRange(r, 5).getDisplayValue() || "").toLowerCase();
    if (note.indexOf("miawslot") < 0) continue;
    if (!target) target = r;
    else dup.push(r);
    var formula = String(sh.getRange(r, 10).getFormula() || "");
    var m = formula.match(/HYPERLINK\("([^"]+)"/i);
    if (m) url = m[1];
  }
  if (target) {
    sh.getRange(target, 4).setValue(12.99);
    formatJumlah_(sh.getRange(target, 4), "USD");
    sh.getRange(target, 11).setValue("USD");
    if (url) setBuktiCell_(sh, target, url);
  }
  for (var i = dup.length - 1; i >= 0; i--) sh.deleteRow(dup[i]);
  last = sh.getLastRow();
  for (var r = 2; r <= last; r++) {
    var cur = String(sh.getRange(r, 11).getDisplayValue() || "").toUpperCase();
    if (cur === "USD") formatJumlah_(sh.getRange(r, 4), "USD");
    var note = String(sh.getRange(r, 5).getDisplayValue() || "");
    if (/xtreme/i.test(note) && /1 year/i.test(note)) {
      sh.getRange(r, 5).setValue("renewal domain : xtreme-technology.com (2 year)");
    }
    if (/suscribe/i.test(note)) {
      sh.getRange(r, 5).setValue(note.replace(/suscribe/ig, "subscribe"));
    }
  }
  return "ok baris " + target;
}

function cleanupIdrTypo() {
  var sh = ensureSheet();
  var last = sh.getLastRow();
  if (last < 2) return "ok kosong";
  for (var r = last; r >= 2; r--) {
    var tanggal = String(sh.getRange(r, 1).getDisplayValue() || "").trim();
    var tipe = String(sh.getRange(r, 3).getDisplayValue() || "").trim();
    var jumlahCell = sh.getRange(r, 4);
    var jumlah = toAmount_(jumlahCell.getValue() || jumlahCell.getDisplayValue());
    var keperluan = String(sh.getRange(r, 5).getDisplayValue() || "").trim();
    var bulan = String(sh.getRange(r, 7).getDisplayValue() || "").trim();
    var currency = String(sh.getRange(r, 11).getDisplayValue() || "").trim().toUpperCase();
    var display = String(jumlahCell.getDisplayValue() || "");

    if (!tanggal && !jumlah && !keperluan) {
      sh.deleteRow(r);
      continue;
    }
    if (!jumlah && !keperluan) {
      sh.deleteRow(r);
      continue;
    }
    if (display.indexOf("$") >= 0) currency = "USD";
    if (currency === "IDR" && jumlah > 0 && jumlah < 1000) {
      if (jumlah >= 100 && jumlah === Math.floor(jumlah)) jumlah = jumlah / 100;
      currency = "USD";
    }
    if (currency !== "IDR") currency = "USD";

    sh.getRange(r, 4).setValue(jumlah);
    sh.getRange(r, 11).setValue(currency);
    formatJumlah_(sh.getRange(r, 4), currency);
    if (!tipe) sh.getRange(r, 3).setValue("Keluar");
    if (!bulan && tanggal) sh.getRange(r, 7).setValue(String(tanggal).slice(0, 7));
  }
  removeRekap_(SpreadsheetApp.openById(SHEET_ID));
  return "ok cleanup";
}

function ensureSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(TAB);
  if (!sh) sh = ss.insertSheet(TAB);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  sh.setFrozenRows(1);
  sh.setColumnWidth(10, 140);
  if (sh.getMaxColumns() > HEADERS.length) {
    sh.deleteColumns(HEADERS.length + 1, sh.getMaxColumns() - HEADERS.length);
  }
  var imgs = sh.getImages();
  for (var i = 0; i < imgs.length; i++) imgs[i].remove();
  removeRekap_(ss);
  return sh;
}

function currentMonthWib_() {
  return Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM");
}

function monthOfRow_(sh, r) {
  var cell = sh.getRange(r, 7);
  var display = String(cell.getDisplayValue() || "").trim();
  var m = display.match(/(\d{4})[-\/](\d{1,2})/);
  if (m) return m[1] + "-" + ("0" + m[2]).slice(-2);
  var v = cell.getValue();
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, "Asia/Jakarta", "yyyy-MM");
  }
  return display.slice(0, 7);
}

function archiveSheet_(ss, month) {
  var arch = ss.getSheetByName(month);
  var main = ss.getSheetByName(TAB);
  if (!arch) {
    arch = ss.insertSheet(month);
    if (main) {
      main.getRange(1, 1, 1, HEADERS.length).copyTo(arch.getRange(1, 1, 1, HEADERS.length));
    } else {
      arch.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      arch.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }
    arch.setFrozenRows(1);
    arch.setColumnWidth(10, 140);
  }
  return arch;
}

/** Arsip bulan lama ke tab sendiri, Cost SEO hanya bulan ini, ID ulang dari 1. */
function archiveOldMonths_(currentMonth) {
  currentMonth = currentMonth || currentMonthWib_();
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(TAB);
  if (!sh) return "no sheet";
  var last = sh.getLastRow();
  if (last < 2) return "ok kosong " + currentMonth;
  var byMonth = {};
  for (var r = 2; r <= last; r++) {
    var m = monthOfRow_(sh, r);
    if (!m || m === currentMonth) continue;
    if (!byMonth[m]) byMonth[m] = [];
    byMonth[m].push(r);
  }
  var months = Object.keys(byMonth);
  for (var i = 0; i < months.length; i++) {
    var month = months[i];
    var arch = archiveSheet_(ss, month);
    var rows = byMonth[month];
    for (var j = 0; j < rows.length; j++) {
      var dest = Math.max(arch.getLastRow() + 1, 2);
      sh.getRange(rows[j], 1, 1, HEADERS.length).copyTo(arch.getRange(dest, 1, 1, HEADERS.length));
    }
  }
  var del = [];
  for (var i = 0; i < months.length; i++) del = del.concat(byMonth[months[i]]);
  del.sort(function (a, b) { return b - a; });
  for (var k = 0; k < del.length; k++) sh.deleteRow(del[k]);
  last = sh.getLastRow();
  var id = 1;
  for (var r = 2; r <= last; r++) {
    sh.getRange(r, 8).setValue(id++);
    var cur = String(sh.getRange(r, 11).getDisplayValue() || "USD").toUpperCase();
    formatJumlah_(sh.getRange(r, 4), cur === "IDR" ? "IDR" : "USD");
  }
  return "ok " + currentMonth + (months.length ? " arsip " + months.join(",") : "");
}

function resetBulanBaru() {
  return archiveOldMonths_(currentMonthWib_());
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  if (data.action === "cleanup") {
    return ContentService.createTextOutput(cleanupIdrTypo());
  }
  if (data.action === "newMonth") {
    return ContentService.createTextOutput(archiveOldMonths_(data.month || currentMonthWib_()));
  }
  if (data.action === "syncValid") {
    var msg = setupValidCosts();
    if (data.buktiBase64 && data.buktiId) {
      attachBuktiToId_(data.buktiId, data.buktiBase64, data.buktiMime);
      msg += " bukti";
    }
    return ContentService.createTextOutput(msg);
  }
  if (data.action === "attachBukti") {
    var url = attachBuktiToId_(data.buktiId || 4, data.buktiBase64, data.buktiMime);
    return ContentService.createTextOutput(url ? "ok bukti" : "ok");
  }
  var sh = ensureSheet();
  if (data.action === "reset") {
    var last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, sh.getMaxColumns()).clear();
    var leftover = sh.getImages();
    for (var i = 0; i < leftover.length; i++) leftover[i].remove();
    removeRekap_(SpreadsheetApp.openById(SHEET_ID));
    return ContentService.createTextOutput("ok reset");
  }
  var r = data.row || {};
  var buktiUrl = "";
  if (data.buktiBase64) {
    buktiUrl = saveBuktiFile_(data.buktiBase64, data.buktiMime, r.id);
  }
  var currency = r.currency === "USD" ? "USD" : "IDR";
  var jumlah = toAmount_(r.jumlah);
  var row = findExistingRow_(sh, r);
  if (row) {
    if (r.tanggal) sh.getRange(row, 1).setValue(r.tanggal);
    if (r.jam) sh.getRange(row, 2).setValue(r.jam);
    if (r.tipe) sh.getRange(row, 3).setValue(r.tipe);
    sh.getRange(row, 4).setValue(jumlah);
    if (r.keperluan) sh.getRange(row, 5).setValue(r.keperluan);
    sh.getRange(row, 11).setValue(currency);
    formatJumlah_(sh.getRange(row, 4), currency);
    if (buktiUrl) setBuktiCell_(sh, row, buktiUrl);
    return ContentService.createTextOutput(buktiUrl ? "ok bukti" : "ok");
  }
  sh.appendRow([
    r.tanggal || "",
    r.jam || "",
    r.tipe || "",
    jumlah,
    r.keperluan || "",
    r.siapa || "lordpors",
    r.bulan || "",
    r.id || "",
    r.sumber || "WhatsApp",
    "",
    currency,
  ]);
  row = sh.getLastRow();
  formatJumlah_(sh.getRange(row, 4), currency);
  if (buktiUrl) setBuktiCell_(sh, row, buktiUrl);
  return ContentService.createTextOutput(buktiUrl ? "ok bukti" : "ok");
}

function setupHeaders() {
  ensureSheet();
  cleanupIdrTypo();
}
