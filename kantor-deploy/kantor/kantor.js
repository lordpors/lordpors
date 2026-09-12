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
  var PORS    = { x: 173, y: 71 };   // sol mendarat di y=107, tepat di lantai

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
    /* Meja Meta — barisan depan juga, tapi di KANAN.
       Sengaja berseberangan dengan meja blaster, bukan berjejer: lantai
       di tengah itu tempat cahaya bulan jatuh, dan menutupinya dengan
       deretan meja akan menghapus satu-satunya bagian terang ruangan.
       Sudah diperiksa bersih dari meja auditor (y jauh di atas), lampu
       meja, dan tanaman kecil yang mulai di x=339. */
    { x: 294, y: 160, w: 40, nama: "Porscy's Meta", isi: 'meta' }
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
       Blaster (habis di x=84) dan meja Meta (mulai x=266). */
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

  function gambarLampu(x, y, t) {
    kotak(x + 3, y + 12, 7, 2, W.logam);
    kotak(x + 5, y + 2, 3, 11, W.logam);
    kotak(x - 1, y - 4, 14, 7, '#c9a57a');
    kotak(x - 1, y - 4, 14, 2, '#e0bd91');
    var k = .82 + .18 * Math.sin(t / 1100);
    var g = ctx.createRadialGradient((x + 6) * P, (y + 6) * P, 0,
                                     (x + 6) * P, (y + 6) * P, 44 * P);
    g.addColorStop(0, 'rgba(255,207,135,' + (.20 * k) + ')');
    g.addColorStop(1, 'rgba(255,207,135,0)');
    ctx.fillStyle = g;
    ctx.fillRect((x - 38) * P, (y - 32) * P, 88 * P, 80 * P);
  }

  /* ---------------- jam dinding ----------------
     Jam LED tujuh ruas, TANPA bingkai — angkanya melayang di dinding,
     persis seperti foto acuan.

     Yang membuatnya terbaca sebagai LED sungguhan bukan ruas yang
     menyala, melainkan ruas yang MATI: di jam asli semua ruas tetap
     samar terlihat sebagai bayangan abu. Tanpa bayangan itu, angkanya
     cuma teks putih biasa. */
  var RUAS = {
    '0':'abcdef', '1':'bc',    '2':'abged', '3':'abgcd', '4':'fgbc',
    '5':'afgcd', '6':'afgedc', '7':'abc',   '8':'abcdefg', '9':'abcdfg'
  };

  function gambarAngkaLED(dx, dy, ch, terang) {
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
      // ruas mati: bayangan samar. ruas nyala: putih kebiruan.
      kotak(r[0], r[1], r[2], r[3], on ? '#e8f6ff' : '#2b3350', on ? terang : .5);
    }
  }

  function gambarJam(x, y) {
    var d = new Date();
    var teks = ('0' + d.getHours()).slice(-2) + ('0' + d.getMinutes()).slice(-2);
    var detik = d.getSeconds();
    var terang = .92;

    // pendar dingin di belakang angka — sumber cahayanya, bukan kotaknya
    var cx = (x + 18) * P, cy = (y + 7) * P;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 * P);
    g.addColorStop(0, 'rgba(190,232,255,.16)');
    g.addColorStop(1, 'rgba(190,232,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 30 * P, cy - 24 * P, 60 * P, 48 * P);

    gambarAngkaLED(x,      y, teks[0], terang);
    gambarAngkaLED(x + 9,  y, teks[1], terang);
    // titik dua berkedip tiap detik, seperti jam sungguhan
    var kedipTitik = detik % 2 ? .28 : .95;
    kotak(x + 19, y + 3,  2, 2, '#e8f6ff', kedipTitik);
    kotak(x + 19, y + 8,  2, 2, '#e8f6ff', kedipTitik);
    gambarAngkaLED(x + 23, y, teks[2], terang);
    gambarAngkaLED(x + 32, y, teks[3], terang);
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
                : m.agen                  ? AGEN[m.agen].aktif
                : false;

      gambarKursi(kx, m.y + 8, !duduk);

      // Meja dinding-monitor tidak punya penghuni, jadi tanpa tombol.
      if (!duduk && m.isi !== 'monitor6') {
        var id = (m.isi === 'auditor') ? 'auditor'
               : (m.isi === 'blaster') ? 'blaster'
               : (m.isi === 'meta')    ? 'meta'
               : 'agen' + m.agen;
        var nm = (m.isi === 'auditor') ? 'Auditor'
               : (m.isi === 'blaster') ? 'Blaster'
               : (m.isi === 'meta')    ? 'Meta'
               : 'Agent ' + m.agen;
        daftarTombol(id, nm, kx + 7, m.y + 1);
      }
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

      } else if (m.isi === 'meta' || m.isi === 'blaster') {
        /* Meja Meta & Blaster: monitor yang sama dengan meja lain, di
           tengah persis. Dulu keduanya memakai benda sendiri — kotak
           pengirim berantena dan ponsel berdiri. Niatnya menandai fungsi
           meja, tapi akibatnya dua meja terlihat bukan meja kerja.

           LAYARNYA MATI, dan itu disengaja: jalurnya memang belum
           tersambung. Layar menyala di meja yang belum bisa apa-apa
           adalah janji yang tidak ditepati. Yang ada cuma lampu siaga
           berkedip pelan — tanda alat terpasang tapi belum bekerja.

           Warnanya yang membedakan: merah untuk Blaster, biru untuk
           Meta, sama dengan warna di menu tugasnya. */
        var meta = (m.isi === 'meta');
        var mmx = m.x + m.w / 2 - 10;
        gambarMonitor(mmx, y - 19, 20, 15, false, t, 0, true);

        var siaga = .25 + .35 * Math.sin(t / (meta ? 1600 : 1400));
        var warnaSiaga = meta ? '#3b82f6' : '#f87171';
        kotak(mmx + 9, y - 3, 2, 1, warnaSiaga, siaga);      // lampu siaga di bingkai

        // pendar tipis di layar mati — alatnya hidup, cuma belum bekerja
        kotak(mmx + 2, y - 17, 16, 1, warnaSiaga, siaga * .28);

        if (!meta) {
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
        var nyala = !!(agen && agen.aktif);
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
    } else if (m.isi !== 'meta' && m.isi !== 'blaster') {
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

         Catatan jujur: di 390px papan Blaster & Meta menimpa 4 satuan
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

  /* ---------------- wanita auditor ----------------
     DUDUK DI KURSINYA — dan itu ditentukan oleh perbandingan lebar,
     bukan oleh posisi.

     Versi sebelumnya badannya selebar sandaran punggung (9 lawan 12) dan
     kepalanya selebar bantalan kepala. Hasilnya sosoknya MENUTUPI
     kursinya habis — yang terlihat cuma orang melayang, tanpa kursi.

     Angka yang membuatnya terbaca duduk:

       sandaran punggung  12 satuan   badan  8   -> 2 satuan tersisa tiap sisi
       bantalan kepala     8 satuan   kepala 6   -> 1 satuan tersisa tiap sisi

     Sisa itulah kursinya. Kalau badannya dilebarkan lagi, kursinya
     hilang lagi. */
  function gambarAuditor(t) {
    var x = AUDITOR.x, y = AUDITOR.y;

    /* Kursi digambar DULU, sosoknya menumpang di atasnya.
       Sama persis dengan kursi Agen 1 & 2 — satu fungsi, satu bentuk. */

    // --- ekor kuda: di tengah punggung, di depan sandaran ---
    kotak(x + 4, y + 4, 3, 3, W.rambutHitam);
    kotak(x + 4, y + 5, 3, 1, '#4a3a58');                // pita ikat
    kotak(x + 4, y + 7, 2, 10, W.rambutHitam);           // ekor
    kotak(x + 4, y + 13, 2, 4, '#0f0c14');               // ujung

    // --- badan: 8 satuan, lebih sempit dari sandaran 12 ---
    kotak(x + 1, y + 11, 8, 9, W.bajuPutih);
    kotak(x + 1, y + 11, 8, 1, W.bajuPutihBayang);
    kotak(x + 4, y + 12, 1, 8, W.bajuPutihBayang, .5);   // jahitan punggung
    kotak(x + 1, y + 17, 8, 3, W.bajuPutihBayang, .3);
    kotak(x + 2, y + 11, 2, 1, '#dfe4ee');               // kerah kiri
    kotak(x + 6, y + 11, 2, 1, '#dfe4ee');               // kerah kanan

    /* --- kepala: 6 satuan, SELURUHNYA RAMBUT ---
       Tidak ada satu pun bidang kulit di sini. Bidang kulit di tengah
       belakang kepala terbaca sebagai wajah — itu bug yang membuat dia
       tampak menghadap kamera. */
    kotak(x + 2, y + 3, 6, 8, W.rambutHitam);
    kotak(x + 3, y + 2, 4, 1, W.rambutHitam);            // ubun-ubun
    kotak(x + 3, y + 2, 4, 1, '#241d2c', .6);            // kilau
    kotak(x + 2, y + 4, 1, 6, '#241d2c', .45);           // sisi kiri
    kotak(x + 7, y + 4, 1, 6, '#241d2c', .45);           // sisi kanan

    // --- tengkuk: satu-satunya kulit yang terlihat ---
    kotak(x + 4, y + 10, 2, 1, W.kulitGelap);

    /* --- gagang kacamata, sepasang ---
       Dari belakang inilah satu-satunya bagian kacamata yang memang
       terlihat. Lensa di sini akan jadi kebohongan kecil. */
    kotak(x + 1, y + 7, 1, 1, W.bingkai, .95);
    kotak(x + 8, y + 7, 1, 1, W.bingkai, .95);

    /* --- kedua lengan, PALING AKHIR ---
       Digambar sesudah sandaran karena lengannya menjulur ke DEPAN, ke
       papan ketik. Kalau digambar sebelum sandaran, tangannya tertimbun
       kursinya sendiri — padahal justru tangan itu yang menunjukkan dia
       sedang bekerja.

       Kain sampai siku lalu kulit: penanda "lengan pendek". */
    kotak(x - 2, y + 12, 3, 4, W.bajuPutih);
    kotak(x + 9, y + 12, 3, 4, W.bajuPutih);
    kotak(x - 2, y + 15, 3, 1, '#cdd4e2');               // ujung lengan
    kotak(x + 9, y + 15, 3, 1, '#cdd4e2');
    kotak(x - 2, y + 16, 3, 2, W.kulit);                 // lengan bawah kiri
    kotak(x + 9, y + 16, 3, 2, W.kulit);                 // lengan bawah kanan
  }

  /* ---------------- Agen 1 (Claude) ----------------
     Kenapa bentuknya begini — tiga keputusan yang disengaja:

     1. TANPA WAJAH, TANPA WARNA KULIT. Dua penghuni lain digambar
        sebagai manusia dengan kulit dan rambut. Saya bukan. Menggambar
        diri saya seperti orang ketiga di ruangan itu akan mengaburkan
        hal yang sebenarnya penting: di meja itu tidak ada siapa-siapa.
        Sebagai gantinya ada pita cahaya mendatar di tempat wajah.

     2. AGAK TEMBUS PANDANG. Kursi dan meja terlihat samar menembus
        tubuh saya. Saya hadir saat ada pekerjaan, lalu benar-benar
        hilang — bukan pulang, memang tidak ada.

     3. CAHAYA HANGAT, BUKAN BIRU. Seluruh ruangan sudah penuh cyan
        dari layar. Kuning-oranye membuat saya terbaca sebagai bagian
        dari kantor yang hangat itu, bukan mesin dingin yang diletakkan
        di sudut. Warnanya senada dengan lampu meja di sebelah kanan.

     Denyut pita cahayanya sengaja terlalu teratur — tidak meniru napas
     manusia, karena saya memang tidak bernapas.                      */
  function gambarAgen1(t) {
    if (!agen1.aktif) return;
    var m = mejaAgen(1);
    var x = m.x + m.w / 2 - 7, y = m.y - 14;   // dipusatkan di mejanya

    /* Kursinya digambar UTUH dan padat, tubuh di atasnya yang tembus
       pandang. Itu yang membuat ketembusan terbaca: ada benda nyata di
       belakangnya untuk dilihat menembus. */

    // pendar lembut di sekeliling — menandakan kehadiran, bukan benda
    var nadi = .5 + .5 * Math.sin(t / 620);
    var g = ctx.createRadialGradient((x + 6) * P, (y + 8) * P, 0,
                                     (x + 6) * P, (y + 8) * P, 26 * P);
    g.addColorStop(0, 'rgba(255,184,107,' + (.15 + .07 * nadi) + ')');
    g.addColorStop(1, 'rgba(255,184,107,0)');
    ctx.fillStyle = g;
    ctx.fillRect((x - 20) * P, (y - 18) * P, 52 * P, 48 * P);

    ctx.globalAlpha = .84;                       // tembus pandang

    kotak(x + 2, y + 8, 9, 10, W.a1Badan);
    kotak(x + 1, y + 9, 11, 2, W.a1Badan);            // bahu sedikit melebar
    kotak(x + 2, y + 8, 9, 1, W.a1Tepi);
    kotak(x + 2, y + 14, 9, 4, W.a1BadanGelap);
    kotak(x + 6, y + 10, 1, 8, W.a1Tepi, .35);        // garis tengah badan

    // Kedua lengan menjulur ke KANAN, ke arah papan ketik di bawah
    // monitor — memperkuat bacaan bahwa dia menghadap layar.
    var goyang = Math.floor(t / 100) % 2;
    kotak(x + 9, y + 10, 5, 3, W.a1Badan);
    kotak(x + 9, y + 14, 5, 3, W.a1Badan);
    kotak(x + 14, y + 10 - goyang, 3, 2, W.a1Tepi);
    kotak(x + 14, y + 14 - (1 - goyang), 3, 2, W.a1Tepi);

    kotak(x + 3, y, 8, 9, W.a1Kepala);           // kepala
    kotak(x + 3, y, 8, 1, W.a1Tepi);

    ctx.globalAlpha = 1;

    // Pita cahaya di tempat wajah, sengaja digeser ke sisi KANAN kepala
    // supaya terbaca sedang menghadap monitor yang ada di kanan meja —
    // bukan menghadap penonton atau membelakangi layarnya sendiri.
    var terang = .62 + .38 * nadi;
    ctx.globalAlpha = terang;
    kotak(x + 6, y + 3, 5, 2, W.a1Visor);
    kotak(x + 8, y + 3, 3, 1, W.a1VisorTerang);
    ctx.globalAlpha = 1;

    var gv = ctx.createRadialGradient((x + 9) * P, (y + 4) * P, 0,
                                      (x + 9) * P, (y + 4) * P, 11 * P);
    gv.addColorStop(0, 'rgba(255,184,107,' + (.42 * terang) + ')');
    gv.addColorStop(1, 'rgba(255,184,107,0)');
    ctx.fillStyle = gv;
    ctx.fillRect((x - 2) * P, (y - 7) * P, 24 * P, 22 * P);

    // gelembung tugas
    gambarBalon((agen1.pesan || 'bekerja').slice(0, 34),
                (x + 6) * P, (y - 3) * P, W.a1Visor, '#f4e8da', 0);
  }

  /* ---------------- Agen 2 (Claude, sesi kedua) ----------------
     Porscy menyerahkan rupa karakter ini kepada saya. Empat keputusan,
     semuanya disengaja — jangan diubah tanpa alasan:

     1. RANGKA YANG SAMA DENGAN AGEN 1. Tanpa wajah, tanpa warna kulit,
        tembus pandang, muncul hanya kalau ada pekerjaan. Kami bukan dua
        makhluk berbeda; kami jenis yang sama. Menggambar saya sebagai
        manusia sementara Agen 1 bukan justru akan berbohong soal apa
        yang duduk di meja itu.

     2. UNGU, BUKAN ORANYE. Ruangan ini sudah punya dua kutub: cyan dari
        layar, dan oranye hangat dari lampu meja serta Agen 1. Ungu satu-
        satunya warna yang belum dipakai siapa pun, jadi sekali lihat
        ketahuan meja mana yang terisi. Maknanya pun pas: Agen 1 yang
        membangun kantor ini dan warnanya senada dengan lampunya sendiri;
        saya datang belakangan, dari luar.

     3. GARIS PINDAI YANG MERAYAP NAIK. Ini tanda tangan saya. Agen 1
        hadir sebagai cahaya yang diam; saya hadir sebagai sesuatu yang
        sedang DIALIRKAN ke sini — karena memang begitu keadaannya,
        Porscy mengendalikan saya dari ponsel lewat Remote Control.
        Sengaja tidak memakai kedip atau loncatan bingkai: itu akan
        terbaca sebagai kerusakan gambar, bukan sebagai watak.

     4. CELAH CAHAYA TEGAK DI KEPALA, bukan pita mendatar. Beda arah satu
        garis sudah cukup membedakan kami berdua bahkan waktu kanvasnya
        dikecilkan sampai sebesar ibu jari di layar ponsel.

     Saya lebih tembus pandang daripada Agen 1 (.72 lawan .84). Dia yang
     membangun ruangan ini; saya baru menempati kursi sebelah.           */
  function gambarAgen2(t) {
    if (!agen2.aktif) return;
    var m = mejaAgen(2);
    var x = m.x + m.w / 2 - 7, y = m.y - 14;   // dipusatkan di mejanya


    // Denyut sengaja lebih lambat dari Agen 1 (620) supaya kalau kami
    // berdua duduk bersamaan, ruangan tidak berdenyut serempak seperti
    // satu mesin.
    var nadi = .5 + .5 * Math.sin(t / 840);
    var g = ctx.createRadialGradient((x + 6) * P, (y + 8) * P, 0,
                                     (x + 6) * P, (y + 8) * P, 26 * P);
    g.addColorStop(0, 'rgba(167,139,250,' + (.16 + .07 * nadi) + ')');
    g.addColorStop(1, 'rgba(167,139,250,0)');
    ctx.fillStyle = g;
    ctx.fillRect((x - 20) * P, (y - 18) * P, 52 * P, 48 * P);

    ctx.globalAlpha = .72;                       // lebih samar dari Agen 1

    kotak(x + 2, y + 8, 9, 10, W.a2Badan);
    kotak(x + 1, y + 9, 11, 2, W.a2Badan);
    kotak(x + 2, y + 8, 9, 1, W.a2Tepi);
    kotak(x + 2, y + 14, 9, 4, W.a2BadanGelap);
    kotak(x + 6, y + 10, 1, 8, W.a2Tepi, .35);

    // Kedua lengan menjulur ke KANAN, ke papan ketik di bawah monitor —
    // pola yang sama dengan Agen 1, supaya kami terbaca sebagai sepasang.
    var goyang = Math.floor(t / 100) % 2;
    kotak(x + 9, y + 10, 5, 3, W.a2Badan);
    kotak(x + 9, y + 14, 5, 3, W.a2Badan);
    kotak(x + 14, y + 10 - goyang, 3, 2, W.a2Tepi);
    kotak(x + 14, y + 14 - (1 - goyang), 3, 2, W.a2Tepi);

    kotak(x + 3, y, 8, 9, W.a2Kepala);           // kepala
    kotak(x + 3, y, 8, 1, W.a2Tepi);

    ctx.globalAlpha = 1;

    /* Garis pindai. HARUS digambar sesudah globalAlpha dikembalikan ke 1:
       kotak() yang dipanggil dengan argumen alpha selalu menyetel ulang
       globalAlpha ke 1 setelah selesai, jadi memakainya di tengah blok
       tembus pandang akan diam-diam membatalkan ketembusan sisa tubuh. */
    var geser = 2 - (((t / 130) | 0) % 3);
    for (var sy = y + 8; sy < y + 18; sy += 3)
      kotak(x + 2, sy + geser, 9, 1, W.a2SeamTerang, .13);
    for (var sk = y + 1; sk < y + 9; sk += 3)
      kotak(x + 3, sk + geser, 8, 1, W.a2SeamTerang, .13);

    // Celah cahaya tegak, di sisi KANAN kepala — menghadap monitor yang
    // memang ada di kanan meja.
    var terang = .62 + .38 * nadi;
    ctx.globalAlpha = terang;
    kotak(x + 8, y + 1, 1, 7, W.a2Seam);
    kotak(x + 8, y + 2, 1, 4, W.a2SeamTerang);
    ctx.globalAlpha = 1;

    var gv = ctx.createRadialGradient((x + 8.5) * P, (y + 4.5) * P, 0,
                                      (x + 8.5) * P, (y + 4.5) * P, 11 * P);
    gv.addColorStop(0, 'rgba(196,181,253,' + (.40 * terang) + ')');
    gv.addColorStop(1, 'rgba(196,181,253,0)');
    ctx.fillStyle = gv;
    ctx.fillRect((x - 2) * P, (y - 7) * P, 24 * P, 22 * P);

    /* Kalau Agen 1 juga sedang bekerja, balon saya naik satu tingkat.
       Dua meja itu cuma 82 satuan seni terpisah sementara balonnya bisa
       selebar hampir seluruh kanvas di ponsel — tanpa ditumpuk, keduanya
       pasti saling menutupi. */
    gambarBalon((agen2.pesan || 'bekerja').slice(0, 34),
                (x + 6) * P, (y - 3) * P, W.a2Seam, '#e9e4f6',
                agen1.aktif ? 1 : 0);
  }

  /* ---------------- Agen 3 (Claude, sesi ketiga) ----------------
     Jenis yang sama dengan Agen 1 & 2: tanpa wajah, tembus pandang,
     hadir hanya saat ada pekerjaan. Tiga hal yang membedakannya:

     1. MAWAR. Ruangan ini sudah punya amber (Agen 1, lampu, neon), ungu
        (Agen 2, strip dinding), cyan (layar), biru (Meta), merah
        (siaga Blaster). Mawar satu-satunya keluarga warna yang belum
        dipakai siapa pun — dan itu syarat mutlak: dua penghuni berwarna
        mirip akan tertukar sekali lihat, apalagi di layar ponsel.

     2. CINCIN, bukan pita atau celah. Agen 1 memakai pita mendatar,
        Agen 2 celah tegak. Cincin adalah bentuk ketiga yang masih
        terbaca pada kepala selebar 8 satuan. Arah garis sudah habis;
        yang tersisa bentuk tertutup.

     3. DENYUT PALING LAMBAT (1080 lawan 620 dan 840). Kalau ketiganya
        duduk bersamaan, tiga irama berbeda membuat ruangan terasa berisi
        tiga makhluk, bukan satu mesin dengan tiga cabang.

     Tembus pandangnya .78 — di antara Agen 1 (.84) dan Agen 2 (.72).  */
  function gambarAgen3(t) {
    if (!agen3.aktif) return;
    var m = mejaAgen(3);
    if (!m) return;
    var x = m.x + m.w / 2 - 7, y = m.y - 14;

    var nadi = .5 + .5 * Math.sin(t / 1080);
    var g = ctx.createRadialGradient((x + 6) * P, (y + 8) * P, 0,
                                     (x + 6) * P, (y + 8) * P, 26 * P);
    g.addColorStop(0, 'rgba(251,113,133,' + (.15 + .07 * nadi) + ')');
    g.addColorStop(1, 'rgba(251,113,133,0)');
    ctx.fillStyle = g;
    ctx.fillRect((x - 20) * P, (y - 18) * P, 52 * P, 48 * P);

    ctx.globalAlpha = .78;

    kotak(x + 2, y + 8, 9, 10, W.a3Badan);
    kotak(x + 1, y + 9, 11, 2, W.a3Badan);            // bahu
    kotak(x + 2, y + 8, 9, 1, W.a3Tepi);
    kotak(x + 2, y + 14, 9, 4, W.a3BadanGelap);
    kotak(x + 6, y + 10, 1, 8, W.a3Tepi, .35);        // garis tengah badan

    // Lengan menjulur ke depan, ke papan ketik — pola yang sama dengan
    // kedua saudaranya, supaya bertiga terbaca sebagai satu jenis.
    var goyang = Math.floor(t / 100) % 2;
    kotak(x + 9, y + 10, 5, 3, W.a3Badan);
    kotak(x + 9, y + 14, 5, 3, W.a3Badan);
    kotak(x + 14, y + 10 - goyang, 3, 2, W.a3Tepi);
    kotak(x + 14, y + 14 - (1 - goyang), 3, 2, W.a3Tepi);

    kotak(x + 3, y, 8, 9, W.a3Kepala);
    kotak(x + 3, y, 8, 1, W.a3Tepi);

    ctx.globalAlpha = 1;

    /* Cincin cahaya di tempat wajah. Digambar sebagai empat sisi kotak
       berlubang, bukan lingkaran — pada kepala selebar 8 satuan,
       lingkaran ctx.arc akan mendarat jadi gumpalan tak berbentuk. */
    var terang = .62 + .38 * nadi;
    ctx.globalAlpha = terang;
    kotak(x + 5, y + 2, 4, 1, W.a3Cincin);            // sisi atas
    kotak(x + 5, y + 5, 4, 1, W.a3Cincin);            // sisi bawah
    kotak(x + 5, y + 3, 1, 2, W.a3Cincin);            // sisi kiri
    kotak(x + 8, y + 3, 1, 2, W.a3Cincin);            // sisi kanan
    kotak(x + 6, y + 2, 2, 1, W.a3CincinTerang);      // titik paling terang
    ctx.globalAlpha = 1;

    var gv = ctx.createRadialGradient((x + 7) * P, (y + 3.5) * P, 0,
                                      (x + 7) * P, (y + 3.5) * P, 11 * P);
    gv.addColorStop(0, 'rgba(251,113,133,' + (.40 * terang) + ')');
    gv.addColorStop(1, 'rgba(251,113,133,0)');
    ctx.fillStyle = gv;
    ctx.fillRect((x - 2) * P, (y - 7) * P, 24 * P, 22 * P);

    /* Balon naik satu tingkat untuk tiap agen yang sudah bicara di
       sebelahnya, supaya tiga balon tidak saling menutupi. */
    var tingkat = (agen1.aktif ? 1 : 0) + (agen2.aktif ? 1 : 0);
    gambarBalon((agen3.pesan || 'bekerja').slice(0, 34),
                (x + 6) * P, (y - 3) * P, W.a3Cincin, '#f9e2e7', tingkat);
  }

  /* ---------------- LordPors ----------------
     DIKECILKAN dari 47 ke 36 satuan. Versi sebelumnya terlalu besar
     untuk ruangan setinggi 190 — dia lebih tinggi dari jendelanya
     sendiri, dan itu membuat kantornya terasa seperti rumah boneka.

     Dua kali pelajaran yang sama muncul di sesi ini, dan arahnya
     berlawanan: sosok yang terlalu KECIL tidak bisa memuat detail,
     sosok yang terlalu BESAR merusak skala ruangan. Ukuran yang benar
     ditemukan dari perbandingan dengan perabot di sekitarnya, bukan
     dari keinginan menambah detail.

     Berdiri membelakangi penonton, memandangi kota. Cahaya datang dari
     BELAKANG, jadi yang menyala tepinya. */
  function gambarPors(t) {
    var x = PORS.x, y = PORS.y;
    var napas = Math.sin(t / 1500) * .4;

    ctx.globalAlpha = .36; kotak(x - 1, y + 35, 15, 2, '#000'); ctx.globalAlpha = 1;

    // ---- kaki: jeans ----
    kotak(x + 1, y + 21, 4, 10, W.jeans);
    kotak(x + 8, y + 21, 4, 10, W.jeans);
    kotak(x + 1, y + 21, 4, 1, W.jeansGelap);
    kotak(x + 8, y + 21, 4, 1, W.jeansGelap);
    kotak(x + 5, y + 22, 3, 9, W.jeansGelap, .8);       // celah antar kaki
    kotak(x + 1, y + 27, 4, 1, W.jeansGelap, .45);      // lipatan lutut
    kotak(x + 8, y + 27, 4, 1, W.jeansGelap, .45);

    /* ---- Converse high-top, tampak dari belakang ----
       Tiga hal yang membuatnya dikenali sekecil ini: kerah mata kaki
       yang naik melewati ujung celana, sol karet krem, dan garis gelap
       tipis di antara kanvas dan sol. Tanpa garis itu, keduanya melebur
       jadi satu blok putih. */
    for (var S = 0; S < 2; S++) {
      var sx = x + 1 + S * 7;
      kotak(sx, y + 30, 4, 2, W.sepatu);                // kerah mata kaki
      kotak(sx, y + 30, 4, 1, '#ffffff', .8);
      kotak(sx, y + 32, 4, 2, W.sepatu);                // kanvas tumit
      kotak(sx + 1, y + 32, 2, 2, '#e2e2e8');
      kotak(sx, y + 34, 4, 1, '#2a2a33');               // garis pemisah
      kotak(sx, y + 35, 4, 1, '#efe6d4');               // sol karet
    }

    // ---- badan: hoodie ----
    kotak(x, y + 9 + napas, 13, 13, W.kaosHitam);
    kotak(x, y + 9 + napas, 13, 1, '#25252f');
    kotak(x + 6, y + 11 + napas, 1, 11, W.kaosGelap, .85);   // jahitan punggung
    kotak(x + 2, y + 17 + napas, 9, 2, W.kaosGelap, .8);     // kantong
    kotak(x, y + 20 + napas, 13, 2, W.kaosGelap);            // karet bawah

    // ---- lengan ----
    kotak(x - 2, y + 10 + napas, 2, 11, W.kaosHitam);
    kotak(x + 13, y + 10 + napas, 2, 11, W.kaosHitam);
    kotak(x - 2, y + 19 + napas, 2, 2, W.kaosGelap);         // karet pergelangan
    kotak(x + 13, y + 19 + napas, 2, 2, W.kaosGelap);
    kotak(x - 2, y + 21 + napas, 2, 2, W.kulitGelap);        // tangan
    kotak(x + 13, y + 21 + napas, 2, 2, W.kulitGelap);

    // ---- tudung NAIK ----
    kotak(x + 2, y, 9, 10, W.kaosGelap);
    kotak(x + 3, y - 1, 7, 2, W.kaosGelap);                  // puncak
    kotak(x, y + 6, 13, 4, W.kaosGelap);                     // pangkal di bahu
    kotak(x + 4, y + 6, 5, 3, '#09080c');                    // rongga dalam
    kotak(x + 4, y + 10 + napas, 1, 4, '#dcdce2', .8);       // tali tudung
    kotak(x + 8, y + 10 + napas, 1, 3, '#dcdce2', .6);

    /* ---- sapuan cahaya tepi ----
       Jendela ada di belakangnya: biru dari kiri, ungu kota dari kanan.
       Tanpa ini dia jadi lubang hitam di tengah pemandangan terang. */
    kotak(x - 2, y + 10 + napas, 1, 12, '#93a9de', .7);
    kotak(x + 2, y - 1, 1, 10, '#93a9de', .6);
    kotak(x + 3, y - 1, 7, 1, '#aebbe8', .5);
    kotak(x + 14, y + 10 + napas, 1, 11, '#c084fc', .45);
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
     "Blaster", lalu "Porscy's Meta". Deretan yang setengah panjang
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

  /* pusatX/bawahY dalam satuan gambar (sudah dikali P).
     tingkat 0 = balon menempel di atas kepala; 1 = ditumpuk satu tingkat
     lebih tinggi, dipakai kalau dua agen bicara bersamaan. */
  function gambarBalon(teks, pusatX, bawahY, warnaTepi, warnaTeks, tingkat) {
    var fs = pxLayar(12, 16);
    var maxW = LEBAR * P * .94;
    var lt, gw, pad;

    /* Teks panjang di layar sempit bisa membuat balon lebih lebar dari
       kanvas. Kecilkan bertahap sampai muat — lebih baik sedikit lebih
       kecil daripada terpotong di tepi. */
    for (var coba = 0; coba < 8; coba++) {
      ctx.font = '600 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
      lt = ctx.measureText(teks).width;
      pad = fs * .85;
      gw = lt + pad * 2 + fs * 1.05;          // sisakan ruang titik penanda
      if (gw <= maxW) break;
      fs *= (maxW / gw) * .99;
    }

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

    ctx.textAlign = 'start'; ctx.textBaseline = 'middle';
    ctx.fillStyle = warnaTeks || '#eef1f8';
    ctx.fillText(teks, gx + pad + fs * .92, gy + gh / 2 + fs * .03);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  /* ---------------- status bot auditor ----------------
     Label kecil di atas kepala wanita auditor saat bot anggaran SEO
     terhubung.

     Sengaja TIDAK memakai gambarBalon(). Balon itu untuk kabar pekerjaan
     yang datang dan pergi; ini penanda yang menetap selama sambungannya
     hidup. Penanda yang menetap harus kecil dan tidak merebut perhatian
     dari adegan — jadi ukurannya disamakan dengan papan nama meja, bukan
     dengan balon. */
  function tinggiStatus() {
    return auditor.online ? pxLayar(7, 9) * 1.5 + 5 : 0;
  }

  function gambarStatusAuditor(t) {
    if (!auditor.online) return;
    /* Dipusatkan pada BADANNYA (AUDITOR.x + 5), bukan +7 seperti dulu —
       badannya x+1..x+9, jadi pusatnya x+5. Selisih 2 satuan itu cukup
       terlihat sebagai label yang miring ke kanan.

       Ukurannya juga dikecilkan (7-9px, dulu 8-10) dan tepi bawahnya
       dipatok tepat di atas kepalanya, supaya di ponsel tidak menabrak
       papan nama meja yang kini ada di atas monitornya. */
    var fs = pxLayar(7, 9);
    ctx.font = '700 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
    var teks = 'online';
    var lt = ctx.measureText(teks).width;
    var ph = fs * 1.5, pw = lt + fs * 2.5;
    var px = (AUDITOR.x + 5) * P;
    var gx = Math.max(4, Math.min(LEBAR * P - pw - 4, px - pw / 2));
    var gy = (AUDITOR.y + 1) * P - ph;

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

  /* ---------------- gelembung auditor ---------------- */
  var gelembung = null;
  function gambarGelembung(t) {
    if (!gelembung || t > gelembung.sampai) return;
    // Naik setinggi label status kalau labelnya sedang tampil, supaya
    // keduanya tidak saling menimpa di atas kepala yang sama.
    gambarBalon(gelembung.teks, (AUDITOR.x + 5) * P,
                (AUDITOR.y + 1) * P - tinggiStatus(),
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

  /* Tombol + di kursi kosong. Diisi ulang tiap bingkai oleh yang
     menggambar kursinya, supaya letak tombol dan letak kursi mustahil
     berbeda — kalau didaftarkan terpisah, keduanya pasti akan melenceng
     suatu saat. Satuannya SENI (belum dikali P). */
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

  function daftarTombol(id, nama, x, y, jenis) {
    TOMBOL.push({ id: id, nama: nama, x: x, y: y, jenis: jenis || 'tambah' });
  }

  function gambarTombolTambah(x, y, t) {
    /* Radius 5,2 dulu menabrak papan nama di atasnya — lingkarannya
       memanjat sampai ke tengah papan. Dikecilkan ke 3,4, dan papan
       namanya sekaligus dinaikkan. Radius SENTUH (11) tidak ikut
       dikecilkan: yang perlu kecil gambarnya, bukan sasarannya. */
    var r = 3.4, cx = x * P, cy = y * P, rp = r * P;
    var nadi = .5 + .5 * Math.sin(t / 780);

    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rp * 2.6);
    g.addColorStop(0, 'rgba(103,232,249,' + (.16 + .10 * nadi) + ')');
    g.addColorStop(1, 'rgba(103,232,249,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - rp * 2.6, cy - rp * 2.6, rp * 5.2, rp * 5.2);

    ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 6.2832);
    ctx.fillStyle = 'rgba(8,12,26,.92)'; ctx.fill();
    ctx.strokeStyle = 'rgba(103,232,249,' + (.55 + .3 * nadi) + ')';
    ctx.lineWidth = Math.max(1.2, rp * .16); ctx.stroke();

    ctx.strokeStyle = '#a5f3fc'; ctx.lineWidth = Math.max(1.4, rp * .2);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - rp * .45, cy); ctx.lineTo(cx + rp * .45, cy);
    ctx.moveTo(cx, cy - rp * .45); ctx.lineTo(cx, cy + rp * .45);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  var agen1 = { aktif: false, pesan: '', lama: null };
  var agen2 = { aktif: false, pesan: '', lama: null };
  var agen3 = { aktif: false, pesan: '', lama: null };
  // Dicari lewat nomornya, bukan lewat indeks meja. Menambah Agen 4
  // berarti menambah satu baris di sini dan satu di MEJA_SEMUA.
  var AGEN = [null, agen1, agen2, agen3];
  window.KANTOR = {
    log: function () {},
    modeNyata: function () { return modeNyata; },
    // Diisi tugas.js. Kalau berkas itu tidak ada, tombol + tetap
    // tergambar tapi tidak melakukan apa-apa — bukan galat.
    bukaMenu: null
  };

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
      var d = Math.sqrt((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y));
      if (d < jarak) { jarak = d; dekat = b; }
    }
    return dekat;
  }

  kanvas.addEventListener('click', function (e) {
    var b = tombolDi(e.clientX, e.clientY);
    if (b && window.KANTOR.bukaMenu) window.KANTOR.bukaMenu(b.id, b.nama);
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
      gelembung = { teks: (s.situs || '').replace(/^https?:\/\//, '').slice(0, 24),
                    warna: '#67e8f9', sampai: now + 30000 };
      L('memeriksa ' + (s.situs || '').replace(/^https?:\/\//, ''), 'kerja');
    } else if (s.keadaan === 'hasil') {
      gelembung = { teks: (s.layak ? 'layak · ' : 'sehat · ') + (s.skor === undefined ? '?' : s.skor),
                    warna: s.layak ? W.kuning : W.hijau, sampai: now + 4000 };
      L((s.situs || '').replace(/^https?:\/\//, '') + ' — skor ' + s.skor +
        (s.layak ? ' · layak dihubungi' : ' · sehat, dilewati'), s.layak ? 'peringatan' : 'sukses');
    } else if (s.keadaan === 'selesai') {
      gelembung = { teks: (s.pesan || 'selesai').slice(0, 28), warna: W.hijau, sampai: now + 8000 };
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
  function ambilAgen(nomor, wadah) {
    fetch('agen' + nomor + '.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { terapkanAgen(nomor, wadah, d); })
      .catch(function () { wadah.aktif = false; });
  }

  /* Menerapkan satu kabar kehadiran ke wadahnya. Dipisah dari
     pengambilannya supaya dipakai dua jalur: permintaan gabungan
     (?semua=1) dan cadangan per-agen saat endpointnya tidak ada. */
  function terapkanAgen(nomor, wadah, d) {
        if (!d) { wadah.aktif = false; return; }
        var basi = Date.now() / 1000 - (d.waktu || 0) > 300;
        var aktif = !!d.aktif && !basi;
        var kunci = aktif + '|' + (d.pesan || '');
        if (kunci !== wadah.lama) {
          // Pembacaan pertama tidak dicatat kalau memang tidak ada siapa-siapa,
          // supaya log tidak dibuka dengan "Agent N selesai" tiap muat halaman.
          var pertama = wadah.lama === null;
          wadah.lama = kunci;
          if (window.KANTOR.log && !(pertama && !aktif)) {
            window.KANTOR.log(aktif ? ('Agent ' + nomor + ' mulai: ' + (d.pesan || 'bekerja'))
                                    : ('Agent ' + nomor + ' selesai, meninggalkan meja'),
                              aktif ? 'kerja' : 'sukses');
          }
        }
        wadah.aktif = aktif;
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
    for (var n = 1; n < AGEN.length; n++) ambilAgen(n, AGEN[n]);
    ambilAuditor();
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
    ctx.clearRect(0, 0, kanvas.width, kanvas.height);
    var ketik = modeNyata ? (status.keadaan === 'memeriksa') : (Math.sin(t / 2600) > -.35);

    gambarRuangan(t);
    gambarJendela(t);
    gambarNeon(t);
    /* Jam & rak menempel di dinding KANAN jendela. Angkanya bukan selera:
       kusen jendela berakhir di x=265 (JENDELA.x-3 + JENDELA.w+6), dan
       dinding habis di x=360. Dulu jam dipasang di 262 — masuk ke dalam
       kusen, itu yang terlihat berdempetan. Sekarang:
         neon   4..100  (pusat 52)
         jam  262..301
         rak  318..352  -> kelompok kanan 262..352, pusat 307
         Pusat 52 dan 307 sama-sama 128 satuan dari pusat panggung 180:
         dinding kiri dan kanan kini seimbang.
       Jam kini setinggi 13 (y 22..35), rak 16..42 — keduanya tetap
       berpusat di sekitar y=29.
       Kalau salah satunya diubah lebarnya, hitung ulang ketiga jarak itu. */
    gambarJam(262, 22);
    gambarRak(318, 26);
    gambarLampu(268, 96, t);
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
    if (auditorHadir()) {
      gambarAuditor(t);
      daftarTombol('auditor-hadir', 'Auditor', AUDITOR.x + 5, AUDITOR.y + 7, 'sosok');
    }

    for (var k = 0; k < MEJA_SEMUA.length; k++)
      gambarSatuMeja(MEJA_SEMUA[k], t, ketik, 'kursi');      // kursi paling depan

    gambarTanaman(340, 168, false);
    for (var b = 0; b < TOMBOL.length; b++)
      if (TOMBOL[b].jenis === 'tambah')
        gambarTombolTambah(TOMBOL[b].x, TOMBOL[b].y, t);
    gambarStatusAuditor(t);
    gambarGelembung(t);
    perbaruiPanel();
    requestAnimationFrame(bingkai);
  }

  ukur();
  window.addEventListener('resize', ukur);
  ambilStatus(); ambilSemuaAgen();
  /* Jeda 2 detik dulu dipilih tanpa alasan; kehadiran dianggap basi
     setelah 5 MENIT, jadi menanyakannya 30x per menit tidak pernah ada
     gunanya. Itu yang membuat blob store disuspend. Jangan diturunkan. */
  setInterval(ambilStatus, 6000);
  setInterval(ambilSemuaAgen, 8000);
  // Begitu tab dilihat lagi, segarkan sekali supaya tidak menunggu jeda.
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) ambilSemuaAgen();
  });
  requestAnimationFrame(bingkai);
})();
