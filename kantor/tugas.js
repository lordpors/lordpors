/* ============================================================
   TOMBOL + DI KURSI KOSONG — menu tugas

   Kantor ini dipakai seperti permainan: tiap kursi yang kosong
   punya tombol +, dan menekannya membuka daftar tugas yang bisa
   benar-benar dijalankan di komputer.

   BATAS YANG JUJUR, jangan dikaburkan:

   Yang menjalankan tugas adalah server.py di komputer Porscy,
   dan daftarnya DAFTAR PUTIH di sana. Halaman ini tidak pernah
   mengirim perintah -- ia cuma menyebut kunci tugas. Jadi
   menambah tombol di sini saja tidak akan menjalankan apa pun;
   tugasnya harus ada lebih dulu di TUGAS dalam server.py.

   Dibuka dari Vercel, tidak ada yang bisa dijalankan sama sekali:
   halaman statis tidak punya jalan ke komputer siapa pun. Menu
   tetap terbuka, tapi mengatakannya terang-terangan.
   ============================================================ */
(function () {
  'use strict';

  var LOKAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  /* Pilihan bawaan. Porscy belum memutuskan isi akhirnya, jadi yang ada
     di sini sengaja cuma yang sudah benar-benar bisa dikerjakan hari ini,
     plus penanda jujur untuk yang belum. Lebih baik daftar pendek yang
     semuanya jalan daripada daftar panjang yang separuhnya bohong. */
  var DAFTAR = {
    // Kursi auditor KOSONG — dia sedang keluar.
    auditor: [
      { tugas: 'auditor-login', judul: 'Login — pindai QR', qr: true,
        catatan: 'Melepas jeda, lalu menunggu bot mengirimkan kode QR-nya.' },
      { tugas: 'audit-contoh',  judul: 'Jalankan audit daftar contoh',
        catatan: 'Memeriksa audit/daftar-contoh.txt. Auditornya muncul dan bekerja sungguhan.' }
    ],
    // Auditor sedang DUDUK — diklik sosoknya.
    'auditor-hadir': [
      { tugas: 'auditor-logout', judul: 'Log out',
        catatan: 'Kursinya dikosongkan dan detak dari HP diabaikan sampai login lagi.' },
      { tugas: 'audit-contoh',  judul: 'Jalankan audit daftar contoh' }
    ]
  };

  /* KEHADIRAN — dibangkitkan, tidak disalin.
     Empat penghuni x tiga perintah = dua belas entri yang cuma berbeda
     di namanya. Ditulis satu per satu, tiap perbaikan kalimat harus
     disalin dua belas kali dan yang terlewat jadi berbeda diam-diam.
     Daftarnya harus sama dengan PENGHUNI di server.py; kalau tidak,
     tombolnya ada tapi server menolaknya. */
  var PENGHUNI = ['agen1', 'agen2', 'agen3', 'blaster'];

  PENGHUNI.forEach(function (k) {
    DAFTAR[k] = [
      { tugas: k + '-mulai',   judul: 'Tandai mulai bekerja', teks: true,
        catatan: 'Karakternya duduk di meja dan tugasnya muncul di atas kepalanya.' },
      { tugas: k + '-siaga',   judul: 'Duduk siaga',
        catatan: 'Tetap di kursinya tapi layarnya tidur — hadir, tidak sedang mengerjakan apa pun.' },
      { tugas: k + '-selesai', judul: 'Tandai selesai' }
    ];
  });

  /* Tugas yang BELUM bisa dikerjakan, ditambahkan di bawah tombol
     kehadiran. Sengaja tetap ditulis walau tidak bisa diklik: meja yang
     menawarkan "duduk siaga" saja tidak menjelaskan meja itu untuk apa.
     Yang tidak boleh cuma menawarkannya seolah-olah jalan. */
  DAFTAR.blaster.push(
    { belum: true, judul: 'Nyalakan blast Telegram',
      catatan: 'Belum tersambung — telegram-blaster/ masih tanpa .env, ' +
               'dan akun Telegram-nya belum ditentukan.' });

  var el = null;

  function aman(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function tutup() {
    clearInterval(jamQR);
    if (el) { el.remove(); el = null; }
  }

  function lapor(teks, jenis) {
    var k = el && el.querySelector('.tugas-lapor');
    if (k) {
      k.className = 'tugas-lapor ' + (jenis || 'info');
      k.textContent = teks;
    }
    if (window.KANTOR && window.KANTOR.log) window.KANTOR.log(teks, jenis || 'info');
  }

  function jalankan(opsi) {
    if (opsi.belum) return lapor(opsi.catatan || 'Belum tersambung.', 'peringatan');
    if (!LOKAL) {
      return lapor('Halaman ini dibuka dari internet — tidak ada jalan ke ' +
                   'komputermu. Buka kantor lewat server.py untuk menjalankannya.',
                   'peringatan');
    }

    var isian = el && el.querySelector('.tugas-teks');
    var badan = { tugas: opsi.tugas };
    if (opsi.teks && isian) badan.teks = isian.value;

    lapor('menjalankan: ' + opsi.judul + '…', 'kerja');
    fetch('/api/tugas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badan)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (h) {
        if (!h.ok) return lapor('gagal: ' + (h.d.galat || h.d.keluaran || '?'), 'galat');
        lapor((h.d.judul || opsi.judul) + ' — ' + (h.d.keluaran || 'selesai'), 'sukses');
        if (opsi.qr) return tungguQR();
        setTimeout(tutup, 1200);
      })
      .catch(function () {
        lapor('server kantor tidak menjawab. Masih jalan?', 'galat');
      });
  }

  /* Menunggu QR dari bot.

     BATASNYA JELAS: kantor TIDAK membuat QR sendiri. Yang bisa membuatnya
     cuma bot WhatsApp itu sendiri, karena QR itu tantangan dari server
     WhatsApp untuk sesi bot — bukan gambar hiasan yang bisa dikarang.
     Jadi panel ini menunggu, dan kalau botnya belum pernah mengirim, ia
     mengatakannya terus terang lengkap dengan apa yang kurang. */
  var jamQR = null;
  function tungguQR() {
    if (!el) return;
    var panel = el.querySelector('.tugas-panel');
    panel.innerHTML =
      '<h3>Login Auditor<button type="button" class="tugas-tutup" aria-label="Tutup">&times;</button></h3>' +
      '<div class="tugas-qr"><p class="tugas-kosong">Menunggu kode QR dari bot…</p></div>' +
      '<div class="tugas-lapor info">Pindai dari WhatsApp di HP lain: ' +
      'Perangkat Tertaut &rarr; Tautkan Perangkat.</div>';
    panel.querySelector('.tugas-tutup').addEventListener('click', tutup);

    var kotak = panel.querySelector('.tugas-qr');
    var mulai = Date.now();
    clearInterval(jamQR);
    jamQR = setInterval(function () {
      if (!el) { clearInterval(jamQR); return; }
      fetch('/api/qr?t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.ada && d.gambar) {
            clearInterval(jamQR);
            kotak.innerHTML = '<img alt="Kode QR login" src="' + d.gambar + '">';
            lapor('QR siap dipindai — berlaku sekitar satu menit.', 'kerja');
            return;
          }
          if (Date.now() - mulai > 45000) {
            clearInterval(jamQR);
            kotak.innerHTML = '<p class="tugas-kosong">Bot belum mengirim QR apa pun.<br><br>' +
              'Botmu harus mengirimkannya sendiri — kantor tidak bisa ' +
              'membuat QR WhatsApp. Tambahkan pengiriman QR di ' +
              '<code>wa-anggaran-bot</code>, lalu coba lagi.</p>';
            lapor('tidak ada QR yang masuk dalam 45 detik', 'peringatan');
          }
        })
        .catch(function () {});
    }, 2000);
  }

  function buka(id, nama) {
    tutup();
    var opsi = DAFTAR[id] || [];

    el = document.createElement('div');
    el.className = 'tugas-tirai';
    var perlu = opsi.some(function (o) { return o.teks; });

    el.innerHTML =
      '<div class="tugas-panel" role="dialog" aria-label="Tugas ' + aman(nama) + '">' +
        '<h3>' + aman(nama) + '<button type="button" class="tugas-tutup" aria-label="Tutup">&times;</button></h3>' +
        '<div class="tugas-isi"></div>' +
        (perlu ? '<input class="tugas-teks" placeholder="Sedang mengerjakan apa?" maxlength="80">' : '') +
        '<div class="tugas-lapor info">' +
          (LOKAL ? 'Dijalankan di komputer ini.'
                 : 'Dibuka dari internet — tugas tidak bisa dijalankan dari sini.') +
        '</div>' +
      '</div>';

    var isi = el.querySelector('.tugas-isi');
    if (!opsi.length) {
      isi.innerHTML = '<p class="tugas-kosong">Belum ada tugas untuk meja ini.</p>';
    }
    opsi.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tugas-opsi' + (o.belum ? ' belum' : '');
      b.innerHTML = '<b>' + aman(o.judul) + '</b>' +
                    (o.catatan ? '<span>' + aman(o.catatan) + '</span>' : '');
      b.addEventListener('click', function () { jalankan(o); });
      isi.appendChild(b);
    });

    el.querySelector('.tugas-tutup').addEventListener('click', tutup);
    el.addEventListener('click', function (e) { if (e.target === el) tutup(); });
    document.body.appendChild(el);

    var t = el.querySelector('.tugas-teks');
    if (t) t.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') tutup();
  });

  if (window.KANTOR) window.KANTOR.bukaMenu = buka;
})();
