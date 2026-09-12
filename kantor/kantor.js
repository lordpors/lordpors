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
    neonUngu:'#c026d3', neonSian:'#22d3ee',
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
    a2Seam:'#c4b5fd', a2SeamTerang:'#ece7ff', a2Tepi:'#7c6bb8'
  };

  function kotak(x, y, w, h, warna, a) {
    if (a !== undefined) ctx.globalAlpha = a;
    ctx.fillStyle = warna;
    ctx.fillRect(x * P, y * P, w * P, h * P);
    if (a !== undefined) ctx.globalAlpha = 1;
  }

  /* ---------------- tata letak ---------------- */
  var JENDELA = { x: 112, y: 12, w: 150, h: 88 };
  var NEON    = { x: 8,   y: 14, w: 104, h: 54 };
  var PORS    = { x: 180, y: 78 };

  var MEJA_H = 16;
  var MEJA_SEMUA = [
    { x: 14,  y: 116, w: 78, nama: null,               isi: 'monitor6' },
    { x: 108, y: 138, w: 68, nama: "Porscy's Agent 1", isi: false },
    { x: 190, y: 138, w: 68, nama: "Porscy's Agent 2", isi: false },
    { x: 268, y: 114, w: 82, nama: null,               isi: 'auditor' },
    /* Meja blaster — barisan DEPAN, sengaja di kiri.
       Di sana lantainya kosong: dinding monitor berakhir di y=132 dan
       tanaman besar baru mulai di x=91, jadi meja ini punya ruangnya
       sendiri tanpa menimpa meja mana pun. Ditaruh paling akhir supaya
       digambar paling atas — benda yang lebih dekat menutupi yang jauh. */
    { x: 20,  y: 160, w: 64, nama: "Porscy's Blaster", isi: 'blaster' },
    /* Meja Meta — barisan depan juga, tapi di KANAN.
       Sengaja berseberangan dengan meja blaster, bukan berjejer: lantai
       di tengah itu tempat cahaya bulan jatuh, dan menutupinya dengan
       deretan meja akan menghapus satu-satunya bagian terang ruangan.
       Sudah diperiksa bersih dari meja auditor (y jauh di atas), lampu
       meja, dan tanaman kecil yang mulai di x=339. */
    { x: 266, y: 160, w: 64, nama: "Porscy's Meta", isi: 'meta' }
  ];
  // Duduk di sisi kiri meja; monitornya digeser ke kanan supaya
  // dia tidak tertutup layarnya sendiri.
  var AUDITOR = { x: 272, y: 96 };

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
      document.fonts.load('italic 600 28px "Cinzel"')
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

    /* Tiga lapis untuk tiap tulisan: pendar luar yang lebar, pendar
       dalam yang rapat, lalu inti hampir putih. Itu yang membuat tabung
       neon terasa berisi cahaya, bukan sekadar teks berwarna. */
    function tulis(teks, y, warna, font, spasi) {
      c.font = font;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (c.letterSpacing !== undefined) c.letterSpacing = spasi || '0px';
      c.shadowColor = warna;
      c.shadowBlur = 34; c.fillStyle = warna; c.fillText(teks, w / 2, y);
      c.shadowBlur = 20; c.fillText(teks, w / 2, y);
      c.shadowBlur = 10; c.fillText(teks, w / 2, y);
      c.shadowBlur = 4;  c.fillStyle = '#fffdf6'; c.fillText(teks, w / 2, y);
      c.shadowBlur = 0;
      if (c.letterSpacing !== undefined) c.letterSpacing = '0px';
    }

    // Garis tipis di atas & bawah tulisan atas — kesan panel futuristik.
    function garis(y, lebar, warna) {
      c.strokeStyle = warna; c.lineWidth = 1.5;
      c.shadowColor = warna; c.shadowBlur = 10;
      c.beginPath();
      c.moveTo((w - lebar) / 2, y); c.lineTo((w + lebar) / 2, y);
      c.stroke();
      c.shadowBlur = 0;
    }

    // LORDPORS — Orbitron, huruf besar, berjarak lebar
    garis(h * .10, w * .76, W.neonKuning);
    tulis('LORDPORS', h * .30, W.neonKuning,
          '900 40px "Orbitron", ui-monospace, monospace', '7px');
    garis(h * .50, w * .76, W.neonKuning);

    // memento vivere — Cinzel miring, terasa seperti pahatan Latin
    tulis('memento vivere', h * .76, W.neonBiru,
          'italic 600 28px "Cinzel", Georgia, serif', '3px');

    neonSiap = k;
  }

  function gambarNeon(t) {
    if (!fontSiap) return;            // tunggu font, jangan render separuh jadi
    if (!neonSiap) siapkanNeon();
    var dasar = .88 + .08 * Math.sin(t / 950);
    var sendat = (Math.sin(t / 143) > .986) ? .5 : 1;
    ctx.globalAlpha = dasar * sendat;
    ctx.drawImage(neonSiap, NEON.x * P, NEON.y * P);
    ctx.globalAlpha = 1;

    var cx = (NEON.x + NEON.w / 2) * P, cy = (NEON.y + NEON.h / 2) * P;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, NEON.w * P * .85);
    g.addColorStop(0, 'rgba(255,217,61,.13)');
    g.addColorStop(.5, 'rgba(77,184,255,.07)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = dasar * sendat; ctx.fillStyle = g;
    ctx.fillRect(cx - NEON.w * P, cy - NEON.h * P, NEON.w * 2 * P, NEON.h * 2.4 * P);
    ctx.globalAlpha = 1;
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

    for (var L = 0; L < 4; L++) gambarLampuGantung([52, 146, 216, 300][L], t, L);

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
    kotak(118, 172, 128, 18, W.permadaniTepi);
    kotak(120, 174, 124, 14, W.permadani);
    kotak(124, 176, 116, 1, '#33427a', .7);
  }

  /* ---------------- perabot & pernak-pernik ---------------- */
  function gambarTanaman(x, y, besar) {
    var s = besar ? 1.4 : 1;
    kotak(x, y, 11 * s, 9 * s, W.pot);
    kotak(x, y, 11 * s, 2, W.potGelap);
    kotak(x + 2 * s, y - 9 * s, 7 * s, 9 * s, W.daun);
    kotak(x - 1, y - 5 * s, 3 * s, 6 * s, W.daunTua);
    kotak(x + 8 * s, y - 7 * s, 3 * s, 7 * s, W.daunTua);
    kotak(x + 4 * s, y - 13 * s, 3 * s, 5 * s, W.daun);
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

  function gambarJam(x, y) {
    kotak(x, y, 38, 18, '#12141f');
    kotak(x + 1, y + 1, 36, 16, '#0a0c14');
    var d = new Date();
    var jam = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    ctx.font = '700 20px "Orbitron",ui-monospace,monospace';
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 14;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(jam, (x + 19) * P, (y + 9.5) * P);
    ctx.shadowBlur = 0; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  function gambarKopi(x, y) {
    kotak(x, y, 6, 6, '#e8e8ee');
    kotak(x + 6, y + 1, 2, 3, '#e8e8ee');
    kotak(x + 1, y + 1, 4, 1, '#6b4530');
  }

  /* ---------------- meja ---------------- */
  function gambarMonitor(mx, my, lb, tg, hidup, t, seed) {
    kotak(mx - 1, my - 1, lb + 2, tg + 2, W.layarBingkai);
    kotak(mx, my, lb, tg, hidup ? '#0d1a2e' : W.layarMati);
    if (hidup) {
      var warna = [W.kodeHijau, W.kodeBiru, W.kodeUngu, W.kodeKuning];
      for (var i = 0; i * 3 + 2 < tg; i++) {
        var w2 = 2 + ((Math.sin(t / 260 + i * 1.4 + seed) * .5 + .5) * (lb - 4)) | 0;
        ctx.globalAlpha = .5 + .35 * Math.sin(t / 400 + i + seed);
        kotak(mx + 2, my + 2 + i * 3, w2, 1, warna[(i + seed) % 4]);
      }
      ctx.globalAlpha = 1;
    } else {
      kotak(mx + 1, my + 1, lb - 2, 2, '#1a1e2c', .8);
    }
  }

  function gambarKursi(x, y, kosong) {
    kotak(x + 1, y - 10, 12, 10, W.kursi);
    kotak(x + 1, y - 10, 12, 1, W.kursiTerang);
    kotak(x, y, 14, 3, W.kursiTerang);
    kotak(x + 6, y + 3, 2, 5, '#241f33');
    kotak(x + 1, y + 8, 12, 2, '#241f33');
  }

  function gambarSatuMeja(m, t, ketik) {
    var y = m.y;
    kotak(m.x, y + MEJA_H - 3, m.w, 3, W.mejaKaki);
    kotak(m.x, y, m.w, MEJA_H - 3, W.meja);
    kotak(m.x, y, m.w, 2, W.mejaAtas);
    kotak(m.x, y, m.w, 1, W.mejaGaris, .75);          // urat kayu tepi atas
    // Garis lampu kuning tipis di bawah tutup meja. Di referensi inilah
    // yang membuat deretan meja terbaca di ruangan yang gelap.
    kotak(m.x + 2, y + MEJA_H - 5, m.w - 4, 1, W.mejaLampu, .55);

    if (m.isi === 'monitor6') {
      // dinding monitor: dua baris tiga layar
      for (var r = 0; r < 2; r++)
        for (var c = 0; c < 3; c++)
          gambarMonitor(m.x + 4 + c * 25, y - 38 + r * 20, 22, 17, true, t, r * 3 + c);
      kotak(m.x + 18, y + 3, 40, 5, '#2a2f44');            // papan ketik RGB
      for (var i = 0; i < 10; i++)
        kotak(m.x + 20 + i * 4, y + 4, 3, 3,
              ['#f87171','#fbbf24','#4ade80','#22d3ee','#a78bfa'][i % 5], .85);
      kotak(m.x + 62, y + 4, 5, 4, '#2a2f44');            // tetikus
      gambarKursi(m.x + 30, y + MEJA_H + 2);
      gambarKopi(m.x + 6, y + 3);
    } else if (m.isi === 'auditor') {
      gambarMonitor(m.x + 24, y - 25, 30, 22, ketik, t, 1);
      gambarMonitor(m.x + 57, y - 21, 23, 18, ketik, t, 2);
      kotak(m.x + 4, y + 3, 24, 4, '#2a2f44');      // papan ketik
      kotak(m.x + 30, y + 4, 5, 3, '#2a2f44');      // tetikus
      gambarKopi(m.x + 72, y + 2);
    } else if (m.isi === 'meta') {
      /* Masih kosong — menunggu jalur WhatsApp/Instagram disiapkan.

         Bentuknya ponsel berdiri, bukan monitor: yang dikerjakan di meja
         ini nanti percakapan di aplikasi orang, bukan pekerjaan layar
         besar. Birunya sengaja beda dari merah antena blaster, supaya
         dua meja depan ini tidak tertukar sekali lihat.

         Denyutnya lambat dan redup karena belum ada yang berjalan. */
      var hp = m.x + m.w / 2 - 4;
      kotak(hp, y - 12, 8, 12, '#2a2f44');                 // badan ponsel
      kotak(hp + 1, y - 11, 6, 9, '#1b2438');              // layar, mati
      kotak(hp + 1, y - 11, 6, 2, '#3b82f6', .32);         // pita kepala
      var denyut = .16 + .22 * Math.sin(t / 1600);
      kotak(hp + 1, y - 18, 6, 4, '#3b82f6', denyut);      // gelembung pesan
      kotak(hp + 2, y - 14, 2, 2, '#3b82f6', denyut);      // ekor gelembungnya
      gambarKursi(m.x + m.w / 2 - 7, y + MEJA_H + 2, true);
      daftarTombol('meta', 'Meta', m.x + m.w / 2, y + MEJA_H - 3);

    } else if (m.isi === 'blaster') {
      /* Masih kosong — menunggu blast pertama dinyalakan.

         Sengaja TANPA monitor tinggi. Meja ini di barisan depan, dan
         layar setinggi milik meja agen akan menjulur ke atas menutupi
         meja di belakangnya. Yang ada cuma kotak pengirim beserta
         antenanya, supaya sekali lihat ketahuan meja ini untuk apa. */
      var bx = m.x + m.w / 2 - 9;
      kotak(bx, y - 8, 18, 8, '#2a2f44');              // kotak pengirim
      kotak(bx, y - 8, 18, 1, '#3f4760');
      kotak(bx + 8, y - 5, 8, 1, '#1b2030');
      kotak(bx + 2, y - 5, 4, 2, '#67e8f9', .45);      // lampu siaga, redup
      kotak(bx + 15, y - 16, 1, 8, W.logam);           // antena
      // Kedipnya lambat dan redup: belum ada yang dikirim. Kalau nanti
      // blaster benar-benar jalan, di sinilah tempat mempercepatnya.
      kotak(bx + 14, y - 18, 3, 2, '#f87171', .2 + .3 * Math.sin(t / 1400));
      gambarKursi(m.x + m.w / 2 - 7, y + MEJA_H + 2, true);
      daftarTombol('blaster', 'Blaster', m.x + m.w / 2, y + MEJA_H - 3);

    } else {
      /* Meja agen menyala kalau penghuninya sedang bekerja. `isi` tetap
         false di MEJA_SEMUA — kolom itu memilih BENTUK meja (dinding
         monitor / meja auditor / meja polos), bukan siapa yang duduk.
         Kehadiran ditentukan di sini, dari agen1.json & agen2.json. */
      var agen = (m === MEJA_SEMUA[1]) ? agen1 : (m === MEJA_SEMUA[2]) ? agen2 : null;
      var nyala = !!(agen && agen.aktif);
      // Kalau agennya ada, monitornya digeser ke KANAN meja supaya dia
      // bisa duduk di kiri sambil menghadapnya. Waktu meja kosong,
      // monitornya kembali ke tengah agar terlihat rapi.
      var mxm = nyala ? (m.x + m.w - 32) : (m.x + m.w / 2 - 13);
      gambarMonitor(mxm, y - 22, 26, 19, nyala, t, m === MEJA_SEMUA[2] ? 4 : 3);
      kotak(mxm + 1, y + 3, 24, 4, '#252a3c');
      if (!nyala) {
        gambarKursi(m.x + m.w / 2 - 7, y + MEJA_H + 2, true);
        daftarTombol(m === MEJA_SEMUA[1] ? 'agen1' : 'agen2',
                     m === MEJA_SEMUA[1] ? 'Agent 1' : 'Agent 2',
                     m.x + m.w / 2, y + MEJA_H - 3);
      }
    }

    if (m.nama) {
      /* Papan nama kena penyakit yang sama dengan balon teks: angka px
         tetap di ruang gambar yang ikut diperkecil CSS. Lihat catatan
         panjang di atas pxLayar(). Di sini targetnya 11px — sedikit di
         bawah balon teks, karena papan nama keterangan, bukan kabar.

         Batasnya LEBAR MEJA ITU SENDIRI, bukan jarak antar meja. Dulu
         dipatok 78 satuan seni — lebih lebar dari mejanya (68), jadi di
         ponsel papannya menjorok keluar dan menutupi monitor di atas
         meja. Papan nama tidak boleh lebih lebar dari meja yang ia beri
         nama. Kalau tidak muat: "Porscy's" dibuang dulu, baru hurufnya
         dikecilkan. */
      var MAKS = m.w * P;
      var fs = pxLayar(8, 10);
      // Bentuk pendek/panjangnya sudah diputuskan tentukanPapan() untuk
      // seluruh ruangan; di sini tinggal mengecilkan kalau masih meleset.
      var nama = papanPendek ? m.nama.replace(/^.*?'s\s*/, '') : m.nama, lt;
      for (var coba = 0; coba < 8; coba++) {
        ctx.font = '700 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
        lt = ctx.measureText(nama).width;
        if (lt + fs * 1.25 <= MAKS) break;
        fs *= (MAKS / (lt + fs * 1.25)) * .99;
      }

      var px = (m.x + m.w / 2) * P, py = (y + 8) * P;
      var pw = lt + fs * 1.25, ph = fs * 1.45;
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

  /* ---------------- wanita auditor ---------------- */
  function gambarAuditor(t, ketik) {
    var x = AUDITOR.x, y = AUDITOR.y;
    kotak(x - 2, y + 4, 15, 15, W.kursi);
    kotak(x - 2, y + 4, 15, 1, W.kursiTerang);
    kotak(x - 1, y + 1, 13, 17, W.rambutHitam);          // rambut panjang
    kotak(x + 2, y + 8, 9, 10, W.bajuPutih);
    kotak(x + 2, y + 8, 9, 1, W.bajuPutihBayang);

    var goyang = ketik ? (Math.floor(t / 110) % 2) : 0;
    kotak(x, y + 11, 3, 6, W.bajuPutih);
    kotak(x + 10, y + 11, 3, 6, W.bajuPutih);
    kotak(x, y + 17 - goyang, 3, 2, W.kulit);
    kotak(x + 10, y + 17 - (1 - goyang), 3, 2, W.kulit);

    kotak(x + 3, y, 8, 9, W.kulit);                       // kepala
    kotak(x + 3, y - 1, 8, 3, W.rambutHitam);
    kotak(x + 2, y, 1, 10, W.rambutHitam);
    kotak(x + 11, y, 1, 10, W.rambutHitam);
    kotak(x + 12, y + 3, 2, 8, W.rambutHitam);            // kuncir

    kotak(x + 4, y + 3, 2, 2, W.kaca, .92);               // kacamata
    kotak(x + 7, y + 3, 2, 2, W.kaca, .92);
    kotak(x + 6, y + 3, 1, 1, W.bingkai);
    kotak(x + 3, y + 3, 1, 1, W.bingkai);
    kotak(x + 9, y + 3, 1, 1, W.bingkai);
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
    var m = MEJA_SEMUA[1];
    var x = m.x + 8, y = m.y - 18;

    // kursi digambar utuh; tubuh di atasnya nanti tembus pandang
    kotak(x - 2, y + 4, 15, 15, W.kursi);
    kotak(x - 2, y + 4, 15, 1, W.kursiTerang);

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
    kotak(x + 2, y + 8, 9, 1, W.a1Tepi);
    kotak(x + 2, y + 14, 9, 4, W.a1BadanGelap);

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
    var m = MEJA_SEMUA[2];
    var x = m.x + 8, y = m.y - 18;

    // kursi digambar utuh; tubuh di atasnya nanti tembus pandang
    kotak(x - 2, y + 4, 15, 15, W.kursi);
    kotak(x - 2, y + 4, 15, 1, W.kursiTerang);

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
    kotak(x + 2, y + 8, 9, 1, W.a2Tepi);
    kotak(x + 2, y + 14, 9, 4, W.a2BadanGelap);

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

  /* ---------------- LordPors ---------------- */
  function gambarPors(t) {
    var x = PORS.x, y = PORS.y;
    var napas = Math.sin(t / 1500) * .4;

    ctx.globalAlpha = .3; kotak(x - 1, y + 27, 13, 2, '#000'); ctx.globalAlpha = 1;

    kotak(x + 1, y + 18, 4, 9, W.jeans);
    kotak(x + 7, y + 18, 4, 9, W.jeans);
    kotak(x + 1, y + 18, 4, 1, W.jeansGelap);
    kotak(x + 7, y + 18, 4, 1, W.jeansGelap);
    kotak(x + 1, y + 27, 4, 2, W.sepatu);                 // sepatu putih
    kotak(x + 7, y + 27, 4, 2, W.sepatu);

    kotak(x, y + 7 + napas, 12, 11, W.kaosHitam);
    kotak(x, y + 7 + napas, 12, 1, '#21212b');
    kotak(x + 5, y + 8 + napas, 1, 10, W.kaosGelap);
    kotak(x + 2, y + 5 + napas, 8, 3, W.kaosGelap);       // tudung hoodie

    kotak(x - 2, y + 8 + napas, 2, 9, W.kaosHitam);
    kotak(x + 12, y + 8 + napas, 2, 9, W.kaosHitam);
    kotak(x - 2, y + 17 + napas, 2, 2, W.kulitGelap);
    kotak(x + 12, y + 17 + napas, 2, 2, W.kulitGelap);

    kotak(x + 3, y, 7, 8, W.rambutHitam);                 // kepala dari belakang
    kotak(x + 3, y - 1, 7, 3, '#1d1721');
    kotak(x + 4, y + 6, 5, 2, W.kulitGelap);              // tengkuk
    kotak(x + 2, y + 1, 1, 5, W.rambutHitam);
    kotak(x + 10, y + 1, 1, 5, W.rambutHitam);

    kotak(x - 2, y + 8 + napas, 1, 10, '#7d8db5', .55);   // sapuan cahaya
    kotak(x + 2, y - 1, 1, 8, '#7d8db5', .45);
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
    return auditor.online ? pxLayar(8, 10) * 1.7 + 5 : 0;
  }

  function gambarStatusAuditor(t) {
    if (!auditor.online) return;
    var fs = pxLayar(8, 10);
    ctx.font = '700 ' + fs.toFixed(1) + 'px "Poppins",ui-monospace,monospace';
    var teks = 'online';
    var lt = ctx.measureText(teks).width;
    var ph = fs * 1.7, pw = lt + fs * 2.5;
    var px = (AUDITOR.x + 7) * P;
    var gx = Math.max(4, Math.min(LEBAR * P - pw - 4, px - pw / 2));
    var gy = (AUDITOR.y - 2) * P - ph;

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
    gambarBalon(gelembung.teks, (AUDITOR.x + 6) * P,
                (AUDITOR.y - 3) * P - tinggiStatus(),
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
  function daftarTombol(id, nama, x, y, jenis) {
    TOMBOL.push({ id: id, nama: nama, x: x, y: y, jenis: jenis || 'tambah' });
  }

  function gambarTombolTambah(x, y, t) {
    var r = 5.2, cx = x * P, cy = y * P, rp = r * P;
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
    ambilAgen(1, agen1);
    ambilAgen(2, agen2);
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
         jam  272..310  (jarak 7 dari kusen)
         rak  318..352  (jarak 8 dari jam, sisa 8 ke tepi kanan)
       Keduanya dipusatkan di y=29 supaya sejajar: jam 20..38, rak 16..42.
       Kalau salah satunya diubah lebarnya, hitung ulang ketiga jarak itu. */
    gambarJam(272, 20);
    gambarRak(318, 26);
    gambarLampu(254, 96, t);
    gambarPors(t);
    if (auditorHadir()) {
      gambarAuditor(t, ketik);
      daftarTombol('auditor-hadir', 'Auditor', AUDITOR.x + 7, AUDITOR.y + 4, 'sosok');
    } else {
      // Kursi kosong di tempat dia biasa duduk, bukan kursi yang hilang.
      // Meja yang kehilangan kursinya terbaca seperti meja yang dibongkar.
      gambarKursi(AUDITOR.x, AUDITOR.y + 9, true);
      daftarTombol('auditor', 'Auditor', AUDITOR.x + 7, AUDITOR.y + 3);
    }
    gambarAgen1(t);
    gambarAgen2(t);
    tentukanPapan();
    for (var i = 0; i < MEJA_SEMUA.length; i++) gambarSatuMeja(MEJA_SEMUA[i], t, ketik);
    gambarTanaman(92, 162, true);
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
