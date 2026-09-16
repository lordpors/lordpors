/* ============================================================
   KANTOR LORDPORS COMMPANY — adegan malam

   Seluruhnya digambar dengan canvas 2D. Tanpa berkas gambar, tanpa
   pustaka, tanpa unduhan. Kamera sengaja ditarik mundur supaya semua
   meja kerja terlihat sekaligus.

   DUA MODE, berpindah sendiri:
   - NYATA  : `audit/status.json` terjangkau & masih baru -> auditor
              bergerak mengikuti pekerjaan sungguhan.
   - HIASAN : berkas itu tidak ada (mis. dibuka dari Vercel). Adegan
              tetap hidup, dan panel menyebut modenya terang-terangan.
   ============================================================ */
(function () {
  'use strict';

  var kanvas = document.getElementById('kantor');
  var ctx = kanvas.getContext('2d');

  var P = 4;
  var LEBAR = 360, TINGGI = 190;
  var LANTAI_Y = 104;

  var W = {
    /* Dinding BIRU DONGKER, bukan bata cokelat.
       Ini perubahan paling menentukan dari referensi: bata hangat membuat
       ruangan terbaca sebagai kafe, bukan kantor malam. Nila gelap dengan
       nat kebiruan memberi neon tempat berpijak — warna panas di atas
       dinding panas saling meredam. */
    bata:'#222845', bataGaris:'#161a30', bataTerang:'#2e3556',
    /* Lantai kayu hangat dengan papan panjang dan pantulan. Kontras
       hangat-dingin inilah yang membuat ruangan terasa dalam. */
    lantai1:'#7a4e22', lantai2:'#8a5a28', lantaiGaris:'#5a3617',
    lantaiKilau:'#a06c33', lantaiGelap:'#4a2c12',
    langit:'#070a18', gedung:'#171f4a', gedungTerang:'#24205e', gedungUngu:'#3a1f5c',
    jendelaKota:'#ffd98a', jendelaKota2:'#7dd3fc', jendelaKota3:'#c4b5fd',
    bulan:'#f6f3e6', kusen:'#3a2f3f',
    /* Meja: TUTUP kayu, BADAN gelap. Kalau seluruh mejanya cokelat
       seperti dulu, ia lenyap ke dalam lantai kayu yang baru. Badan
       gelap memberi mejanya siluet sendiri. */
    meja:'#2c3354', mejaAtas:'#a97038', mejaKaki:'#1d2340',
    mejaGaris:'#c08a45', mejaLampu:'#f5c451',
    layarMati:'#12141f', layarBingkai:'#1c2030',
    kodeHijau:'#4ade80', kodeBiru:'#67e8f9', kodeUngu:'#c4b5fd', kodeKuning:'#fcd34d',
    kulit:'#e8c4a0', kulitGelap:'#d8ab82',
    rambutHitam:'#151119', bajuPutih:'#eef1f6', bajuPutihBayang:'#c9d0dc',
    kaca:'#cfe8f5', bingkai:'#2a2632',
    kaosHitam:'#17161c', kaosGelap:'#0f0e13', jeans:'#2c3d61', jeansGelap:'#20304d',
    sepatu:'#e8e8e8',
    neonKuning:'#ffd93d', neonBiru:'#4db8ff',
    neonUngu:'#c026d3', neonSian:'#2ad4f0', neonAmber:'#ffa424',
    lampuGantung:'#f5c451', balok:'#2b3152',
    permadani:'#1c2547', permadaniTepi:'#2a3766',
    lemari:'#2a3050', lemariAtas:'#39406a',
    daun:'#2f6b3e', daunTua:'#245530', pot:'#8b5a3c', potGelap:'#6b4530',
    lampuHangat:'#ffcf87', kursi:'#262c46', kursiTerang:'#39415f',
    colaMerah:'#d2232a', colaMerahTua:'#8f151b', colaMerahMuda:'#e8474e',
    colaPutih:'#f2f2f2', colaKaca:'#0f1c36', colaBotol:'#3a1a1c',
    galonBiru:'#3f93c4', galonAir:'#6fc4e6', galonTutup:'#2b6d95',
    disBadan:'#d7dde6', disGelap:'#9aa3b2', disPanel:'#2a3148',
    kayu:'#4a3628', logam:'#3a4054',
    hijau:'#34d399', kuning:'#fcd34d', abu:'#8b98ab',
    // Agen 1 — sengaja tidak memakai warna kulit. Lihat catatan di
    // gambarAgen1() untuk alasannya.
    a1Badan:'#3f4674', a1BadanGelap:'#333a61', a1Kepala:'#2c3157',
    a1Visor:'#ffb86b', a1VisorTerang:'#ffd9a8', a1Tepi:'#5b64a0',
    // Agen 2 — jenis yang sama dengan Agen 1, tanda tangan berbeda.
    // Alasannya ditulis panjang di gambarAgen2().
    a2Badan:'#4a3f70', a2BadanGelap:'#3b3159', a2Kepala:'#352d54',
    a2Seam:'#c4b5fd', a2SeamTerang:'#ece7ff', a2Tepi:'#7c6bb8',
    // Agen 3 — mawar. Satu-satunya keluarga warna yang belum dipakai
    // siapa pun di ruangan ini; alasannya ditulis di gambarAgen3().
    a3Badan:'#6b3a4e', a3BadanGelap:'#582f40', a3Kepala:'#4a2838',
    a3Cincin:'#fb7185', a3CincinTerang:'#ffd9de', a3Tepi:'#a85a72'
  };

  function kotak(x, y, w, h, warna, a) {
    if (a !== undefined) ctx.globalAlpha = a;
    ctx.fillStyle = warna;
    ctx.fillRect(x * P, y * P, w * P, h * P);
    if (a !== undefined) ctx.globalAlpha = 1;
  }

  /* ---------------- tata letak ---------------- */
  /* SEMUA DIPUSATKAN DI 180 (= LEBAR/2).
     Sebelumnya jendela meleset +7, barisan meja agen +12, barisan depan
     -10. Selisih sekecil itu tidak terlihat satu per satu, tapi
     menumpuk jadi ruangan yang terasa miring ke kanan. */
  var JENDELA = { x: 105, y: 12, w: 150, h: 88 };
  var NEON    = { x: 4,   y: 14, w: 96,  h: 54 };
  var PORS    = { x: 175, y: 76 };   // pusat x=180; sol mendarat di y=107

  var MEJA_H = 16;
  /* LEBAR MEJA DIUKUR DARI LEBAR BAHU, bukan dari ruang yang tersisa.

     Manusia di panggung ini selebar 12 satuan (bahu ~0,45 m). Meja kerja
     nyata 1,2-1,4 m — sekitar 2,8x lebar bahu, jadi 34-42 satuan.

     Versi sebelumnya 64-82 satuan: 5,3x sampai 6,8x. Itu meja sepanjang
     2,5-3 meter untuk satu orang. Ruangannya jadi terasa seperti aula,
     dan orangnya seperti anak kecil yang kekecilan mejanya.

     Dinding monitor boleh lebih lebar (56) karena memang memuat enam
     layar — itu satu-satunya pengecualian yang punya alasan. */
  var MEJA_SEMUA = [
    { x: 16,  y: 116, w: 56, nama: null,               isi: 'monitor6' },   // pusat 44
    /* `agen: N` menggantikan rujukan MEJA_SEMUA[1] / [2] yang dulu
       tersebar di tujuh tempat. Rujukan indeks akan salah diam-diam
       begitu ada meja disisipkan di tengah — dan meja Agen 3 memang
       disisipkan di tengah. */
    { x: 104, y: 138, w: 40, nama: "Porscy's Agent 1", isi: false, agen: 1 },
    { x: 160, y: 138, w: 40, nama: "Porscy's Agent 2", isi: false, agen: 2 },
    { x: 216, y: 138, w: 40, nama: "Porscy's Agent 3", isi: false, agen: 3 },
    { x: 293, y: 116, w: 46, nama: "Porscy's Auditor", isi: 'auditor' },   // pusat 316
    /* Meja blaster — barisan DEPAN, sengaja di kiri.
       Di sana lantainya kosong: dinding monitor berakhir di y=132 dan
       tanaman besar baru mulai di x=91, jadi meja ini punya ruangnya
       sendiri tanpa menimpa meja mana pun. Ditaruh paling akhir supaya
       digambar paling atas — benda yang lebih dekat menutupi yang jauh. */
    { x: 26,  y: 160, w: 40, nama: "Porscy's Blaster", isi: 'blaster' },
    /* Meja Nawala — barisan depan juga, tapi di KANAN.
       Sengaja berseberangan dengan meja blaster, bukan berjejer: lantai
       di tengah itu tempat cahaya bulan jatuh, dan menutupinya dengan
       deretan meja akan menghapus satu-satunya bagian terang ruangan.
       Sudah diperiksa bersih dari meja auditor (y jauh di atas), lampu
       meja, dan tanaman kecil yang mulai di x=339. */
    { x: 294, y: 160, w: 40, nama: "Nawala Checker", isi: 'nawala' }
  ];
  /* Duduk TEPAT DI DEPAN monitor utamanya, di kursi, membelakangi kamera.

     x=299: dulu 272 — ujung kiri meja sementara monitornya mulai di 292,
     jadi lengannya menjulur menyamping untuk menggapai papan ketik.

     y=107: dulu 89, dan itu membuatnya melayang setinggi layar. Angka ini
     bukan selera — diturunkan dari lantai. Setiap meja di kantor ini
     menaruh kursinya di `y meja + MEJA_H + 2`:

         meja 6-monitor (kursi Lordpors)  y=116  ->  dudukan 134
         meja Agent 1 & 2                 y=138  ->  dudukan 156
         meja auditor                     y=114  ->  dudukan 132

     Kursi auditor dulu di 114 — 18 piksel di atas lantai, menempel di
     dinding, sebaris dengan tutup mejanya sendiri. Itu sebabnya dia
     terlihat melayang dan bukan duduk. Sekarang dudukannya di y+25 = 132,
     sebaris dengan kursi Lordpors di 134 (beda 2, persis sama dengan beda
     tinggi kedua mejanya). Pinggulnya ada di dudukan itu, bahunya di 118,
     dan tangannya sampai ke papan ketik di 117..121. */
  /* ==========================================================
     POSISI AUDITOR DIHITUNG DARI MEJANYA, BUKAN DITULIS TETAP.

     Angka tetap sudah dua kali membuat bug yang sama persis: mejanya
     digeser, konstantanya tertinggal, dan dia berdiri sendirian di
     samping kursinya. Pertama waktu meja dipersempit, kedua waktu
     seluruh ruangan dipusatkan.

     Agen 1-3 tidak pernah kena karena posisinya memang diturunkan dari
     mejanya (`m.x + m.w/2 - 7`). Auditor sekarang mengikuti pola yang
     sama, jadi menggeser mejanya cukup mengubah satu angka di
     MEJA_SEMUA — sisanya menyusul sendiri.

     Angka penyeimbangnya:
       -5  badan selebar 8 (x+1..x+9), pusatnya x+5 -> pusat meja
       -16 kepala y+2..y+11 dan badan y+11..y+20, supaya kepala & bahu
           terlihat di atas tutup meja
     ========================================================== */
  var MEJA_AUDITOR = (function () {
    for (var i = 0; i < MEJA_SEMUA.length; i++)
      if (MEJA_SEMUA[i].isi === 'auditor') return MEJA_SEMUA[i];
    return null;
  })();
  var AUDITOR = {
    x: MEJA_AUDITOR.x + MEJA_AUDITOR.w / 2 - 5,
    y: MEJA_AUDITOR.y - 16
  };

  /* ---------------- dinding bata ---------------- */
  var bataPola = null;
  function siapkanBata() {
    var k = document.createElement('canvas');
    k.width = 16 * P; k.height = 8 * P;
    var c = k.getContext('2d');
    c.fillStyle = W.bataGaris; c.fillRect(0, 0, 16 * P, 8 * P);
    c.fillStyle = W.bata;
    c.fillRect(0, 0, 15 * P, 3 * P);
    c.fillRect(0, 4 * P, 7 * P, 3 * P);
    c.fillRect(8 * P, 4 * P, 7 * P, 3 * P);
    // Sorotan di TEPI ATAS tiap bata. Satu piksel ini yang membuat
    // dindingnya terbaca sebagai balok bersusun, bukan tekstur rata.
    c.fillStyle = W.bataTerang;
    c.fillRect(0, 0, 15 * P, 1 * P);
    c.fillRect(0, 4 * P, 7 * P, 1 * P);
    c.fillRect(8 * P, 4 * P, 7 * P, 1 * P);
    bataPola = ctx.createPattern(k, 'repeat');
  }

  /* ---------------- kota malam di balik jendela ----------------
     DUA LAPIS, dan itu yang membuat jendelanya terasa dalam. Lapis jauh
     lebih pendek, lebih pucat, dan tanpa lampu menyala; lapis dekat lebih
     tinggi, pekat, penuh jendela menyala. Satu lapis saja akan terbaca
     seperti stiker yang ditempel di kaca. */
  var gedungJauh = [], gedungKota = [], bintang = [], awan = [];
  (function () {
    function bikin(kumpulan, lbMin, lbAcak, tgMin, tgAcak, padatLampu, jarak) {
      var x = -4;
      while (x < JENDELA.w) {
        var lb = lbMin + ((Math.random() * lbAcak) | 0);
        var tg = tgMin + ((Math.random() * tgAcak) | 0);
        var lampu = [];
        if (padatLampu > 0) {
          for (var gy = 2; gy < tg - 3; gy += 4) {
            for (var gx = 2; gx < lb - 2; gx += 3) {
              if (Math.random() > padatLampu) {
                lampu.push({ x: gx, y: gy, w: Math.random() > .72 ? 2 : 1,
                             c: Math.random() > .80 ? W.jendelaKota2
                                : (Math.random() > .92 ? W.jendelaKota3 : W.jendelaKota),
                             k: Math.random() * 6.28 });
              }
            }
          }
        }
        // Siluetnya diambil dari tiga warna berbeda supaya deretannya
        // tidak terbaca seperti satu blok panjang.
        var nada = Math.random();
        kumpulan.push({
          x: x, w: lb, t: tg, lampu: lampu,
          c: nada > .72 ? W.gedungUngu : (nada > .42 ? W.gedungTerang : W.gedung),
          // antena hanya pada gedung tinggi, dan tidak semuanya
          antena: tg > 34 && Math.random() > .55
        });
        x += lb + jarak + ((Math.random() * 3) | 0);
      }
    }
    bikin(gedungJauh, 9, 12, 12, 22, 0, 2);
    bikin(gedungKota, 7, 10, 18, 44, 0.42, 1);

    for (var i = 0; i < 30; i++)
      bintang.push({ x: Math.random() * JENDELA.w, y: Math.random() * 32,
                     k: Math.random() * 6.28 });
    for (var j = 0; j < 5; j++)
      awan.push({ x: Math.random() * JENDELA.w, y: 6 + Math.random() * 20,
                  w: 10 + ((Math.random() * 16) | 0) });
  })();

  function gambarJendela(t) {
    var J = JENDELA;
    kotak(J.x - 4, J.y - 4, J.w + 8, J.h + 8, W.kusen);
    kotak(J.x - 2, J.y - 2, J.w + 4, J.h + 4, '#20263f');

    // langit bergradasi: lebih terang di dekat kaki langit kota
    var lg = ctx.createLinearGradient(0, J.y * P, 0, (J.y + J.h) * P);
    lg.addColorStop(0, '#070a18');
    lg.addColorStop(.62, '#111a3d');
    lg.addColorStop(1, '#22184a');
    ctx.fillStyle = lg;
    ctx.fillRect(J.x * P, J.y * P, J.w * P, J.h * P);

    for (var i = 0; i < bintang.length; i++) {
      var b = bintang[i];
      ctx.globalAlpha = .28 + .45 * Math.sin(t / 900 + b.k);
      kotak(J.x + (b.x | 0), J.y + (b.y | 0), 1, 1, '#b8c2e8');
    }
    ctx.globalAlpha = 1;

    // awan tipis — kotak memanjang, sengaja tanpa lengkung
    for (var a = 0; a < awan.length; a++) {
      var w = awan[a];
      kotak(J.x + (w.x | 0), J.y + (w.y | 0), Math.min(w.w, J.w - w.x), 2, '#2b3566', .5);
      kotak(J.x + (w.x | 0) + 2, J.y + (w.y | 0) - 1, Math.min(w.w - 5, J.w - w.x), 1, '#313d78', .45);
    }

    // bulan purnama
    var bx = J.x + J.w * .84, by = J.y + 15, r = 7;
    var g = ctx.createRadialGradient(bx * P, by * P, 0, bx * P, by * P, r * P * 3.6);
    g.addColorStop(0, 'rgba(246,243,230,.34)');
    g.addColorStop(1, 'rgba(246,243,230,0)');
    ctx.fillStyle = g;
    ctx.fillRect((bx - r * 3.6) * P, (by - r * 3.6) * P, r * 7.2 * P, r * 7.2 * P);
    ctx.fillStyle = W.bulan;
    ctx.beginPath(); ctx.arc(bx * P, by * P, r * P, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ddd8c2';
    ctx.beginPath(); ctx.arc((bx - 2) * P, (by - 1.6) * P, 1.7 * P, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc((bx + 2.3) * P, (by + 2) * P, 1.1 * P, 0, 6.2832); ctx.fill();

    var dasar = J.y + J.h;

    function deret(kumpulan, redup) {
      for (var i = 0; i < kumpulan.length; i++) {
        var b2 = kumpulan[i];
        if (b2.x >= J.w) break;
        var mulai = Math.max(0, b2.x);
        var lb = Math.min(b2.w - (mulai - b2.x), J.w - mulai);
        if (lb <= 0) continue;
        ctx.globalAlpha = redup;
        kotak(J.x + mulai, dasar - b2.t, lb, b2.t, b2.c);
        // tepi atas sedikit lebih terang — memisahkan gedung dari langit
        kotak(J.x + mulai, dasar - b2.t, lb, 1, '#3c4a8c');
        if (b2.antena && mulai === b2.x) {
          kotak(J.x + mulai + (lb >> 1), dasar - b2.t - 4, 1, 4, '#2a3363');
          ctx.globalAlpha = redup * (.45 + .55 * Math.sin(t / 520 + b2.x));
          kotak(J.x + mulai + (lb >> 1) - 0, dasar - b2.t - 5, 1, 1, '#ff5d8f');
        }
        ctx.globalAlpha = 1;

        for (var j = 0; j < b2.lampu.length; j++) {
          var L = b2.lampu[j];
          if (mulai + L.x + L.w > J.x + J.w - J.x) continue;
          if (L.x + L.w > lb) continue;
          ctx.globalAlpha = .55 + .45 * Math.sin(t / 1700 + L.k);
          kotak(J.x + mulai + L.x, dasar - b2.t + L.y, L.w, 1, L.c);
        }
        ctx.globalAlpha = 1;
      }
    }

    deret(gedungJauh, .45);
    deret(gedungKota, 1);

    /* Kusen pembagi — DUA baris, TIGA kolom, seperti di referensi.
       Digambar paling akhir supaya kacanya terlihat berada di belakang. */
    kotak(J.x + J.w / 3 - 1, J.y, 2, J.h, W.kusen);
    kotak(J.x + J.w * 2 / 3 - 1, J.y, 2, J.h, W.kusen);
    kotak(J.x, J.y + J.h * .45 - 1, J.w, 2, W.kusen);

    // pantulan tipis di kaca
    ctx.globalAlpha = .05;
    kotak(J.x, J.y, J.w / 3 - 1, J.h * .45, '#ffffff');
    ctx.globalAlpha = 1;
  }

  /* ---------------- neon ---------------- */
  var neonSiap = null;
  var fontSiap = false;

  /* Font Google dimuat secara asinkron. Kalau neon dirender sebelum
     Orbitron & Cinzel tiba, yang tersimpan adalah versi font cadangan --
     dan karena hasilnya di-cache, ia tidak pernah diperbaiki sendiri.
     Jadi render neon ditunda sampai fontnya benar-benar siap. */
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('900 40px "Orbitron"'),
      document.fonts.load('700 21px "Orbitron"')
    ]).then(function () { fontSiap = true; neonSiap = null; })
      .catch(function () { fontSiap = true; });
  } else {
    fontSiap = true;
  }

  function siapkanNeon() {
    var w = NEON.w * P, h = NEON.h * P;
    var k = document.createElement('canvas');
    k.width = w; k.height = h;
    var c = k.getContext('2d');

    /* TANPA TABUNG. Tiga kali dicoba — bingkai berkait, jalur menerus,
       cabang cyan — dan tiap kali hasilnya terbaca berantakan pada papan
       selebar 384px. Lengkung neon butuh ruang untuk terbaca sebagai
       kaca yang dibengkokkan; di ruang sesempit ini ia cuma jadi garis
       yang membingungkan. Dihapus atas permintaan Porscy, dan itu
       keputusan yang benar: dua baris huruf menyala sudah cukup.

       KOMPENSASI letterSpacing — ini penyebab keduanya tidak pernah
       benar-benar sepusat meski sama-sama digambar di w/2.

       Canvas menambahkan jarak huruf SESUDAH huruf terakhir juga, persis
       seperti letter-spacing di CSS. Akibatnya teks yang dipusatkan
       bergeser ke kiri sebesar setengah jarak itu. LORDPORS berjarak 6px
       (geser 3px), MEMENTO VIVERE 2px (geser 1px) — selisih 2px yang
       terlihat sebagai baris bawah agak ke kanan.

       Jadi tiap teks digeser balik +spasi/2. */
    function tulis(teks, y, warna, inti, font, spasi) {
      c.font = font;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineJoin = 'round'; c.lineCap = 'round';
      if (c.letterSpacing !== undefined) c.letterSpacing = spasi + 'px';
      var x = w / 2 + spasi / 2;
      c.shadowColor = warna;
      [[26, 6, warna], [14, 3.5, warna], [0, 1.8, inti]].forEach(function (L) {
        c.shadowBlur = L[0];
        c.lineWidth = L[1];
        c.strokeStyle = L[2];
        c.fillStyle = L[2];
        c.strokeText(teks, x, y);
        c.fillText(teks, x, y);
      });
      c.shadowBlur = 0;
      if (c.letterSpacing !== undefined) c.letterSpacing = '0px';
    }

    /* Dua baris didekatkan dan dipusatkan sebagai SATU blok.
       Jaraknya 0,19h (≈41px) — sekitar satu tinggi huruf LORDPORS,
       cukup untuk memisahkan tanpa terlihat terlepas. Blok itu lalu
       ditaruh di tengah papan, bukan masing-masing baris sendiri. */
    tulis('LORDPORS', h * .43, W.neonAmber, '#ffd074',
          '900 36px "Orbitron", ui-monospace, monospace', 6);

    tulis('MEMENTO VIVERE', h * .62, W.neonSian, '#9df0ff',
          '700 15px "Orbitron", ui-monospace, monospace', 2);

    neonSiap = k;
  }

  /* Neon menyala TETAP. Versi sebelumnya punya dua getaran: napas pelan
     (sin t/950) dan sendatan tajam (sin t/143 > .986) yang meniru tabung
     neon rusak. Porscy memintanya berhenti — dan memang benar: papan nama
     yang berkedip terus menarik mata dari hal yang sebenarnya bergerak di
     ruangan ini, yaitu orang yang datang dan pergi dari mejanya. */
  function gambarNeon(t) {
    if (!fontSiap) return;            // tunggu font, jangan render separuh jadi
    if (!neonSiap) siapkanNeon();
    ctx.drawImage(neonSiap, NEON.x * P, NEON.y * P);

    var cx = (NEON.x + NEON.w / 2) * P, cy = (NEON.y + NEON.h / 2) * P;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, NEON.w * P * .85);
    g.addColorStop(0, 'rgba(255,164,36,.12)');
    g.addColorStop(.5, 'rgba(42,212,240,.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - NEON.w * P, cy - NEON.h * P, NEON.w * 2 * P, NEON.h * 2.4 * P);
  }

  /* ---------------- ruangan ---------------- */

  /* Lampu gantung langit-langit. Tiga hal dalam satu: batang penggantung,
     kap, dan KERUCUT CAHAYA yang jatuh ke bawah. Kerucutnya yang paling
     penting — tanpa itu lampunya cuma hiasan menempel, dengan itu ruangan
     jadi punya sumber cahaya yang terbaca. */
  function gambarLampuGantung(x, t, ke) {
    var nadi = .92 + .08 * Math.sin(t / 1300 + ke * 2.1);
    kotak(x + 2, 0, 2, 5, W.logam);                  // batang
    kotak(x - 2, 5, 9, 2, '#3c4468');                // kap atas
    kotak(x - 1, 7, 7, 2, W.lampuGantung);           // bola
    kotak(x, 9, 5, 1, '#fff3c4', .9);                // titik paling terang

    var g = ctx.createLinearGradient(0, 9 * P, 0, 62 * P);
    g.addColorStop(0, 'rgba(245,196,81,' + (.20 * nadi) + ')');
    g.addColorStop(1, 'rgba(245,196,81,0)');
    ctx.fillStyle = g;
    // kerucut melebar ke bawah
    ctx.beginPath();
    ctx.moveTo((x - 1) * P, 9 * P);
    ctx.lineTo((x + 6) * P, 9 * P);
    ctx.lineTo((x + 18) * P, 62 * P);
    ctx.lineTo((x - 13) * P, 62 * P);
    ctx.closePath(); ctx.fill();
  }

  /* Strip neon tegak di dinding samping. Di referensi inilah yang membuat
     tepi ruangan tidak mati — sudut gelap tanpa cahaya membuat adegan
     terasa terpotong, bukan berlanjut ke luar bingkai. */
  function gambarStripNeon(x, warna, t, fase) {
    var nadi = .72 + .28 * Math.sin(t / 900 + fase);
    var atas = 8, bawah = LANTAI_Y - 6;
    ctx.globalAlpha = nadi;
    kotak(x, atas, 2, bawah - atas, warna);
    kotak(x, atas, 1, bawah - atas, '#ffffff', .35);
    ctx.globalAlpha = 1;

    var cx = (x + 1) * P, cy = ((atas + bawah) / 2) * P;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26 * P);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    ctx.fillStyle = warna;
    ctx.globalAlpha = .11 * nadi;
    ctx.fillRect((x - 7) * P, atas * P, 16 * P, (bawah - atas) * P);
    ctx.globalAlpha = 1;
  }

  function gambarRuangan(t) {
    if (!bataPola) siapkanBata();
    ctx.fillStyle = bataPola;
    ctx.fillRect(0, 0, LEBAR * P, LANTAI_Y * P);

    // balok langit-langit + garis neon tipis di bawahnya
    kotak(0, 0, LEBAR, 4, W.balok);
    kotak(0, 4, LEBAR, 1, W.neonKuning, .55);

    gambarStripNeon(1, W.neonUngu, t, 0);
    gambarStripNeon(LEBAR - 3, W.neonSian, t, 1.7);

    for (var L = 0; L < 4; L++) gambarLampuGantung([45, 135, 225, 315][L], t, L);

    // pinggiran lantai
    kotak(0, LANTAI_Y - 3, LEBAR, 3, '#141726');

    /* LANTAI PAPAN KAYU.
       Barisnya bergantian terang-gelap, dan tiap baris punya sambungan
       tegak yang digeser setengah papan. Penggeseran itu yang membuatnya
       terbaca sebagai papan bersusun, bukan ubin kotak-kotak. */
    var TINGGI_PAPAN = 6, PANJANG_PAPAN = 34;
    for (var y = LANTAI_Y, baris = 0; y < TINGGI; y += TINGGI_PAPAN, baris++) {
      kotak(0, y, LEBAR, TINGGI_PAPAN, baris % 2 ? W.lantai1 : W.lantai2);
      kotak(0, y, LEBAR, 1, W.lantaiKilau, .22);           // urat atas papan
      kotak(0, y + TINGGI_PAPAN - 1, LEBAR, 1, W.lantaiGaris);
      var geser = (baris % 2) * (PANJANG_PAPAN / 2);
      for (var x = geser; x < LEBAR; x += PANJANG_PAPAN)
        kotak(x, y, 1, TINGGI_PAPAN - 1, W.lantaiGelap, .5);
    }

    /* Pantulan jendela di lantai. Lantai kayu malam hari memantul; tanpa
       ini kayunya terlihat seperti kertas. Sengaja lebar dan lembut —
       pantulan tajam akan terbaca sebagai genangan air. */
    var pr = ctx.createLinearGradient(0, LANTAI_Y * P, 0, TINGGI * P);
    pr.addColorStop(0, 'rgba(198,214,255,.16)');
    pr.addColorStop(.55, 'rgba(198,214,255,.05)');
    pr.addColorStop(1, 'rgba(198,214,255,0)');
    ctx.fillStyle = pr;
    ctx.fillRect((JENDELA.x - 14) * P, LANTAI_Y * P,
                 (JENDELA.w + 28) * P, (TINGGI - LANTAI_Y) * P);

    /* Permadani. Di referensi ia menutup lantai tengah-depan dan menahan
       pandangan supaya tidak jatuh keluar bingkai. Ditaruh di antara meja
       Blaster (habis di x=84) dan meja Nawala (mulai x=266). */
    kotak(116, 172, 128, 18, W.permadaniTepi);
    kotak(118, 174, 124, 14, W.permadani);
    kotak(122, 176, 116, 1, '#33427a', .7);
  }

  /* ---------------- perabot & pernak-pernik ---------------- */
  /* ---------------- tanaman ----------------
     Versi lama: satu kotak pot dan empat kotak daun. Terbaca sebagai
     rambu, bukan tanaman.

     Tiga hal yang memperbaikinya, dan ketiganya kecil:
       1. Pot MELEBAR KE ATAS. Pot yang sisinya tegak lurus terbaca
          sebagai ember.
       2. Garis lampu hangat di kaki pot — di acuan semua pot berdiri di
          atas cahaya, itu yang menautkannya ke lantai.
       3. Daun BERLAPIS dengan dua-tiga nada hijau dan panjang berbeda.
          Daun sama panjang terbaca seperti sisir. */
  function gambarTanaman(x, y, besar) {
    var s = besar ? 1.5 : 1;
    var lb = Math.round(12 * s), tg = Math.round(10 * s);

    // --- daun: dari belakang ke depan ---
    var pusat = x + lb / 2;
    var helai = [
      [-5.0, -10, W.daunTua], [ 5.0, -11, W.daunTua],   // lapis belakang
      [-3.2, -16, W.daunTua], [ 3.4, -15, W.daunTua],
      [-1.6, -20, W.daun],    [ 1.8, -19, W.daun],      // lapis tengah
      [-4.2, -13, W.daun],    [ 4.4, -12, W.daun],
      [ 0.0, -23, '#3d8a4e'],                           // pucuk paling terang
      [-2.6, -17, '#3d8a4e'], [ 2.8, -16, '#3d8a4e']
    ];
    for (var i = 0; i < helai.length; i++) {
      var h = helai[i];
      var hx = pusat + h[0] * s - 1, panjang = Math.abs(h[1]) * s;
      // batang miring: tiap helai dibuat dari 3 potong yang bergeser
      for (var j = 0; j < 3; j++) {
        var bagi = panjang / 3;
        kotak(hx + h[0] * s * j * .16, y - bagi * (j + 1), 2, bagi + 1, h[2]);
      }
    }

    // --- pot: melebar ke atas ---
    kotak(x - 1, y, lb + 2, 2, W.potGelap);              // bibir pot
    kotak(x, y, lb, 1, '#a06a48', .8);                   // kilau bibir
    for (var k = 0; k < tg - 2; k++) {
      var susut = Math.round(k * .35);
      kotak(x + susut, y + 2 + k, lb - susut * 2, 1, k < 2 ? W.potGelap : W.pot);
    }
    kotak(x + 1, y + 2, 2, tg - 4, '#a06a48', .35);      // sorotan sisi kiri

    // --- garis lampu di kaki pot ---
    var kaki = y + tg;
    kotak(x + Math.round((tg - 2) * .35), kaki, lb - Math.round((tg - 2) * .7), 1,
          W.mejaLampu, .6);
    var g = ctx.createRadialGradient(pusat * P, kaki * P, 0, pusat * P, kaki * P, 12 * s * P);
    g.addColorStop(0, 'rgba(245,196,81,.16)');
    g.addColorStop(1, 'rgba(245,196,81,0)');
    ctx.fillStyle = g;
    ctx.fillRect((pusat - 12 * s) * P, (kaki - 8 * s) * P, 24 * s * P, 16 * s * P);
  }

  function gambarRak(x, y) {
    kotak(x, y, 34, 2, W.kayu);
    var warna = ['#6b4a7a', '#4a6b7a', '#7a5a4a', '#5a7a4a', '#7a6b4a'];
    for (var i = 0; i < 7; i++)
      kotak(x + 2 + i * 4, y - 8 - (i % 3), 3, 8 + (i % 3), warna[i % 5]);
    kotak(x, y + 14, 34, 2, W.kayu);
    kotak(x + 3, y + 6, 12, 8, '#2e3450');      // kotak arsip
    kotak(x + 18, y + 4, 13, 10, '#3a2f3f');
  }

  /* ---------------- mesin minuman ----------------
     Menggantikan lampu berdiri yang dulu ada di samping jendela.

     Ukurannya diturunkan dari skala ruangan, bukan dikira-kira: bahu
     manusia di panggung ini 12 satuan = 0,45 m, jadi 1 satuan = 3,75 cm.
     Mesin minuman nyata 1,8 x 0,9 m = 48 x 24 satuan. Dipakai 44 x 24
     supaya tidak terlalu menjulang di atas LordPors yang 36.

     Cahayanya TETAP, tidak berkedip. Ruangan ini sudah punya cukup
     benda berdenyut — lampu siaga, antena, tanda wajah agen. Satu lagi
     yang berkedip cuma menambah gelisah. */
  function gambarMesinCola(x, y, t) {
    var W_ = 24, H_ = 44;

    // bayangan di lantai
    ctx.globalAlpha = .3;
    kotak(x - 1, y + H_ - 1, W_ + 2, 2, '#000');
    ctx.globalAlpha = 1;

    // --- badan merah ---
    kotak(x, y, W_, H_, W.colaMerah);
    kotak(x, y, W_, 1, W.colaMerahMuda);                 // kilau tepi atas
    kotak(x, y, 1, H_, W.colaMerahMuda, .5);             // kilau sisi kiri
    kotak(x + W_ - 1, y, 1, H_, W.colaMerahTua);         // bayangan sisi kanan
    kotak(x, y + H_ - 3, W_, 3, W.colaMerahTua);         // kaki

    /* --- kepala mesin: pita putih melengkung ---
       Lengkung khas itu tidak mungkin digambar sebagai kurva pada pita
       setinggi 2 satuan. Yang terbaca justru pita lurus dengan ujung
       naik-turun satu piksel — otak melengkapi sisanya. */
    kotak(x + 1, y + 2, W_ - 2, 4, W.colaMerahTua);
    kotak(x + 2, y + 3, W_ - 4, 2, W.colaPutih);
    kotak(x + 2, y + 3, 4, 1, W.colaMerah);
    kotak(x + W_ - 6, y + 4, 4, 1, W.colaMerah);

    // --- kaca depan ---
    var kx = x + 2, ky = y + 8, kw = 14, kh = 22;
    kotak(kx - 1, ky - 1, kw + 2, kh + 2, '#2a0a0c');    // bingkai kaca
    kotak(kx, ky, kw, kh, W.colaKaca);

    /* Botol: tiga baris, empat lajur. Tutupnya diberi satu piksel merah
       supaya terbaca sebagai botol, bukan sekadar kotak gelap. */
    for (var br = 0; br < 3; br++) {
      for (var lj = 0; lj < 4; lj++) {
        var bx = kx + 1 + lj * 3, by = ky + 2 + br * 7;
        kotak(bx, by, 2, 5, W.colaBotol);
        kotak(bx, by, 2, 1, W.colaMerah);                // tutup
        kotak(bx, by + 2, 1, 3, '#5a2a2e', .8);          // kilau badan botol
      }
      kotak(kx, ky + 7 + br * 7, kw, 1, '#1a2b4a');      // rak
    }

    // pantulan kaca — satu garis miring, cukup untuk menandai kaca
    ctx.globalAlpha = .10;
    kotak(kx + 2, ky, 3, kh, '#ffffff');
    ctx.globalAlpha = 1;

    // --- panel kanan: tombol & slot ---
    var px_ = x + 17;
    kotak(px_, y + 8, 6, 22, W.colaMerahTua);
    for (var tb = 0; tb < 4; tb++) {
      kotak(px_ + 1, y + 10 + tb * 4, 4, 2, '#2a2f44');
      kotak(px_ + 2, y + 10 + tb * 4, 2, 1, W.colaMerahMuda, .8);
    }
    kotak(px_ + 1, y + 27, 4, 2, '#f5c451', .9);         // lampu "siap"

    // --- mulut pengambilan ---
    kotak(x + 3, y + 33, 12, 6, '#1a0507');
    kotak(x + 3, y + 33, 12, 1, W.colaMerahTua);
    kotak(x + 4, y + 34, 10, 1, '#2e0d10', .8);

    /* --- cahaya dari kacanya ke lantai & dinding ---
       Inilah yang membuat mesin terbaca MENYALA, bukan lemari merah.
       Warnanya merah hangat supaya menyatu dengan lantai kayu, bukan
       bertengkar dengan cyan di seberang ruangan. */
    var g = ctx.createRadialGradient((x + 9) * P, (y + 20) * P, 0,
                                     (x + 9) * P, (y + 20) * P, 34 * P);
    g.addColorStop(0, 'rgba(226,71,78,.18)');
    g.addColorStop(1, 'rgba(226,71,78,0)');
    ctx.fillStyle = g;
    ctx.fillRect((x - 26) * P, (y - 12) * P, 76 * P, 76 * P);
  }

  /* ---------------- dispenser galon ----------------
     Pasangan mesin minuman di seberang ruangan, dan letaknya memang
     cerminnya: mesin di 264..288, dispenser di 72..96 — sama-sama 84
     satuan dari pusat panggung.

     Kenapa dispenser dan bukan benda lain: ia pasangan yang MASUK AKAL,
     bukan cuma penyeimbang berat. Dua tempat minum di dua sisi ruangan
     adalah hal yang memang ada di kantor sungguhan. Benda yang ditaruh
     semata-mata demi simetri akan terbaca sebagai tambalan.

     Birunya juga bekerja: merah di kanan, biru di kiri — dua kutub hangat
     dan dingin yang saling menahan, bukan dua benda merah yang berebut
     perhatian.

     Galonnya sengaja terisi tiga perempat, tidak penuh. Galon penuh
     terbaca sebagai balok biru; batas airnya yang membuat isinya terbaca
     sebagai air. */
  function gambarDispenser(x, y, t) {
    var LB = 16, TG = 21;                 // badan dispenser
    var bx = x + 2;                       // badan digeser, sisa ruang untuk galon cadangan

    ctx.globalAlpha = .3;
    kotak(bx - 1, y + 35, LB + 2, 2, '#000');           // bayangan
    ctx.globalAlpha = 1;

    /* --- galon di atas ---
       Digambar lebih dulu supaya leher & badan dispenser menimpanya. */
    var gx = bx + 2, gw = 12;
    kotak(gx, y + 1, gw, 13, W.galonBiru);              // badan galon
    kotak(gx, y + 1, gw, 1, W.galonTutup);              // bahu galon
    kotak(gx + 1, y + 4, gw - 2, 9, W.galonAir);        // air, tiga perempat
    kotak(gx + 1, y + 3, gw - 2, 1, '#a8e0f5');         // batas permukaan air
    kotak(gx + 1, y + 5, 2, 7, '#b6e6f8', .55);         // kilau tegak
    kotak(gx + 4, y, 4, 2, W.galonTutup);               // tutup
    kotak(gx + 4, y, 4, 1, '#4a8ab0');

    // leher galon masuk ke dispenser
    kotak(gx + 3, y + 13, 6, 2, W.galonTutup);

    // --- badan dispenser ---
    kotak(bx, y + 15, LB, TG, W.disBadan);
    kotak(bx, y + 15, LB, 1, '#eef2f7');                // kilau tepi atas
    kotak(bx + LB - 1, y + 15, 1, TG, W.disGelap);      // bayangan sisi kanan
    kotak(bx, y + 15 + TG - 2, LB, 2, W.disGelap);      // kaki

    // panel keran
    kotak(bx + 2, y + 19, LB - 4, 8, W.disPanel);
    kotak(bx + 3, y + 21, 3, 2, '#e0484f');             // keran panas, merah
    kotak(bx + LB - 6, y + 21, 3, 2, '#4aa8d8');        // keran dingin, biru
    kotak(bx + 3, y + 24, 3, 1, W.disGelap);            // corong
    kotak(bx + LB - 6, y + 24, 3, 1, W.disGelap);

    // baki tetesan
    kotak(bx + 3, y + 29, LB - 6, 2, W.disGelap);
    kotak(bx + 4, y + 29, LB - 8, 1, '#7f8794');

    /* --- galon cadangan di lantai ---
       Satu benda kecil di sebelahnya. Kantor sungguhan selalu punya
       galon cadangan; tanpa itu dispensernya terbaca seperti pajangan. */
    var cx_ = bx + LB + 2;
    kotak(cx_, y + 24, 8, 12, W.galonBiru);
    kotak(cx_ + 1, y + 26, 6, 9, W.galonAir);
    kotak(cx_ + 1, y + 27, 1, 7, '#b6e6f8', .5);
    kotak(cx_ + 2, y + 23, 4, 1, W.galonTutup);

    /* Pendar biru lembut ke dinding & lantai — menahan cahaya merah dari
       seberang ruangan supaya tidak menguasai seluruh lantai. */
    var g = ctx.createRadialGradient((bx + 8) * P, (y + 20) * P, 0,
                                     (bx + 8) * P, (y + 20) * P, 30 * P);
    g.addColorStop(0, 'rgba(111,196,230,.13)');
    g.addColorStop(1, 'rgba(111,196,230,0)');
    ctx.fillStyle = g;
    ctx.fillRect((bx - 22) * P, (y - 10) * P, 68 * P, 68 * P);
  }

  /* ---------------- jam dinding ----------------
     Jam neon tujuh ruas, TANPA bingkai — bahasanya sama dengan tulisan
     MEMENTO VIVERE di kiri: halo lebar, cahaya dekat, lalu inti terang.

     Yang membuatnya terbaca sebagai LED sungguhan bukan ruas yang
     menyala, melainkan ruas yang MATI: di jam asli semua ruas tetap
     samar terlihat sebagai bayangan abu. Tanpa bayangan itu, angkanya
     cuma teks putih biasa. */
  var RUAS = {
    '0':'abcdef', '1':'bc',    '2':'abged', '3':'abgcd', '4':'fgbc',
    '5':'afgcd', '6':'afgedc', '7':'abc',   '8':'abcdefg', '9':'abcdfg'
  };

  function gambarAngkaLED(dx, dy, ch, warna, terang, bayangan) {
    var w = 7, h = 13, t = 2;                       // lebar, tinggi, tebal ruas
    var letak = {
      a: [dx + 1,     dy,         w - 2, t],
      b: [dx + w - t, dy + 1,     t,     5],
      c: [dx + w - t, dy + h - 6, t,     5],
      d: [dx + 1,     dy + h - t, w - 2, t],
      e: [dx,         dy + h - 6, t,     5],
      f: [dx,         dy + 1,     t,     5],
      g: [dx + 1,     dy + 6,     w - 2, t]
    };
    var nyala = RUAS[ch] || '';
    for (var k in letak) {
      var r = letak[k], on = nyala.indexOf(k) >= 0;
      if (!on && !bayangan) continue;
      kotak(r[0], r[1], r[2], r[3], on ? warna : '#303746', on ? terang : .42);
    }
  }

  function gambarJam(x, y) {
    var d = new Date();
    var teks = ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2);
    var detik = d.getSeconds();

    // Pendar putih ke dinding, mengikuti warna inti jam.
    var cx = (x + 18) * P, cy = (y + 7) * P;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 * P);
    g.addColorStop(0, 'rgba(255,255,255,.24)');
    g.addColorStop(.45, 'rgba(255,255,255,.10)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 30 * P, cy - 24 * P, 60 * P, 48 * P);

    /* Tiga lapis yang sama dengan neon teks: halo, tabung, inti.
       Ruas mati hanya digambar pada lapis terakhir agar tidak menutup
       cahaya ruas aktif di sebelahnya. */
    var kedipTitik = detik % 2 ? .28 : .95;
    var lapis = [
      { blur:7 * P, warna:'#ffffff', alpha:.28 },
      { blur:3 * P, warna:'#ffffff', alpha:.72 },
      { blur:0,     warna:'#ffffff', alpha:.98, bayangan:true }
    ];
    var posisi = [0, 9, 23, 32];
    for (var L = 0; L < lapis.length; L++) {
      var a = lapis[L];
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = a.blur;
      for (var i = 0; i < 4; i++)
        gambarAngkaLED(x + posisi[i], y, teks[i], a.warna, a.alpha, a.bayangan);
      kotak(x + 19, y + 3, 2, 2, a.warna, a.alpha * kedipTitik);
      kotak(x + 19, y + 8, 2, 2, a.warna, a.alpha * kedipTitik);
    }
    ctx.shadowBlur = 0;
  }

  function gambarKopi(x, y) {
    kotak(x, y, 6, 6, '#e8e8ee');
    kotak(x + 6, y + 1, 2, 3, '#e8e8ee');
    kotak(x + 1, y + 1, 4, 1, '#6b4530');
  }

  /* ---------------- meja ---------------- */
  /* ---------------- monitor ----------------
     Dulu semua layar menampilkan hal yang sama: garis kode berkedip.
     Sembilan layar dengan isi identik terbaca sebagai tekstur, bukan
     sebagai pekerjaan. Sekarang isinya dipilih dari `seed`, jadi tiap
     meja menampilkan sesuatu yang berbeda dan tetap tetap begitu —
     bukan berganti-ganti acak tiap bingkai, yang justru gelisah. */
  function layarKode(mx, my, lb, tg, t, seed) {
    var warna = [W.kodeHijau, W.kodeBiru, W.kodeUngu, W.kodeKuning];
    for (var i = 0; i * 3 + 2 < tg; i++) {
      var w2 = 2 + ((Math.sin(t / 260 + i * 1.4 + seed) * .5 + .5) * (lb - 4)) | 0;
      ctx.globalAlpha = .5 + .35 * Math.sin(t / 400 + i + seed);
      kotak(mx + 2, my + 2 + i * 3, w2, 1, warna[(i + seed) % 4]);
    }
    ctx.globalAlpha = 1;
  }

  function layarBatang(mx, my, lb, tg, t, seed) {
    var n = Math.max(3, Math.min(6, (lb - 4) >> 2));
    var lebar = 2, sela = ((lb - 4) - n * lebar) / Math.max(1, n - 1);
    for (var i = 0; i < n; i++) {
      var h = 2 + ((Math.sin(t / 900 + i * 1.7 + seed) * .5 + .5) * (tg - 6)) | 0;
      kotak(mx + 2 + i * (lebar + sela), my + tg - 2 - h, lebar, h,
            [W.kodeBiru, W.kodeUngu, W.kodeHijau][(i + seed) % 3], .85);
    }
    kotak(mx + 2, my + tg - 2, lb - 4, 1, '#3b4668');       // sumbu
  }

  function layarGaris(mx, my, lb, tg, t, seed) {
    var n = lb - 4;
    for (var i = 0; i < n; i++) {
      var y0 = (Math.sin((i + seed * 3) / 2.6 + t / 1100) * .5 + .5) * (tg - 6);
      kotak(mx + 2 + i, my + 2 + y0, 1, 1, W.kodeBiru, .9);
      // bayangan tipis di bawah garis supaya terbaca sebagai grafik
      kotak(mx + 2 + i, my + 3 + y0, 1, tg - 5 - y0, W.kodeBiru, .12);
    }
    kotak(mx + 2, my + tg - 2, lb - 4, 1, '#3b4668');
  }

  function layarSimpul(mx, my, lb, tg, t, seed) {
    var titik = [[.22,.28],[.62,.20],[.45,.55],[.80,.62],[.28,.78]];
    for (var i = 0; i < titik.length - 1; i++) {
      var x1 = mx + 2 + titik[i][0] * (lb - 4), y1 = my + 2 + titik[i][1] * (tg - 4);
      var x2 = mx + 2 + titik[i+1][0] * (lb - 4), y2 = my + 2 + titik[i+1][1] * (tg - 4);
      ctx.strokeStyle = W.kodeBiru; ctx.globalAlpha = .45;
      ctx.lineWidth = Math.max(1, P * .4);
      ctx.beginPath(); ctx.moveTo(x1 * P, y1 * P); ctx.lineTo(x2 * P, y2 * P); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (var j = 0; j < titik.length; j++) {
      var kd = .6 + .4 * Math.sin(t / 700 + j + seed);
      kotak(mx + 1 + titik[j][0] * (lb - 4), my + 1 + titik[j][1] * (tg - 4), 2, 2,
            j % 2 ? W.kodeHijau : W.kodeBiru, kd);
    }
  }

  function layarPapan(mx, my, lb, tg, t, seed) {
    // lingkaran kemajuan + dua baris angka
    var cx = (mx + lb * .68) * P, cy = (my + tg * .45) * P, r = Math.min(lb, tg) * .22 * P;
    ctx.strokeStyle = '#27314f'; ctx.lineWidth = Math.max(1, P * .7);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
    ctx.strokeStyle = W.kodeBiru;
    var maju = .35 + .3 * (Math.sin(t / 1500 + seed) * .5 + .5);
    ctx.beginPath(); ctx.arc(cx, cy, r, -1.57, -1.57 + 6.2832 * maju); ctx.stroke();
    for (var i = 0; i < 3; i++)
      kotak(mx + 2, my + 3 + i * 4, 3 + ((i + seed) % 4), 2,
            [W.kodeHijau, W.kodeKuning, W.kodeUngu][i], .8);
  }

  var LAYAR = [layarKode, layarBatang, layarGaris, layarSimpul, layarPapan];

  function gambarMonitor(mx, my, lb, tg, hidup, t, seed, kaki) {
    // kaki & leher dulu, supaya badan monitor menimpanya
    if (kaki) {
      kotak(mx + lb / 2 - 1, my + tg + 1, 2, 2, '#2b3252');
      kotak(mx + lb / 2 - 4, my + tg + 3, 8, 1, '#343c60');
    }
    kotak(mx - 1, my - 1, lb + 2, tg + 2, W.layarBingkai);   // bingkai
    kotak(mx - 1, my - 1, lb + 2, 1, '#2a3352');             // kilau tepi atas
    kotak(mx, my, lb, tg, hidup ? '#0b1730' : W.layarMati);

    if (hidup) {
      LAYAR[seed % LAYAR.length](mx, my, lb, tg, t, seed);
      // pendar layar ke ruangan
      var g = ctx.createRadialGradient((mx + lb / 2) * P, (my + tg / 2) * P, 0,
                                       (mx + lb / 2) * P, (my + tg / 2) * P, lb * P);
      g.addColorStop(0, 'rgba(103,232,249,.10)');
      g.addColorStop(1, 'rgba(103,232,249,0)');
      ctx.fillStyle = g;
      ctx.fillRect((mx - lb / 2) * P, (my - tg / 2) * P, lb * 2 * P, tg * 2 * P);
    } else {
      kotak(mx + 1, my + 1, lb - 2, 2, '#1a1e2c', .8);       // pantulan mati
    }
  }

  /* ---------------- kursi kantor ----------------
     Dulu cuma dua kotak bertumpuk. Kursi kantor punya bentuk yang sangat
     dikenali — sandaran kepala, sandaran punggung, sandaran tangan, dan
     kaki bintang lima. Empat bagian itu yang membuatnya terbaca sebagai
     kursi kerja, bukan bangku. */
  /* `bagian` memecah kursi jadi DUA LAPIS, untuk sosok yang benar-benar
     duduk di atasnya:

         'belakang'  digambar SEBELUM badannya
         'depan'     digambar SESUDAH badannya

     Gunanya satu: sandaran bawah harus menutupi pinggul dan tulang ekor
     orang yang duduk. Kursi sungguhan dilihat dari belakang memang
     begitu — punggungnya bersandar DI DEPAN sandaran, jadi yang lebih
     dekat ke kamera adalah kursinya, bukan orangnya. Waktu seluruh
     badan digambar di atas kursi, sandarannya hilang total dan sosoknya
     terbaca melayang di depan kursi, bukan duduk di dalamnya.

     Tanpa argumen ini kursinya digambar utuh seperti biasa, jadi semua
     pemanggil lain (meja kosong, Agen 1 & 2) tidak berubah sama sekali. */
  var KURSI_TUTUP = 7;        // piksel sandaran yang menimpa punggung

  function gambarKursi(x, y, kosong, bagian) {
    var belakang = (bagian !== 'depan');
    var depan    = (bagian !== 'belakang');

    if (belakang) {
      kotak(x + 3, y - 15, 8, 4, W.kursi);                 // sandaran kepala
      kotak(x + 4, y - 15, 6, 1, W.kursiTerang);
      kotak(x + 1, y - 11, 12, 11, W.kursi);               // sandaran punggung
      kotak(x + 2, y - 10, 10, 1, W.kursiTerang, .8);
      kotak(x + 2, y - 6, 10, 1, '#1e2338', .6);           // jahitan tengah
    }

    if (depan) {
      if (bagian === 'depan') {
        /* Sandaran bawah digambar ULANG di atas badannya, lengkap dengan
           rim kiri-kanan. Rim itu bukan hiasan: sandaran dan badan
           sama-sama selebar 12 piksel, jadi tepinya berimpit persis dan
           tanpa rim yang terbaca cuma balok gelap, bukan kursi. */
        var T = KURSI_TUTUP;
        kotak(x + 1, y - T, 12, T, W.kursi);
        kotak(x + 1, y - T, 12, 1, W.kursiTerang, .95);    // bibir sandaran
        kotak(x + 1, y - T, 1, T, W.kursiTerang, .7);      // rim kiri
        kotak(x + 12, y - T, 1, T, W.kursiTerang, .7);     // rim kanan
        kotak(x + 6, y - T + 1, 1, T - 1, '#1e2338', .6);  // jahitan tengah
      }
      kotak(x, y - 7, 1, 5, W.kursiTerang);                // sandaran tangan
      kotak(x + 13, y - 7, 1, 5, W.kursiTerang);
      kotak(x, y, 14, 3, W.kursiTerang);                   // dudukan
      kotak(x, y, 14, 1, '#4a5480', .7);
      kotak(x + 6, y + 3, 2, 4, '#20253c');                // silinder gas
      kotak(x + 1, y + 7, 12, 1, '#20253c');               // kaki bintang
      kotak(x + 3, y + 8, 2, 1, '#171b2e');                // roda
      kotak(x + 9, y + 8, 2, 1, '#171b2e');
    }
  }

  /* ---------------- meja: DUA LAPIS ----------------

     Meja tidak bisa digambar sekali jalan, dan ini sebabnya:

       monitor  ada di sisi JAUH meja  -> harus di BELAKANG orangnya
       badan meja ada di sisi DEKAT    -> harus di DEPAN orangnya

     Sekali jalan memaksa memilih salah satu. Kalau meja digambar sebelum
     orangnya, badan mejanya tertimbun dan orangnya tampak melayang di
     atas meja. Kalau sesudah, monitornya menimbun kepala orangnya.

     Jadi dipanggil dua kali per bingkai:
       'belakang' - monitor, barang di atas meja, kursi kosong
       'depan'    - badan meja, laci, papan ketik, papan nama

     Karakter digambar di antara keduanya. */
  function gambarSatuMeja(m, t, ketik, lapis) {
    var y = m.y;
    var belakang = (lapis === 'belakang');

    /* ---------------- lapis KURSI: paling dekat ke kamera ----------------
       Urutan kedalaman dari kamera, menurut Porscy:
         kursi  ->  orang  ->  meja  ->  monitor
       Jadi kursi digambar PALING AKHIR, menimpa semuanya. Itu sebabnya
       sandaran punggung menutupi separuh badan bawah orang yang duduk,
       dan kaki kursinya terlihat di depan muka meja — persis seperti
       melihat orang bekerja dari belakang kursinya. */
    if (lapis === 'kursi') {
      /* SATU RUMUS, TANPA PENGECUALIAN. Kursi selebar 15, jadi
         pusatnya kx+7. Disetel supaya kx+7 = pusat meja, persis.
         Versi sebelumnya punya empat cabang berbeda dan tiga di
         antaranya meleset 5-7 satuan dari pusat mejanya. */
      var kx = m.x + m.w / 2 - 7;
      var duduk = (m.isi === 'auditor')   ? auditorHadir()
                : STASIUN[m.isi]          ? STASIUN[m.isi].aktif
                : m.agen                  ? AGEN[m.agen].aktif
                : false;

      gambarKursi(kx, m.y + 8, !duduk);
      return;
    }

    if (belakang) {
      if (m.isi === 'monitor6') {
        for (var r = 0; r < 2; r++)
          for (var c = 0; c < 3; c++)
            gambarMonitor(m.x + 2 + c * 18, y - 32 + r * 16, 16, 14, true, t, r * 3 + c);

      } else if (m.isi === 'auditor') {
        // Layar menyala karena auditornya ADA, bukan karena irama
        // "mengetik" yang dulu berkedip sendiri. Meja kosong = layar mati.
        /* SATU monitor, lebar 26, dipusatkan di meja. Dua monitor tidak
           mungkin dua-duanya di tengah — dan yang diminta tengah persis. */
        var adaDia = auditorHadir();
        gambarMonitor(m.x + m.w / 2 - 13, y - 23, 26, 18, adaDia, t, 1, true);

      } else if (m.isi === 'nawala' || m.isi === 'blaster') {
        /* Meja Nawala & Blaster: monitor yang sama dengan meja lain, di
           tengah persis. Dulu keduanya memakai benda sendiri — kotak
           pengirim berantena dan ponsel berdiri. Niatnya menandai fungsi
           meja, tapi akibatnya dua meja terlihat bukan meja kerja.

           LAYARNYA MENGIKUTI ORANGNYA, aturan yang sama dengan meja
           auditor: ada yang duduk -> layar hidup, meja kosong -> layar
           mati. Sebelum checker tersambung, layarnya dipatok mati
           karena jalurnya memang belum tersambung; sekarang kehadirannya
           nyata, jadi layar mati kembali berarti sesuatu.

           Lampu siaga di bingkainya tetap berkedip pelan walau kosong —
           itu menandai alatnya terpasang, bukan sedang bekerja.

           Warnanya yang membedakan: merah untuk Blaster, hijau untuk
           Nawala. */
        var isNawala = (m.isi === 'nawala');
        var adaOrang = !!(STASIUN[m.isi] && STASIUN[m.isi].aktif);
        var mmx = m.x + m.w / 2 - 10;
        gambarMonitor(mmx, y - 19, 20, 15, adaOrang, t, 0, true);

        var siaga = .25 + .35 * Math.sin(t / (isNawala ? 1600 : 1400));
        var warnaSiaga = isNawala ? '#34d399' : '#f87171';
        kotak(mmx + 9, y - 3, 2, 1, warnaSiaga, siaga);      // lampu siaga di bingkai

        // pendar tipis, hanya saat layarnya mati — alatnya hidup, cuma
        // belum ada yang memakainya
        if (!adaOrang) kotak(mmx + 2, y - 17, 16, 1, warnaSiaga, siaga * .28);

        if (!isNawala) {
          // Antena kecil di atas monitor: satu-satunya sisa penanda
          // Blaster, dan tidak mengganggu bentuk mejanya.
          kotak(mmx + 17, y - 25, 1, 6, W.logam);
          kotak(mmx + 16, y - 27, 3, 2, '#f87171', siaga);
        }

        kotak(m.x + m.w / 2 - 9, y + 3, 18, 4, '#252a3c');   // papan ketik

      } else {
        /* Meja agen. `isi` memilih BENTUK meja, bukan siapa yang duduk —
           kehadiran datang dari agen1.json & agen2.json. */
        var agen = m.agen ? AGEN[m.agen] : null;
        // Layar menyala hanya kalau dia BEKERJA. Duduk siaga = layar tidur.
        var nyala = !!(agen && agen.aktif && !agen.siaga);
        /* Monitor SELALU di tengah meja. Dulu digeser ke kanan saat ada
           yang duduk, supaya agennya muat di kiri — tapi sekarang agennya
           sendiri duduk di tengah, jadi geseran itu justru memisahkan
           orang dari layarnya. */
        var mxm = m.x + m.w / 2 - 10;
        gambarMonitor(mxm, y - 19, 20, 15, nyala, t, [0, 3, 2, 4][m.agen] || 3, true);
      }
      return;
    }

    // ---------------- lapis DEPAN: badan meja ----------------
    kotak(m.x, y + MEJA_H - 3, m.w, 3, W.mejaKaki);
    kotak(m.x, y, m.w, MEJA_H - 3, W.meja);
    kotak(m.x, y, m.w, 2, W.mejaAtas);
    kotak(m.x, y, m.w, 1, W.mejaGaris, .75);          // urat kayu tepi atas
    kotak(m.x + 2, y + MEJA_H - 5, m.w - 4, 1, W.mejaLampu, .55);

    /* Unit laci, di sisi yang JAUH dari kursi supaya tidak terlihat
       menembus kaki orang yang duduk. */
    var lx = (m.laciKanan === false) ? (m.x + 2) : (m.x + m.w - 12);
    kotak(lx, y + 2, 10, MEJA_H - 4, '#232a48');
    kotak(lx, y + 2, 10, 1, '#323a60');
    for (var li = 0; li < 3; li++) {
      kotak(lx + 1, y + 3 + li * 3, 8, 2, '#2b3354');
      kotak(lx + 3, y + 4 + li * 3, 4, 1, W.mejaLampu, .5);
    }

    // barang DI ATAS meja — di depan orangnya
    if (m.isi === 'monitor6') {
      kotak(m.x + m.w / 2 - 13, y + 3, 26, 5, '#2a2f44');  // papan ketik RGB
      for (var i = 0; i < 7; i++)
        kotak(m.x + m.w / 2 - 11 + i * 3.4, y + 4, 2, 3,
              ['#f87171','#fbbf24','#4ade80','#22d3ee','#a78bfa'][i % 5], .85);
      kotak(m.x + m.w / 2 + 14, y + 4, 4, 3, '#2a2f44');   // tetikus
      gambarKopi(m.x + 3, y + 3);                         // hanya meja Porscy
    } else if (m.isi === 'auditor') {
      kotak(m.x + m.w / 2 - 10, y + 3, 20, 4, '#2a2f44');  // papan ketik, di tengah
      kotak(m.x + m.w / 2 + 13, y + 4, 4, 3, '#2a2f44');   // tetikus
    } else if (m.isi !== 'nawala' && m.isi !== 'blaster') {
      kotak(m.x + m.w / 2 - 9, y + 3, 18, 4, '#252a3c');   // papan ketik, di tengah
    }

    if (m.nama) {
      /* Papan nama kena penyakit yang sama dengan balon teks: angka px
         tetap di ruang gambar yang ikut diperkecil CSS. Lihat pxLayar().
         Batasnya LEBAR MEJA ITU SENDIRI — papan nama tidak boleh lebih
         lebar dari meja yang ia beri nama. */
      var MAKS = m.w * P;
      var fs = pxLayar(8, 10);
      var nama = papanPendek ? m.nama.replace(/^.*?'s\s*/, '') : m.nama, lt;
      for (var coba = 0; coba < 8; coba++) {
        ctx.font = '700 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
        lt = ctx.measureText(nama).width;
        if (lt + fs * 1.25 <= MAKS) break;
        fs *= (MAKS / (lt + fs * 1.25)) * .99;
      }
      /* PAPAN NAMA DI ATAS MONITOR, untuk SEMUA meja.

         Jaraknya diukur dari tepi atas monitor masing-masing, bukan
         satu angka untuk semua: monitor auditor lebih tinggi (mulai
         y-24) daripada monitor meja lain (y-20).

         Letaknya dihitung dari TEPI BAWAH papan, bukan titik tengahnya.
         Tinggi papan berubah menurut lebar layar (lihat pxLayar), dan
         memakai titik tengah membuat papan di ponsel merangsek turun
         sampai menabrak monitornya sendiri. Dengan tepi bawah dipatok,
         jaraknya ke monitor tetap sama di layar mana pun.

         Catatan jujur: di 390px papan Blaster & Nawala menimpa 4 satuan
         meja di barisan belakangnya — keduanya meja barisan DEPAN, dan
         ruang di atas monitornya memang sudah ditempati. Papannya
         digambar belakangan jadi tampil di atas, dan di layar lebar
         tidak bertumpuk sama sekali. */
      var pw = lt + fs * 1.25, ph = fs * 1.45;
      var jarakAtas = (m.isi === 'auditor') ? 25 : 21;
      var px = (m.x + m.w / 2) * P;
      var py = (y - jarakAtas) * P - ph / 2;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(10,8,22,.95)';
      ctx.strokeStyle = 'rgba(148,163,184,.6)';
      ctx.lineWidth = Math.max(1.5, fs * .1);
      ctx.beginPath(); ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, ph * .28);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9d4e4'; ctx.fillText(nama, px, py + fs * .04);
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    }
  }

  /* ---------------- penghuni manusia ----------------
     SATU KERANGKA untuk auditor, Blaster, dan Nawala. Ketiganya duduk
     membelakangi kamera dengan bentuk yang sama persis; yang berbeda
     cuma rambut, baju, dan kacamata.

     Dibuat satu fungsi sejak awal — bukan tiga yang mirip. Di kantor ini
     duplikasi sudah tiga kali menimbulkan bug yang sama: kursi auditor
     yang beda bentuk, agen yang lengannya tertinggal menghadap kanan,
     dan papan nama yang tidak ikut pindah. Kerangka yang dibagi tidak
     bisa melenceng sendiri-sendiri.

     GAYA RAMBUT membedakan mereka lebih dari warnanya saja — kalau
     kantornya dilihat kecil di ponsel, siluetnya yang menolong:
       ekor  auditor  rambut panjang diikat, jatuh ke punggung
       cepak Blaster  pendek berdiri, tengkuk terlihat
       bob   Nawala   menutupi telinga, rata di bawah

     Semua simetris terhadap sumbu x+5. Menambah sesuatu berarti
     menambah sepasang. */
  function gambarPenghuni(x, y, r) {
    // --- rambut lapis belakang: ekor kuda, kalau ada ---
    if (r.gaya === 'ekor') {
      kotak(x + 4, y + 4, 3, 3, r.rambut);
      kotak(x + 4, y + 5, 3, 1, r.pita);                 // pita ikat
      kotak(x + 4, y + 7, 2, 10, r.rambut);              // ekor
      kotak(x + 4, y + 13, 2, 4, r.ujung);               // ujung lebih gelap
    }

    // --- badan ---
    kotak(x + 1, y + 11, 8, 9, r.baju);
    kotak(x + 1, y + 11, 8, 1, r.bajuBayang);
    kotak(x + 4, y + 12, 1, 8, r.bajuBayang, .5);        // jahitan punggung
    kotak(x + 1, y + 17, 8, 3, r.bajuBayang, .3);
    kotak(x + 2, y + 11, 2, 1, r.kerah);                 // kerah kiri
    kotak(x + 6, y + 11, 2, 1, r.kerah);                 // kerah kanan

    // --- kepala & rambut ---
    if (r.gaya === 'cepak') {
      kotak(x + 2, y + 9, 6, 2, W.kulit);                // tengkuk terlihat
      kotak(x + 2, y + 3, 6, 6, r.rambut);
      kotak(x + 2, y + 4, 1, 3, r.gelap, .45);
      kotak(x + 7, y + 4, 1, 3, r.gelap, .45);
      kotak(x + 3, y + 2, 4, 1, r.rambut);
      kotak(x + 3, y + 1, 1, 1, r.rambut);               // jambul kecil
      kotak(x + 5, y + 1, 1, 1, r.rambut);
      kotak(x + 3, y + 2, 4, 1, r.gelap, .55);
    } else {
      kotak(x + 2, y + 3, 6, 8, r.rambut);
      kotak(x + 3, y + 2, 4, 1, r.rambut);               // ubun-ubun
      kotak(x + 3, y + 2, 4, 1, r.gelap, .6);            // kilau
      if (r.gaya === 'bob') {
        kotak(x + 1, y + 4, 1, 8, r.rambut);             // sisi menutupi telinga
        kotak(x + 8, y + 4, 1, 8, r.rambut);
        kotak(x + 1, y + 11, 1, 1, r.gelap, .7);         // ujung rata
        kotak(x + 8, y + 11, 1, 1, r.gelap, .7);
      } else {
        kotak(x + 2, y + 4, 1, 6, r.gelap, .45);
        kotak(x + 7, y + 4, 1, 6, r.gelap, .45);
      }
    }

    kotak(x + 4, y + 10, 2, 1, W.kulitGelap);            // tengkuk

    /* --- gagang kacamata, sepasang ---
       Dari belakang inilah satu-satunya bagian kacamata yang memang
       terlihat. Lensa di sini akan jadi kebohongan kecil. */
    if (r.kacamata) {
      kotak(x + 1, y + 7, 1, 1, W.bingkai, .95);
      kotak(x + 8, y + 7, 1, 1, W.bingkai, .95);
    }

    /* --- kedua lengan, PALING AKHIR ---
       Menjulur ke depan ke papan ketik. Kain sampai siku lalu kulit:
       penanda "lengan pendek" pada sosok sekecil ini. */
    kotak(x - 2, y + 12, 3, 4, r.baju);
    kotak(x + 9, y + 12, 3, 4, r.baju);
    kotak(x - 2, y + 15, 3, 1, r.lenganUjung);
    kotak(x + 9, y + 15, 3, 1, r.lenganUjung);
    kotak(x - 2, y + 16, 3, 2, W.kulit);
    kotak(x + 9, y + 16, 3, 2, W.kulit);
  }

  var RUPA_ORANG = {
    auditor: { gaya:'ekor',  kacamata:true,
               rambut:W.rambutHitam, gelap:'#241d2c', ujung:'#0f0c14', pita:'#4a3a58',
               baju:W.bajuPutih, bajuBayang:W.bajuPutihBayang,
               kerah:'#dfe4ee', lenganUjung:'#cdd4e2' },
    blaster: { gaya:'cepak', kacamata:false,
               rambut:'#c8442c', gelap:'#8f2a1a', ujung:'#6d1f13',
               baju:'#2f3550', bajuBayang:'#242a42',
               kerah:'#3f4668', lenganUjung:'#3f4668' },
    nawala:  { gaya:'bob',   kacamata:false,
               rambut:'#22a06b', gelap:'#187a52', ujung:'#10563b',
               baju:'#e6eaf2', bajuBayang:'#c5ccdb',
               kerah:'#f4f6fa', lenganUjung:'#c5ccdb' }
  };

  function gambarAuditor(t) {
    gambarPenghuni(AUDITOR.x, AUDITOR.y, RUPA_ORANG.auditor);
    daftarTombol('auditor-sheet', AUDITOR.x + 5, AUDITOR.y + 10);
  }

  /* Blaster & Nawala duduk dengan pola letak yang sama dengan auditor:
     x = pusat meja - 5, y = tutup meja - 16. Diturunkan dari mejanya,
     bukan ditulis tetap — angka tetap sudah dua kali membuat auditor
     berdiri sendirian di samping kursinya. */
  function gambarStasiun(kunci, keadaan, t) {
    if (!keadaan.aktif) return;
    var m = null;
    for (var i = 0; i < MEJA_SEMUA.length; i++)
      if (MEJA_SEMUA[i].isi === kunci) m = MEJA_SEMUA[i];
    if (!m) return;
    var x = m.x + m.w / 2 - 5, y = m.y - 16;

    gambarPenghuni(x, y, RUPA_ORANG[kunci]);

    if (kunci === 'blaster' || kunci === 'nawala')
      daftarTombol(kunci + '-status', x + 5, y + 10);

    if (kunci !== 'nawala' && !keadaan.siaga) {
      gambarBalon(keadaan.pesan || 'bekerja',
                  (x + 5) * P, atasPapanNama(m),
                  RUPA_ORANG[kunci].rambut, '#eef1f8', 0);
    }
  }

  /* ---------------- Agen 1, 2 & 3 (Claude) ----------------
     SATU FUNGSI, TIGA RUPA. Sebelumnya tiga fungsi yang 90% sama, dan
     itu sudah terbukti mahal: tiap perbaikan harus disalin tiga kali,
     dan yang terlewat jadi berbeda diam-diam.

     BENTUK DUDUKNYA DISAMAKAN DENGAN AUDITOR. Versi lama berbadan 9
     satuan dengan bahu 11, sementara sandaran kursi cuma 12 — kursinya
     tertutup habis, persis bug yang dulu dialami auditor. Kepalanya 8
     satuan menutupi bantalan kepala yang juga 8. Dan lengannya masih
     menjulur ke KANAN saja, sisa dari zaman agen duduk di kiri meja.

     Angka yang membuatnya terbaca duduk, sama dengan auditor:

       sandaran 12  badan  8  -> 2 satuan kursi terlihat tiap sisi
       bantalan  8  kepala 6  -> 1 satuan terlihat tiap sisi
       kedua lengan simetris, menjulur ke depan ke papan ketik

     Yang TIDAK disamakan, dan memang tidak boleh: ketiganya tetap tanpa
     wajah dan tembus pandang. Mereka bukan manusia yang kebetulan tidak
     terlihat wajahnya — di meja itu memang tidak ada siapa-siapa. */
  var RUPA_AGEN = {
    /* Warna & tanda wajah tiap agen. Alasan pemilihannya:

       - Tiga keluarga warna yang saling jauh. Ruangan ini sudah penuh
         cyan (layar), hijau (Nawala), merah (siaga Blaster); amber, ungu,
         dan mawar yang tersisa. Dua penghuni berwarna mirip akan
         tertukar sekali lihat di layar ponsel.

       - Tiga BENTUK tanda yang berbeda, bukan cuma tiga warna. Kalau
         suatu saat kantor ini dilihat hitam-putih atau oleh mata yang
         sulit membedakan warna, bentuknya yang menyelamatkan.

       - Tiga irama denyut. Kalau bertiga duduk bersamaan, ruangan terasa
         berisi tiga makhluk, bukan satu mesin bercabang tiga. */
    1: { badan:'#3f4674', gelap:'#333a61', kepala:'#2c3157', tepi:'#5b64a0',
         tanda:'#ffb86b', terang:'#ffd9a8', rgb:'255,184,107',
         denyut:620, alpha:.84, bentuk:'pita' },
    2: { badan:'#4a3f70', gelap:'#3b3159', kepala:'#352d54', tepi:'#7c6bb8',
         tanda:'#c4b5fd', terang:'#ece7ff', rgb:'196,181,253',
         denyut:840, alpha:.72, bentuk:'celah' },
    3: { badan:'#6b3a4e', gelap:'#582f40', kepala:'#4a2838', tepi:'#a85a72',
         tanda:'#fb7185', terang:'#ffd9de', rgb:'251,113,133',
         denyut:1080, alpha:.78, bentuk:'cincin' }
  };

  function gambarAgenDuduk(nomor, t) {
    var a = AGEN[nomor];
    if (!a || !a.aktif) return;
    var m = mejaAgen(nomor);
    if (!m) return;
    var r = RUPA_AGEN[nomor];

    // Diletakkan dengan pola yang sama persis seperti auditor.
    var x = m.x + m.w / 2 - 5, y = m.y - 16;
    var nadi = .5 + .5 * Math.sin(t / r.denyut);
    /* Saat siaga sosoknya lebih samar dan tandanya lebih redup —
       hadir, tapi jelas sedang tidak mengerjakan apa-apa. */
    var redup = a.siaga ? .55 : 1;

    // pendar di sekeliling — menandakan kehadiran, bukan benda
    var g = ctx.createRadialGradient((x + 5) * P, (y + 10) * P, 0,
                                     (x + 5) * P, (y + 10) * P, 24 * P);
    g.addColorStop(0, 'rgba(' + r.rgb + ',' + (.15 + .07 * nadi) + ')');
    g.addColorStop(1, 'rgba(' + r.rgb + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect((x - 18) * P, (y - 14) * P, 46 * P, 46 * P);

    ctx.globalAlpha = r.alpha * redup;

    // badan 8 satuan — lebih sempit dari sandaran 12
    kotak(x + 1, y + 11, 8, 9, r.badan);
    kotak(x + 1, y + 11, 8, 1, r.tepi);
    kotak(x + 4, y + 12, 1, 8, r.tepi, .35);          // garis tengah badan
    kotak(x + 1, y + 17, 8, 3, r.gelap);

    // kepala 6 satuan — lebih sempit dari bantalan kepala 8
    kotak(x + 2, y + 3, 6, 8, r.kepala);
    kotak(x + 2, y + 3, 6, 1, r.tepi);

    ctx.globalAlpha = 1;

    /* Garis pindai merayap naik — khusus Agen 2. Dia hadir sebagai
       sesuatu yang sedang DIALIRKAN ke sini, karena memang begitu:
       Porscy mengendalikannya dari jauh lewat Remote Control.

       HARUS digambar sesudah globalAlpha kembali ke 1: kotak() yang
       dipanggil dengan argumen alpha selalu menyetel ulang globalAlpha,
       jadi memakainya di tengah blok tembus pandang akan diam-diam
       membatalkan ketembusan sisa tubuh. */
    if (nomor === 2) {
      var geser = 2 - (((t / 130) | 0) % 3);
      for (var sy = y + 11; sy < y + 20; sy += 3)
        kotak(x + 1, sy + geser, 8, 1, r.terang, .13);
    }

    // --- tanda wajah: tiga bentuk berbeda ---
    var terang = (.62 + .38 * nadi) * redup;
    ctx.globalAlpha = terang;
    if (r.bentuk === 'pita') {                      // Agen 1: pita mendatar
      kotak(x + 3, y + 6, 4, 2, r.tanda);
      kotak(x + 4, y + 6, 2, 1, r.terang);
    } else if (r.bentuk === 'celah') {              // Agen 2: celah tegak
      kotak(x + 5, y + 5, 1, 5, r.tanda);
      kotak(x + 5, y + 6, 1, 3, r.terang);
    } else {                                        // Agen 3: cincin
      kotak(x + 3, y + 5, 4, 1, r.tanda);
      kotak(x + 3, y + 8, 4, 1, r.tanda);
      kotak(x + 3, y + 6, 1, 2, r.tanda);
      kotak(x + 6, y + 6, 1, 2, r.tanda);
      kotak(x + 4, y + 5, 2, 1, r.terang);
    }
    ctx.globalAlpha = 1;

    var gv = ctx.createRadialGradient((x + 5) * P, (y + 7) * P, 0,
                                      (x + 5) * P, (y + 7) * P, 10 * P);
    gv.addColorStop(0, 'rgba(' + r.rgb + ',' + (.40 * terang) + ')');
    gv.addColorStop(1, 'rgba(' + r.rgb + ',0)');
    ctx.fillStyle = gv;
    ctx.fillRect((x - 4) * P, (y - 2) * P, 20 * P, 20 * P);

    /* --- kedua lengan, PALING AKHIR dan SIMETRIS ---
       Sesudah tanda wajah supaya tidak tertimbun, dan simetris karena
       dia duduk lurus menghadap monitornya. Versi lama menjulurkan
       keduanya ke kanan — sisa dari zaman agen duduk di kiri meja. */
    ctx.globalAlpha = r.alpha * redup;
    kotak(x - 1, y + 12, 2, 4, r.badan);
    kotak(x + 9, y + 12, 2, 4, r.badan);
    kotak(x - 1, y + 16, 2, 2, r.tepi);
    kotak(x + 9, y + 16, 2, 2, r.tepi);
    ctx.globalAlpha = 1;

    /* BALONNYA DIAM KALAU TIDAK ADA PEKERJAAN.
       Duduk siaga sudah terlihat dari sosoknya yang ada di kursi dan
       layarnya yang tidur; balon bertuliskan "menunggu perintah" cuma
       menambah satu kotak teks yang tidak memberi kabar apa-apa. Balon
       yang selalu muncul juga berhenti berarti "ada yang sedang
       dikerjakan" — dan justru itu gunanya. */
    if (a.siaga) return;

    /* Balon naik satu tingkat untuk tiap agen bernomor lebih kecil yang
       BENAR-BENAR BERBALON, supaya balon mereka tidak saling menutupi.
       Dihitung dari yang berbalon, bukan dari yang aktif: agen siaga
       tidak lagi punya balon, dan kalau ia tetap dihitung, balon agen
       sesudahnya melayang satu tingkat di atas ruang kosong. */
    var tingkat = 0;
    for (var n = 1; n < nomor; n++)
      if (AGEN[n] && AGEN[n].aktif && !AGEN[n].siaga) tingkat++;
    gambarBalon(a.pesan || 'bekerja',
                (x + 5) * P, atasPapanNama(m), r.tanda, '#f2edf6', tingkat);
  }

  function gambarAgen1(t) { gambarAgenDuduk(1, t); }
  function gambarAgen2(t) { gambarAgenDuduk(2, t); }
  function gambarAgen3(t) { gambarAgenDuduk(3, t); }

  /* ---------------- LordPors ----------------
     Proporsinya memakai modul yang sama dengan penghuni lain: kepala 6,
     badan 8, bahu 12 satuan. Dia tampak lebih tinggi hanya karena berdiri,
     bukan karena skalanya berbeda. Tetap membelakangi penonton. */
  function gambarPors(t) {
    var x = PORS.x, y = PORS.y;
    var napas = Math.sin(t / 1500) * .25;

    ctx.globalAlpha = .36; kotak(x, y + 30, 10, 2, '#000'); ctx.globalAlpha = 1;

    // ---- kaki: jeans ----
    kotak(x + 1, y + 19, 3, 9, W.jeans);
    kotak(x + 6, y + 19, 3, 9, W.jeans);
    kotak(x + 4, y + 20, 2, 8, W.jeansGelap, .85);      // celah antar kaki
    kotak(x + 1, y + 24, 3, 1, W.jeansGelap, .45);
    kotak(x + 6, y + 24, 3, 1, W.jeansGelap, .45);

    // ---- Converse high-top, tampak dari belakang ----
    for (var S = 0; S < 2; S++) {
      var sx = x + 1 + S * 5;
      kotak(sx, y + 27, 3, 2, W.sepatu);
      kotak(sx + 1, y + 28, 1, 1, '#e2e2e8');
      kotak(sx, y + 29, 3, 1, '#2a2a33');
      kotak(sx, y + 30, 3, 1, '#efe6d4');
    }

    // ---- badan: hoodie ----
    kotak(x + 1, y + 9 + napas, 8, 11, W.kaosHitam);
    kotak(x + 1, y + 9 + napas, 8, 1, '#25252f');
    kotak(x + 5, y + 11 + napas, 1, 9, W.kaosGelap, .85);
    kotak(x + 1, y + 18 + napas, 8, 2, W.kaosGelap);

    // ---- lengan ----
    kotak(x - 1, y + 10 + napas, 2, 8, W.kaosHitam);
    kotak(x + 9, y + 10 + napas, 2, 8, W.kaosHitam);
    kotak(x - 1, y + 17 + napas, 2, 2, W.kaosGelap);
    kotak(x + 9, y + 17 + napas, 2, 2, W.kaosGelap);
    kotak(x - 1, y + 19 + napas, 2, 2, W.kulitGelap);
    kotak(x + 9, y + 19 + napas, 2, 2, W.kulitGelap);

    // ---- tudung NAIK ----
    kotak(x + 2, y + 1, 6, 8, W.kaosGelap);
    kotak(x + 3, y, 4, 1, W.kaosGelap);
    kotak(x + 1, y + 7, 8, 3, W.kaosGelap);
    kotak(x + 3, y + 4, 4, 3, '#09080c');
    kotak(x + 3, y + 8, 4, 1, '#25252f', .7);                // jahitan tudung

    // Cahaya jendela menjaga siluet hitam tetap terbaca.
    kotak(x - 1, y + 10 + napas, 1, 9, '#93a9de', .7);
    kotak(x + 2, y, 1, 8, '#93a9de', .6);
    kotak(x + 3, y, 4, 1, '#aebbe8', .5);
    kotak(x + 10, y + 10 + napas, 1, 9, '#c084fc', .45);
  }

  /* ---------------- balon teks — dipakai semua penghuni ----------------

     KENAPA UKURAN HURUFNYA DIHITUNG, BUKAN DITULIS TETAP.

     Kanvas ini digambar dalam satuan 1440 x 760 (LEBAR*P x TINGGI*P),
     lalu DIPERKECIL oleh CSS supaya muat layar. Di monitor selebar
     1200px pengecilannya cuma 1,2x — teks 13px mendarat jadi ~11px,
     masih terbaca. Di ponsel selebar 360px pengecilannya 4x: teks 13px
     yang sama mendarat jadi 3,3px. Itu sebab teksnya dulu terlihat buram
     seperti noda — bukan salah font, bukan salah anti-alias, melainkan
     angka tetap yang dipakai di ruang gambar yang ikut mengecil.

     Jadi ukuran huruf dihitung MUNDUR dari lebar kanvas yang benar-benar
     tampil, supaya hasil akhirnya selalu ~16px di layar mana pun.
     JANGAN mengembalikannya ke angka tetap. */
  /* Ukuran huruf IKUT lebar layar, bukan satu angka untuk semua.
     16px yang pas di monitor terasa kebesaran di ponsel karena
     panggungnya ikut menyempit — balonnya sampai memakan 84% lebar
     layar. Jadi: lebih kecil di layar sempit, lebih besar di layar
     lebar, dengan lantai yang tetap nyaman dibaca.

     `kecil` berlaku di 360px ke bawah, `besar` di 1200px ke atas. */
  function targetCss(kecil, besar) {
    var tampil = kanvas.clientWidth || (LEBAR * P);
    var f = Math.max(0, Math.min(1, (tampil - 360) / 840));
    return kecil + (besar - kecil) * f;
  }
  function pxLayar(kecil, besar) {
    var tampil = kanvas.clientWidth || (LEBAR * P);
    return targetCss(kecil, besar) * (LEBAR * P) / tampil;
  }

  /* SEMUA PAPAN NAMA MEMENDEK BERSAMAAN, atau tidak sama sekali.

     Kalau tiap meja memutuskan sendiri, yang muat tetap panjang dan yang
     tidak jadi pendek — di 390px hasilnya "Agent 1", "Agent 2",
     "Blaster", lalu "Nawala Checker". Deretan yang setengah panjang
     setengah pendek terbaca seperti kesalahan, bukan seperti pilihan.
     Jadi begitu SATU papan tidak muat, semuanya ikut dipendekkan. */
  var papanPendek = false;
  function tentukanPapan() {
    var fs = pxLayar(8, 10);
    ctx.font = '700 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
    papanPendek = false;
    for (var i = 0; i < MEJA_SEMUA.length; i++) {
      var m = MEJA_SEMUA[i];
      if (!m.nama) continue;
      if (ctx.measureText(m.nama).width + fs * 1.25 > m.w * P) { papanPendek = true; return; }
    }
  }

  /* Tepi ATAS papan nama sebuah meja, dalam satuan gambar.
     Dipakai untuk menaruh balon tugas tepat di atasnya, jadi tumpukannya
     dari bawah ke atas: kepala -> label status -> papan nama -> balon.
     Dihitung ulang tiap dipanggil karena tinggi papan ikut lebar layar. */
  function atasPapanNama(m) {
    var fs = pxLayar(8, 10);
    var jarakAtas = (m.isi === 'auditor') ? 25 : 21;
    return (m.y - jarakAtas) * P - fs * 1.45 - 4;
  }

  /* ---------------- balon tugas ----------------

     BALON SELALU DI LAPIS PALING ATAS, dan itu perlu antrian.

     Sosoknya digambar SEBELUM lapis 'kursi' — memang harus, supaya
     kursinya menutupi separuh badan seperti orang yang benar-benar
     duduk. Tapi balonnya ikut terbawa ke bawah lapis itu, dan kursi
     LordPors yang tinggi menutupi balon Blaster di sebelahnya.

     Menggambar balonnya belakangan di dalam fungsi sosok juga tidak
     menolong: 'kursi' tetap digambar sesudah SELURUH sosok selesai.

     Jadi `gambarBalon()` tidak lagi melukis, ia cuma MENCATAT. Seluruh
     antriannya dituang oleh `siramBalon()` di baris terakhir bingkai(),
     sesudah kursi, tanaman, tombol, dan label status. Pemanggilnya tidak
     perlu tahu apa-apa soal ini — urutan panggilannya tetap sama.

     Antriannya dikosongkan tiap awal bingkai, bukan tiap tuang: kalau
     ada bingkai yang keluar lebih awal, balon bingkai sebelumnya tidak
     boleh ikut tertinggal dan tergambar dua kali. */
  var ANTRE_BALON = [];
  var MULAI_GULIR = Object.create(null);

  function gambarBalon(teks, pusatX, bawahY, warnaTepi, warnaTeks, tingkat, lebarMaks, laju, tautan) {
    ANTRE_BALON.push([teks, pusatX, bawahY, warnaTepi, warnaTeks, tingkat, lebarMaks, laju, tautan]);
  }

  function siramBalon() {
    for (var i = 0; i < ANTRE_BALON.length; i++)
      lukisBalon.apply(null, ANTRE_BALON[i]);
    ANTRE_BALON.length = 0;
  }

  /* pusatX/bawahY dalam satuan gambar (sudah dikali P).
     tingkat 0 = balon menempel di atas kepala; 1 = ditumpuk satu tingkat
     lebih tinggi, dipakai kalau dua agen bicara bersamaan. */
  function lukisBalon(teks, pusatX, bawahY, warnaTepi, warnaTeks, tingkat, lebarMaks, laju, tautan) {
    /* Tetap ringkas: 8-11px dan maksimal 55% panggung. Teks pendek diam;
       teks panjang digulir di dalam lebar itu agar tak ada yang dipotong. */
    teks = String(teks || '');
    var fs = pxLayar(8, 11);
    var maxW = LEBAR * P * (lebarMaks || .55);
    ctx.font = '600 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
    var lt = ctx.measureText(teks).width;
    var pad = fs * .85;
    var gw = Math.min(maxW, lt + pad * 2 + fs * 1.05);

    var gh = fs * 2.1;
    var naik = (tingkat || 0) * (gh + fs * .5);
    var gx = Math.max(6, Math.min(LEBAR * P - gw - 6, pusatX - gw / 2));
    var gy = Math.max(6, bawahY - gh - naik);
    var LATAR = 'rgba(8,7,20,.96)';

    ctx.fillStyle = LATAR;
    ctx.strokeStyle = warnaTepi;
    ctx.lineWidth = Math.max(1.5, fs * .1);
    ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, gh * .3);
    ctx.fill(); ctx.stroke();
    if (tautan)
      TOMBOL.push({ id: tautan, x: gx / P, y: gy / P, w: gw / P, h: gh / P });

    /* Ekor kecil menunjuk ke bawah. Dengan tiga penghuni di ruangan,
       penonton harus tahu balon ini milik siapa tanpa menebak.
       Diisi SESUDAH kotaknya supaya garis bawah kotak tertutup, lalu
       hanya dua sisi miringnya yang digaris — kalau tidak, akan tampak
       garis melintang yang menutup mulut ekornya. */
    var ew = fs * .38, eh = fs * .55;
    var ex = Math.max(gx + gh * .3 + ew, Math.min(gx + gw - gh * .3 - ew, pusatX));
    var ey = gy + gh;
    ctx.beginPath();
    ctx.moveTo(ex - ew, ey - ctx.lineWidth);
    ctx.lineTo(ex, ey + eh);
    ctx.lineTo(ex + ew, ey - ctx.lineWidth);
    ctx.closePath();
    ctx.fillStyle = LATAR; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ex - ew, ey - ctx.lineWidth);
    ctx.lineTo(ex, ey + eh);
    ctx.lineTo(ex + ew, ey - ctx.lineWidth);
    ctx.stroke();

    // Kalau balonnya ditumpuk, tarik benang tipis sampai ke kepala
    // pemiliknya supaya tetap jelas siapa yang bicara.
    if (naik > 0) {
      ctx.globalAlpha = .45;
      ctx.beginPath();
      ctx.moveTo(ex, ey + eh);
      ctx.lineTo(ex, bawahY);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = warnaTepi;
    ctx.beginPath();
    ctx.arc(gx + pad + fs * .28, gy + gh / 2, fs * .26, 0, 6.2832);
    ctx.fill();

    var tx = gx + pad + fs * .92;
    var ruang = gw - (tx - gx) - pad;
    var geser = 0;
    if (lt > ruang) {
      var kini = performance.now();
      var rekam = MULAI_GULIR[teks];
      if (!rekam || kini - rekam.terlihat > 250)
        rekam = MULAI_GULIR[teks] = { mulai:kini, terlihat:kini };
      rekam.terlihat = kini;
      var jarak = lt - ruang;
      var jeda = 1100;
      var durasi = jarak / (fs * (laju || 2.8)) * 1000;
      var langkah = (kini - rekam.mulai) % (jeda * 2 + durasi);
      if (langkah > jeda)
        geser = langkah < jeda + durasi
          ? (langkah - jeda) / durasi * jarak
          : jarak;
    }

    // Potong pada bagian dalam bubble; titik pemilik dan tepinya tetap utuh.
    ctx.save();
    ctx.beginPath(); ctx.rect(tx, gy, ruang, gh); ctx.clip();
    ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillStyle = warnaTeks || '#eef1f8';
    ctx.fillText(teks, tx - geser, gy + gh / 2 + fs * .03);
    ctx.restore();
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  /* ---------------- status online penghuni ----------------
     Label kecil di atas kepala penghuni yang terhubung.

     Sengaja TIDAK memakai gambarBalon(). Balon itu untuk kabar pekerjaan
     yang datang dan pergi; ini penanda yang menetap selama sambungannya
     hidup. Penanda yang menetap harus kecil dan tidak merebut perhatian
     dari adegan — jadi ukurannya disamakan dengan papan nama meja, bukan
     dengan balon. */
  function gambarStatusOnline(pusatX, atasY, t) {
    var fs = pxLayar(7, 9);
    ctx.font = '700 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
    var teks = 'online';
    var lt = ctx.measureText(teks).width;
    var ph = fs * 1.5, pw = lt + fs * 2.5;
    var px = pusatX * P;
    var gx = Math.max(4, Math.min(LEBAR * P - pw - 4, px - pw / 2));
    var gy = atasY * P - ph;

    ctx.fillStyle = 'rgba(8,7,20,.94)';
    ctx.strokeStyle = 'rgba(52,211,153,.55)';
    ctx.lineWidth = Math.max(1, fs * .1);
    ctx.beginPath(); ctx.roundRect(gx, gy, pw, ph, ph * .5);
    ctx.fill(); ctx.stroke();

    // Titik hijau berdenyut — tanda sambungan yang hidup, bukan hiasan.
    var nadi = .55 + .45 * Math.sin(t / 900);
    ctx.globalAlpha = nadi;
    ctx.fillStyle = W.hijau;
    ctx.beginPath(); ctx.arc(gx + fs * .9, gy + ph / 2, fs * .26, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText(teks, gx + fs * 1.5, gy + ph / 2 + fs * .04);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  function gambarSemuaStatusOnline(t) {
    for (var n = 1; n < AGEN.length; n++) {
      var m = mejaAgen(n);
      if (AGEN[n].aktif && m) gambarStatusOnline(m.x + m.w / 2, m.y - 15, t);
    }
    for (var i = 0; i < MEJA_SEMUA.length; i++) {
      var meja = MEJA_SEMUA[i];
      if ((meja.isi === 'blaster' && blaster.aktif) ||
          (meja.isi === 'nawala' && nawala.aktif))
        gambarStatusOnline(meja.x + meja.w / 2, meja.y - 15, t);
    }
    if (auditor.online) gambarStatusOnline(AUDITOR.x + 5, AUDITOR.y + 1, t);
  }

  /* ---------------- gelembung auditor ---------------- */
  var gelembung = null;
  function gambarGelembung(t) {
    if (!gelembung || t > gelembung.sampai) return;
    // Naik setinggi label status kalau labelnya sedang tampil, supaya
    // keduanya tidak saling menimpa di atas kepala yang sama.
    gambarBalon(gelembung.teks, (AUDITOR.x + 5) * P,
                atasPapanNama(MEJA_AUDITOR),
                gelembung.warna, '#eef1f8', 0);
  }

  /* ---------------- status ---------------- */
  var status = { keadaan: 'hiasan' }, statusLama = '', modeNyata = false;

  /* Agen 1 & 2 — dibaca dari kantor/agen1.json dan agen2.json.
     Berkas itu ditulis oleh agen1.py / agen2.py saat Claude mulai dan
     selesai mengerjakan tugas, jadi karakternya benar-benar muncul
     ketika ada pekerjaan berjalan, bukan sekadar hiasan. Kalau
     berkasnya tidak ada atau lebih tua dari 5 menit, mejanya kembali
     kosong.

     Keduanya sesi Claude yang berbeda dan boleh duduk bersamaan —
     itulah gunanya dipisah jadi dua berkas dan dua kunci blob. */
  /* Wanita auditor terhubung ke bot anggaran SEO milik Porscy yang jalan
     di Termux pada HP-nya. Botnya mengirim detak ke penerima-auditor.py,
     yang menulis auditor.json — berkas ini yang dibaca di sini.

     Basi setelah 2 menit: kalau botnya mati atau HP-nya kehilangan
     sinyal, labelnya hilang sendiri. Sama seperti kehadiran agen, kantor
     tidak boleh mengaku sesuatu hidup padahal sudah lama diam. */
  var auditor = { online: false, pesan: '', lama: null };

  /* Auditor HADIR kalau botnya hidup, atau kalau audit sungguhan sedang
     berjalan. Yang kedua penting: menekan tombol + di kursinya menyalakan
     audit, dan dia harus muncul mengerjakannya — kalau tidak, menekan
     tombol terasa tidak menghasilkan apa-apa. */
  function auditorHadir() { return auditor.online || modeNyata; }

  /* Hanya titik sentuh sosok Blaster; tidak ada tombol + atau menu tugas. */
  var TOMBOL = [];

  /* jenis 'tambah' -> lingkaran + tergambar di kursi kosong.
     jenis 'sosok'   -> titik sentuh TAK TERGAMBAR di atas orang yang
     sedang duduk. Menggambar + di atas kepala orang yang sedang bekerja
     akan terbaca seperti ajakan menambah orang kedua di kursi yang sama. */
  function mejaAgen(n) {
    for (var i = 0; i < MEJA_SEMUA.length; i++)
      if (MEJA_SEMUA[i].agen === n) return MEJA_SEMUA[i];
    return null;
  }

  function daftarTombol(id, x, y) {
    TOMBOL.push({ id: id, x: x, y: y });
  }
  /* `siaga` = duduk tapi tidak mengerjakan apa pun. Porscy minta agennya
     selalu ada di kantor; tanpa keadaan kedua ini, "duduk" berhenti
     berarti "sedang bekerja" dan kantor tidak memberi tahu apa-apa lagi. */
  var agen1 = { aktif: false, siaga: false, pesan: '', lama: null };
  var agen2 = { aktif: false, siaga: false, pesan: '', lama: null };
  var agen3 = { aktif: false, siaga: false, pesan: '', lama: null };
  var blaster = { aktif: false, siaga: false, pesan: '', lama: null };
  var nawala  = { aktif: false, siaga: true, pesan: '', sites: [] };
  // Stasiun berpenghuni manusia, dibaca dari berkas bernama sama.
  var STASIUN = { blaster: blaster, nawala: nawala };
  // Dicari lewat nomornya, bukan lewat indeks meja. Menambah Agen 4
  // berarti menambah satu baris di sini dan satu di MEJA_SEMUA.
  var AGEN = [null, agen1, agen2, agen3];
  window.KANTOR = {
    log: function () {},
    modeNyata: function () { return modeNyata; }
  };

  var infoBlaster = { teks: '', sampai: 0 };
  var infoNawalaTerbuka = false;
  var infoAuditorTerbuka = false;
  var SHEET_COST_URL = 'https://docs.google.com/spreadsheets/d/1HVtpuXBVkBFMIF-ydRRTTlhasRk1Dg7V23uKBiXY4Sg/edit#gid=0';

  function bukaStatusBlaster() {
    infoBlaster = { teks: 'Memuat status akun…', sampai: performance.now() + 15000 };
    fetch('https://kantor-lordpors.vercel.app/api/blaster-status?t=' + Date.now(), {
      cache: 'no-store'
    })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (d) {
        infoBlaster = {
          teks: 'Aktif ' + d.active + ' · Flood ' + d.flood + ' · Total ' + d.total,
          sampai: performance.now() + 20000
        };
      })
      .catch(function () {
        infoBlaster = { teks: 'Status akun gagal dimuat', sampai: performance.now() + 8000 };
      });
  }

  function gambarInfoBlaster(t) {
    if (!blaster.aktif || !infoBlaster.teks || t > infoBlaster.sampai) return;
    for (var i = 0; i < MEJA_SEMUA.length; i++) {
      var m = MEJA_SEMUA[i];
      if (m.isi === 'blaster') {
        gambarBalon(infoBlaster.teks, (m.x + m.w / 2) * P, atasPapanNama(m),
                    '#f87171', '#eef1f8', blaster.siaga ? 0 : 1);
        return;
      }
    }
  }

  function gambarInfoNawala(t) {
    if (!nawala.aktif || !infoNawalaTerbuka) return;
    for (var i = 0; i < MEJA_SEMUA.length; i++) {
      var m = MEJA_SEMUA[i];
      if (m.isi !== 'nawala') continue;
      var teks = nawala.sites.length ? nawala.sites.map(function (s) {
        var tidakTerukur = Object.keys(s.isp || {}).some(function (k) {
          return s.isp[k] === 'unmeasured';
        });
        var hasil = s.blocked ? 'NAWALA' : s.http === 'down' ? 'DOWN'
                  : tidakTerukur ? 'TIDAK TERUKUR' : 'AMAN';
        return s.domain + ': ' + hasil;
      }).join('  ·  ') : 'Belum ada hasil pemeriksaan';
      gambarBalon(teks, (m.x + m.w / 2) * P, atasPapanNama(m),
                  nawala.sites.some(function (s) { return s.blocked; }) ? '#f87171' : '#34d399',
                  '#eef1f8', 0, .22, 2.0);
      return;
    }
  }

  function gambarInfoAuditor(t) {
    if (!auditorHadir() || !infoAuditorTerbuka) return;
    var ditumpuk = gelembung && t <= gelembung.sampai ? 1 : 0;
    gambarBalon('Buka Sheet Cost SEO ↗', (AUDITOR.x + 5) * P,
                atasPapanNama(MEJA_AUDITOR), '#67e8f9', '#eef1f8',
                ditumpuk, null, null, 'auditor-sheet-link');
  }

  /* Titik klik -> tombol mana. Hitungannya dari getBoundingClientRect()
     supaya benar berapa pun kanvasnya diperkecil CSS.

     Radius sentuh (11) sengaja dua kali radius gambarnya (5,2): di ponsel
     tombol selebar 11px mustahil ditekan tepat, dan meleset sedikit tidak
     boleh berarti tidak terjadi apa-apa. */
  function tombolDi(klienX, klienY) {
    var r = kanvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var x = (klienX - r.left) / r.width * LEBAR;
    var y = (klienY - r.top) / r.height * TINGGI;
    var dekat = null, jarak = 11;
    for (var i = 0; i < TOMBOL.length; i++) {
      var b = TOMBOL[i];
      if (b.w && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)
        return b;
      var d = Math.sqrt((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y));
      if (d < jarak) { jarak = d; dekat = b; }
    }
    return dekat;
  }

  kanvas.addEventListener('click', function (e) {
    var b = tombolDi(e.clientX, e.clientY);
    if (b && b.id === 'blaster-status') bukaStatusBlaster();
    if (b && b.id === 'nawala-status') infoNawalaTerbuka = !infoNawalaTerbuka;
    if (b && b.id === 'auditor-sheet') infoAuditorTerbuka = !infoAuditorTerbuka;
    if (b && b.id === 'auditor-sheet-link')
      window.open(SHEET_COST_URL, '_blank', 'noopener,noreferrer');
  });
  kanvas.addEventListener('mousemove', function (e) {
    kanvas.style.cursor = tombolDi(e.clientX, e.clientY) ? 'pointer' : 'default';
  });

  function tanggapi(s) {
    var kunci = s.keadaan + '|' + (s.situs || '') + '|' + (s.selesai || 0);
    if (kunci === statusLama) return;
    statusLama = kunci;
    var now = performance.now();
    var L = window.KANTOR.log;
    if (s.keadaan === 'memeriksa') {
      gelembung = { teks: (s.situs || '').replace(/^https?:\/\//, ''),
                    warna: '#67e8f9', sampai: now + 30000 };
      L('memeriksa ' + (s.situs || '').replace(/^https?:\/\//, ''), 'kerja');
    } else if (s.keadaan === 'hasil') {
      gelembung = { teks: (s.layak ? 'layak · ' : 'sehat · ') + (s.skor === undefined ? '?' : s.skor),
                    warna: s.layak ? W.kuning : W.hijau, sampai: now + 4000 };
      L((s.situs || '').replace(/^https?:\/\//, '') + ' — skor ' + s.skor +
        (s.layak ? ' · layak dihubungi' : ' · sehat, dilewati'), s.layak ? 'peringatan' : 'sukses');
    } else if (s.keadaan === 'selesai') {
      gelembung = { teks: s.pesan || 'selesai', warna: W.hijau, sampai: now + 8000 };
      L(s.pesan || 'selesai', 'sukses');
    } else if (s.keadaan === 'mulai') {
      L('mulai memeriksa ' + (s.total || 0) + ' situs', 'kerja');
    }
  }

  /* KEHADIRAN DIBACA DARI BERKAS, BUKAN DARI API. Ini keputusan sadar,
     jangan dibalik tanpa membaca alasannya.

     Dulu halaman ini menanyakan kehadiran ke /api/agen, dan endpoint itu
     memanggil `list()` di Vercel Blob tiap kali ditanya. Paket Hobby cuma
     memberi 2.000 operasi semacam itu PER BULAN — sekitar 2,8 per jam.
     Satu tab yang dibiarkan terbuka menghabiskannya dalam dua jam.
     Store-nya benar-benar tersuspend 11 Sep 2026, dengan 7.300 dari
     2.000 terpakai.

     Melebarkan jeda tidak menyelamatkan apa pun: pada 8 detik pun
     pemakaiannya masih 160x di atas jatah. Polling berkala memang tidak
     muat di paket itu, berapa pun jedanya. Jadi fiturnya yang diubah
     bentuk, bukan angkanya yang digeser.

     Sekarang: `agenN.json` dibaca langsung.
       - dilayani server.py di komputer -> berkasnya hidup, agen duduk
       - dibuka dari Vercel             -> berkas statis, kursi kosong
     Nol operasi Blob di kedua keadaan. Kehadiran daring memang hilang,
     dan itu memang yang dipilih Porscy daripada berlangganan Pro untuk
     karakter yang duduk di kursi. */
  function ambilAgen(kunci, wadah) {
    fetch(kunci + '.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { terapkanAgen(kunci, wadah, d); })
      .catch(function () { wadah.aktif = false; });
  }

  /* Menerapkan satu kabar kehadiran ke wadahnya.

     Catatan: penanda perubahan di bawah dulu bernama `kunci` juga, jadi
     ia MENIMPA parameter `kunci` di fungsi yang sama. Selama kuncinya
     masih nomor agen hal itu tidak pernah kelihatan; begitu stasiun
     bernama ikut masuk, catatan lognya akan menyebut "true|bekerja"
     alih-alih nama penghuninya. Diganti jadi `tanda`. */
  function terapkanAgen(kunci, wadah, d) {
    if (!d) { wadah.aktif = false; return; }
    var basi = Date.now() / 1000 - (d.waktu || 0) > 300;
    var siaga = !!d.siaga;
    // Siaga adalah keadaan tetap; yang boleh basi hanya klaim "sedang bekerja".
    var aktif = !!d.aktif && (siaga || !basi);
    var tanda = aktif + '|' + siaga + '|' + (d.pesan || '');

    if (tanda !== wadah.lama) {
      // Pembacaan pertama tidak dicatat kalau memang tidak ada siapa-siapa,
      // supaya log tidak dibuka dengan "selesai" tiap halaman dimuat.
      var pertama = wadah.lama === null;
      wadah.lama = tanda;
      if (window.KANTOR.log && !(pertama && !aktif)) {
        var kabar = !aktif ? (kunci + ' meninggalkan meja')
                  : siaga  ? (kunci + ' duduk siaga')
                           : (kunci + ' mulai: ' + (d.pesan || 'bekerja'));
        window.KANTOR.log(kabar, !aktif ? 'sukses' : siaga ? 'info' : 'kerja');
      }
    }
    wadah.aktif = aktif;
    wadah.siaga = siaga;
    wadah.pesan = d.pesan || '';
  }

  function ambilAuditor() {
    fetch('auditor.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var basi = !d || (Date.now() / 1000 - (d.waktu || 0) > 120);
        var on = !!(d && d.online) && !basi;
        if (auditor.lama !== null && on !== auditor.lama && window.KANTOR.log) {
          window.KANTOR.log(on ? 'bot anggaran SEO terhubung'
                               : 'bot anggaran SEO terputus',
                            on ? 'sukses' : 'peringatan');
        }
        auditor.lama = on;
        auditor.online = on;
        auditor.pesan = (d && d.pesan) || '';
      })
      .catch(function () { auditor.online = false; });
  }

  function ambilSemuaAgen() {
    // Tab yang tidak dilihat tidak perlu ditanyakan sama sekali.
    if (document.hidden) return;
    for (var n = 1; n < AGEN.length; n++) ambilAgen('agen' + n, AGEN[n]);
    ambilAgen('blaster', blaster);
    ambilAuditor();
  }

  function ambilNawala() {
    if (document.hidden) return;
    fetch('nawala.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        nawala.aktif = !!d && Date.now() / 1000 - (d.waktu || 0) <= 1200;
        nawala.sites = d && Array.isArray(d.sites) ? d.sites : [];
      })
      .catch(function () { nawala.aktif = false; });
  }

  function ambilStatus() {
    fetch('../audit/status.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) { modeNyata = false; return; }
        if (Date.now() / 1000 - (d.waktu || 0) > 90) {
          modeNyata = false; status = { keadaan: 'diam' }; return;
        }
        modeNyata = true; status = d; tanggapi(d);
      })
      .catch(function () { modeNyata = false; });
  }

  function perbaruiPanel() {
    var el = document.getElementById('panel');
    if (!el) return;
    var k = modeNyata ? (status.keadaan || 'diam') : 'hiasan';
    var warna = { memeriksa:'#67e8f9', hasil:'#fcd34d', selesai:'#34d399',
                  jeda:'#8b98ab', mulai:'#a5b4fc', diam:'#64748b', hiasan:'#64748b' }[k] || '#64748b';
    var teks = modeNyata ? (status.pesan || '') : 'Mode hiasan — belum ada tugas yang berjalan';
    var maju = (modeNyata && status.total)
      ? '<span class="maju">' + (status.selesai || 0) + '/' + status.total + '</span>' : '';
    el.innerHTML = '<span class="titik" style="background:' + warna + '"></span>' +
                   '<b>' + (k === 'hiasan' ? 'Hiasan' : k) + '</b>' +
                   '<span class="pesan">' + teks + '</span>' + maju;
  }

  /* ---------------- gelung utama ---------------- */
  function ukur() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    /* PENYANGGA GAMBAR HARUS TETAP 1440 x 760, JANGAN DIBUAT MENGIKUTI
       LEBAR TAMPIL. Pernah dicoba demi menghilangkan keburaman teks —
       hasilnya kanvas menyusut sendiri di desktop. Sebabnya ada di CSS:
       canvas memakai `width:auto; max-width:100%`, jadi lebar tata
       letaknya diambil dari ukuran penyangga. Mengecilkan penyangga
       mengecilkan tampilannya, dan pengukuran ulang mengecilkannya lagi.

       Teks memang jadi sedikit lunak karena peramban memperkecil
       gambarnya, tapi ukuran hurufnya sudah ikut lebar layar (lihat
       targetCss), jadi tetap terbaca. Keterbacaan diurus di sana,
       bukan di sini. */
    kanvas.width = LEBAR * P * dpr;
    kanvas.height = TINGGI * P * dpr;
    kanvas.style.aspectRatio = LEBAR + ' / ' + TINGGI;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    neonSiap = null; bataPola = null;
  }

  function bingkai(t) {
    // Daftar tombol disusun ulang tiap bingkai oleh yang menggambar
    // kursinya. Jangan menambahkannya dari tempat lain.
    TOMBOL.length = 0;
    // Sama untuk antrian balon: dikosongkan di AWAL, bukan cuma sesudah
    // dituang. Kalau suatu saat ada bingkai yang keluar lebih awal,
    // balonnya tidak ikut tertinggal ke bingkai berikutnya.
    ANTRE_BALON.length = 0;
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    var ketik = modeNyata ? (status.keadaan === 'memeriksa') : (Math.sin(t / 2600) > -.35);

    gambarRuangan(t);
    gambarJendela(t);
    gambarNeon(t);
    // Jam digeser empat satuan ke kanan atas permintaan Porscy.
    gambarJam(266, 22);
    gambarRak(318, 26);
    gambarMesinCola(264, 60, t);
    gambarDispenser(72, 68, t);
    gambarPors(t);

    tentukanPapan();

    /* URUTAN KEDALAMAN, dari JAUH ke DEKAT:
         monitor  ->  meja  ->  orang  ->  kursi
       Kursi paling dekat ke kamera, monitor paling jauh. Menukar urutan
       ini sudah dua kali menghasilkan bug: meja di depan orang membuat
       orangnya tertimbun, kursi di belakang orang membuat orangnya
       tampak melayang. */
    for (var i = 0; i < MEJA_SEMUA.length; i++)
      gambarSatuMeja(MEJA_SEMUA[i], t, ketik, 'belakang');   // monitor
    for (var j = 0; j < MEJA_SEMUA.length; j++)
      gambarSatuMeja(MEJA_SEMUA[j], t, ketik, 'depan');      // badan meja

    gambarAgen1(t);
    gambarAgen2(t);
    gambarAgen3(t);
    gambarStasiun('blaster', blaster, t);
    gambarStasiun('nawala', nawala, t);
    if (auditorHadir()) {
      gambarAuditor(t);
    }

    for (var k = 0; k < MEJA_SEMUA.length; k++)
      gambarSatuMeja(MEJA_SEMUA[k], t, ketik, 'kursi');      // kursi paling depan

    gambarTanaman(340, 168, false);
    gambarSemuaStatusOnline(t);
    gambarGelembung(t);
    gambarInfoBlaster(t);
    gambarInfoNawala(t);
    gambarInfoAuditor(t);
    siramBalon();          // paling akhir: balon di atas segalanya
    perbaruiPanel();
    requestAnimationFrame(bingkai);
  }

  ukur();
  window.addEventListener('resize', ukur);
  ambilStatus(); ambilSemuaAgen(); ambilNawala();
  /* Jeda 2 detik dulu dipilih tanpa alasan; kehadiran dianggap basi
     setelah 5 MENIT, jadi menanyakannya 30x per menit tidak pernah ada
     gunanya. Itu yang membuat blob store disuspend. Jangan diturunkan. */
  setInterval(ambilStatus, 6000);
  setInterval(ambilSemuaAgen, 8000);
  setInterval(ambilNawala, 30000);
  // Begitu tab dilihat lagi, segarkan sekali supaya tidak menunggu jeda.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { ambilSemuaAgen(); ambilNawala(); }
  });
  requestAnimationFrame(bingkai);
})();
