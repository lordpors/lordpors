/* ============================================================
   LOG PEKERJAAN — kantor LordPors

   Berkas ini dulu bernama perintah.js dan berisi kotak obrolan,
   kotak surat daring, lampiran gambar, dan daftar perintah.
   Semuanya ditiadakan 11 September 2026 atas permintaan Porscy:
   Remote Control sudah jadi saluran bicara yang sebenarnya, dan
   kantor dikembalikan ke satu peran yang memang paling pas
   untuknya — MEMANTAU, bukan mengobrol.

   Yang tersisa cuma ini: mencatat kejadian, menyimpannya supaya
   tidak hilang saat halaman dimuat ulang, dan satu saklar
   sembunyi/tampil.

   Kalau suatu hari kotak obrolan mau dihidupkan lagi, jangan
   membangunnya di sini — riwayatnya ada di PROGRES.md, termasuk
   alasan kenapa ia dimatikan.
   ============================================================ */
(function () {
  'use strict';

  var elLog        = document.getElementById('log');
  var elLencanaLog = document.getElementById('lencana-log');
  var elRingkas    = document.getElementById('ringkas-agen');

  var jumlahLog = 0;
  var KUNCI_LOG = 'kantor-log';
  var BATAS_LOG = 300;

  function jam() {
    var d = new Date();
    return ('0' + d.getHours()).slice(-2) + ':' +
           ('0' + d.getMinutes()).slice(-2) + ':' +
           ('0' + d.getSeconds()).slice(-2);
  }

  function amanHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* Log disimpan di peramban supaya TIDAK hilang tiap halaman dimuat
     ulang. Dulu ia cuma hidup di DOM: satu kali refresh dan seluruh
     catatan pekerjaan lenyap tanpa sisa. Isinya cuma catatan kejadian —
     tidak ada rahasia di dalamnya.

     Tidak ada tombol pengosong, dan itu disengaja: Porscy memintanya
     "tidak mudah hilang". Kalau memang perlu dikosongkan, hapus data
     situs ini lewat setelan peramban. */
  /* APA YANG PANTAS MASUK LOG.

     Log ini catatan PEKERJAAN, bukan catatan kunjungan. Yang berhak
     masuk cuma kejadian yang benar-benar terjadi di kantor: agen mulai
     dan selesai mengerjakan sesuatu, audit berjalan, situs diperiksa,
     ada yang gagal. Semua itu datang dari kantor.js lewat window.KANTOR.log.

     Yang TIDAK berhak: apa pun yang cuma akibat halaman dibuka —
     "kantor dibuka", "mode hiasan", "halaman dimuat ulang". Itu terulang
     tiap refresh dan menenggelamkan yang penting. Kalau nanti tergoda
     menambah catatan baru, tanyakan dulu: kalau Porscy membuka halaman
     ini lima kali, apakah barisnya ikut muncul lima kali? Kalau ya,
     jangan dicatat. */
  var KEBISINGAN = [
    'kantor dibuka',
    'kotak surat ditiadakan',
    'mode hiasan',
    'halaman dimuat ulang',
    'terhubung ke audit/status.json',
    'server kantor aktif',
    'kotak masuk daring aktif',
    'tanpa server',
    'pesan ditolak'
  ];
  function bising(teks) {
    // Hiasan di depan dibuang dulu — catatan lama seperti
    // "— halaman dimuat ulang —" tidak boleh lolos cuma karena
    // diawali tanda pisah.
    var t = String(teks || '').replace(/^[\s\u2014\u2013-]+/, '');
    for (var i = 0; i < KEBISINGAN.length; i++)
      if (t.indexOf(KEBISINGAN[i]) === 0) return true;
    return false;
  }

  function bacaLog() {
    var d;
    try { d = JSON.parse(localStorage.getItem(KUNCI_LOG) || '[]'); }
    catch (e) { return []; }
    if (!Array.isArray(d)) return [];
    // Riwayat lama ikut dibersihkan sekali, supaya catatan siklus halaman
    // yang terlanjur tersimpan tidak terus menumpuk di layar.
    var bersih = d.filter(function (x) { return !bising(x && x.t); });
    if (bersih.length !== d.length) simpanLog(bersih);
    return bersih;
  }
  function simpanLog(d) {
    try { localStorage.setItem(KUNCI_LOG, JSON.stringify(d.slice(-BATAS_LOG))); }
    catch (e) {}
  }

  function tulisLog(waktu, teks, jenis) {
    var kosong = elLog.querySelector('.kosong');
    if (kosong) kosong.remove();
    var d = document.createElement('div');
    d.className = 'log-baris ' + (jenis || 'info');
    d.innerHTML = '<span class="jam">' + amanHTML(waktu) + '</span>' +
                  '<span class="tanda"></span>' +
                  '<span class="teks">' + amanHTML(teks) + '</span>';
    /* Ikut turun HANYA kalau pembacanya memang sedang di bawah. Kalau
       dia sedang menggulir ke atas membaca catatan lama, menyeretnya
       kembali ke bawah tiap ada baris baru itu menyebalkan. */
    var diBawah = elLog.scrollHeight - elLog.scrollTop - elLog.clientHeight < 40;
    elLog.appendChild(d);
    if (diBawah) elLog.scrollTop = elLog.scrollHeight;
    jumlahLog++;
    elLencanaLog.textContent = jumlahLog;
    while (elLog.children.length > BATAS_LOG) elLog.removeChild(elLog.firstChild);
  }

  function catat(teks, jenis) {
    if (bising(teks)) return;
    var w = jam();
    tulisLog(w, teks, jenis);
    var d = bacaLog();
    d.push({ w: w, t: teks, j: jenis || 'info' });
    simpanLog(d);
  }

  // Catatan lama dikembalikan apa adanya, tanpa pembatas apa pun —
  // pembatas "halaman dimuat ulang" itu sendiri termasuk kebisingan.
  (function pulihkan() {
    var d = bacaLog();
    for (var i = 0; i < d.length; i++) tulisLog(d[i].w, d[i].t, d[i].j);
  })();

  // kantor.js memanggil ini saat status audit atau kehadiran agen berubah
  if (window.KANTOR) window.KANTOR.log = catat;

  /* ---------- saklar sembunyi/tampil ----------
     Pilihannya diingat, jadi kalau Porscy menutup log lalu menutup
     halaman, saat dibuka lagi tetap tertutup. */
  (function pasangSaklar() {
    var t = document.getElementById('tbl-log');
    if (!t) return;
    var kunci = 'kantor-sembunyi-log';
    var tersembunyi = false;
    try { tersembunyi = localStorage.getItem(kunci) === '1'; } catch (e) {}
    document.body.classList.toggle('tanpa-log', tersembunyi);
    t.classList.toggle('aktif', !tersembunyi);
    t.addEventListener('click', function () {
      var kini = document.body.classList.toggle('tanpa-log');
      t.classList.toggle('aktif', !kini);
      try { localStorage.setItem(kunci, kini ? '1' : '0'); } catch (e) {}
    });
  })();

  /* ---------- penanda mode di kepala halaman ----------
     Dulu penanda ini duduk di kartu Perintah. Kartunya sudah tidak ada,
     jadi pindah ke kepala halaman — tempat yang memang selalu terlihat. */
  /* Mode dicatat hanya saat BERUBAH, dan pengamatan pertama tidak
     pernah dicatat. Versi lama mencatatnya tiap halaman dibuka, jadi
     "mode hiasan" muncul berulang-ulang padahal tidak ada yang terjadi. */
  var modeLama = null;
  function perbaruiMode() {
    var nyata = !!(window.KANTOR && window.KANTOR.modeNyata && window.KANTOR.modeNyata());
    if (elRingkas) {
      elRingkas.innerHTML = '<span class="titik" style="background:' +
        (nyata ? '#34d399' : '#64748b') + '"></span>' +
        (nyata ? 'tersambung' : 'mode hiasan');
    }
    if (modeLama !== null && nyata !== modeLama) {
      catat(nyata ? 'audit mulai berjalan' : 'audit berhenti', nyata ? 'sukses' : 'info');
    }
    modeLama = nyata;
  }

  perbaruiMode();
  setInterval(perbaruiMode, 4000);

  /* ---------- muat ulang sendiri saat berkas diedit ----------
     Cuma saat dilayani server.py di komputer. Di Vercel tidak ada yang
     berubah tanpa deploy, dan endpoint /api/versi memang tidak ada di
     sana — jadi dijaga dua lapis: nama host, lalu endpoint yang gagal.

     Sengaja tanpa websocket dan tanpa pustaka: satu bilangan cap waktu,
     dibandingkan tiap 1,5 detik. Ini juga yang menghapus keharusan
     menaikkan ?v= tiap kali mengedit — itu cuma perlu untuk Vercel. */
  (function muatUlangOtomatis() {
    var lokal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (!lokal) return;
    var awal = null;
    setInterval(function () {
      fetch('/api/versi?t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (!d || !d.v) return;
          if (awal === null) { awal = d.v; return; }
          if (d.v !== awal) location.reload();
        })
        .catch(function () {});
    }, 1500);
  })();
})();
