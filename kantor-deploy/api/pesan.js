/**
 * Kotak masuk & balasan kantor daring.
 * ------------------------------------
 * KENAPA SATU BLOB PER PESAN, BUKAN SATU BERKAS YANG DITAMBAHI
 *
 * Versi pertama menyimpan semuanya di satu kotak-masuk.jsonl dan tiap
 * pesan baru berarti: baca seluruh isi, tambahkan satu baris, tulis ulang.
 * Terbukti salah saat diuji -- dua kiriman berurutan sama-sama menjawab
 * "jumlah: 1", karena yang kedua membaca keadaan sebelum yang pertama
 * selesai tersimpan, lalu menimpanya. Pesan pertama hilang tanpa jejak.
 *
 * Sekarang tiap pesan jadi blobnya sendiri, dinamai menurut waktu kirim.
 * Tidak ada yang dibaca sebelum menulis, jadi tidak ada yang bisa saling
 * menimpa, berapa pun cepatnya orang mengetik.
 *
 * ALAMAT TUJUAN ADA DI NAMA BLOB, bukan cuma di dalam isinya:
 *
 *     pesan/agen2--<cap waktu>-<acak>.json     surat untuk Agent 2
 *     balas/agen2--<cap waktu>-<acak>.json     jawaban dari Agent 2
 *
 * Membaca laci Agent 2 jadi tidak perlu mengunduh dulu surat Agent 1
 * untuk tahu itu bukan miliknya, dan mengosongkan satu laci mustahil
 * tersenggol menghapus laci sebelah.
 *
 * KENAPA MENGIRIM SEKARANG BERKUNCI
 *
 * Dulu POST sengaja dibiarkan terbuka: "ini kotak surat, siapa pun yang
 * punya alamat boleh memasukkan surat." Itu aman selama ada manusia yang
 * membacanya lebih dulu. Begitu ada penjaga yang MENJALANKAN isi surat
 * secara otomatis, kotak surat terbuka berubah jadi terminal jarak jauh
 * tanpa kunci: siapa pun yang menemukan alamatnya bisa menyuruh komputer
 * Porscy melakukan sesuatu. Maka mengirim kini butuh KANTOR_KIRIM_KUNCI.
 *
 * Dua kunci, dua guna:
 *   X-Kirim  (KANTOR_KIRIM_KUNCI)  -> mengirim surat, membaca balasan.
 *                                     Diketik Porscy sekali di kantor,
 *                                     lalu diingat perambannya.
 *   X-Kunci  (KANTOR_KUNCI)        -> membaca & mengosongkan kotak masuk.
 *                                     Hanya ada di komputer, tidak pernah
 *                                     dikirim ke peramban.
 */
import { put, list, del } from '@vercel/blob';

const AWALAN = 'pesan/';
const AWALAN_BALAS = 'balas/';
const BATAS_BACA = 200;

function nomorAgen(req) {
  const n = String(req.query?.agen ?? '');
  return /^[1-9]$/.test(n) ? n : null;
}
const RE_BERALAMAT = /^(?:pesan|balas)\/agen(\d)--/;
function untukSiapa(pathname) {
  const m = RE_BERALAMAT.exec(pathname);
  return m ? m[1] : null;
}

function bolehBaca(req) {
  const benar = process.env.KANTOR_KUNCI;
  const diberi = req.headers['x-kunci'] || req.query?.kunci || '';
  return !!benar && diberi === benar;
}

/* Kalau KANTOR_KIRIM_KUNCI belum dipasang, mengirim dibiarkan terbuka
   seperti dulu -- supaya kantor tidak mati mendadak sebelum kuncinya
   sempat disetel. Begitu env itu ada, ia langsung berlaku. */
function bolehKirim(req) {
  const benar = process.env.KANTOR_KIRIM_KUNCI;
  if (!benar) return true;
  const diberi = req.headers['x-kirim'] || req.query?.kirim || '';
  return diberi === benar;
}

async function ambilIsi(blob) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const alamat = blob.downloadUrl || blob.url;
  const opsi = { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' };
  let r = await fetch(alamat, opsi);
  if (!r.ok) r = await fetch(alamat, { cache: 'no-store' });   // cadangan store publik
  if (!r.ok) return null;
  try { return JSON.parse(await r.text()); } catch { return null; }
}

async function kumpulkan(awalan, agen, ikutTanpaAlamat) {
  const { blobs } = await list({ prefix: awalan, limit: 1000 });
  const milik = agen
    ? blobs.filter((b) => {
        const u = untukSiapa(b.pathname);
        return u === agen || (ikutTanpaAlamat && u === null);
      })
    : blobs;
  milik.sort((a, b) => a.pathname.localeCompare(b.pathname));
  return milik;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    /* MENGIRIM SUDAH DITIADAKAN (11 Sep 2026).

       Jalur ini dulu menerima surat dari halaman kantor, dan ada penjaga
       di komputer yang menjalankan isinya secara otomatis. Porscy memilih
       menutupnya: Remote Control sudah jadi saluran yang sebenarnya, dan
       sebuah alamat publik yang isinya dieksekusi di komputer bukan
       kenyamanan yang sepadan dengan risikonya.

       Ditutup di sini, bukan cuma di halaman — kalau cuma tombolnya yang
       dihilangkan, alamatnya masih bisa dikirimi siapa pun yang tahu.

       MEMBACA masih dibuka supaya surat yang terlanjur ada bisa diambil
       dan dikosongkan dengan kotak1.py / kotak2.py. */
    if (req.method === 'POST') {
      return res.status(410).json({ galat: 'kotak surat sudah ditiadakan' });
    }

    if (req.method === 'GET') {
      const agen = nomorAgen(req);
      const balasan = String(req.query?.balasan ?? '') === '1';

      /* Balasan dibaca Porscy dari peramban, jadi dijaga kunci KIRIM yang
         memang ada padanya. Kotak masuk dibaca Claude dari komputer, jadi
         dijaga kunci BACA yang tidak pernah meninggalkan komputer. */
      if (balasan) {
        if (!bolehKirim(req)) return res.status(401).json({ galat: 'kunci kirim salah' });
      } else if (!bolehBaca(req)) {
        return res.status(401).json({ galat: 'kunci salah' });
      }

      // Surat tanpa alamat cuma ada di kotak masuk, tidak di balasan.
      const dipakai = (await kumpulkan(balasan ? AWALAN_BALAS : AWALAN, agen, !balasan))
        .slice(-BATAS_BACA);

      const pesan = (await Promise.all(dipakai.map(async (b) => {
        const d = await ambilIsi(b);
        if (!d) return null;
        // Nama blob yang menentukan, bukan isinya -- isi bisa saja ditulis
        // pengirim lama tanpa bidang `untuk`.
        return { ...d, untuk: untukSiapa(b.pathname), id: b.pathname };
      }))).filter(Boolean);

      return res.status(200).json({ jumlah: pesan.length, untuk: agen, pesan });
    }

    if (req.method === 'DELETE') {
      const agen = nomorAgen(req);
      const balasan = String(req.query?.balasan ?? '') === '1';
      const ikutLama = String(req.query?.lama ?? '') === '1';

      if (balasan) {
        if (!bolehKirim(req)) return res.status(401).json({ galat: 'kunci kirim salah' });
      } else if (!bolehBaca(req)) {
        return res.status(401).json({ galat: 'kunci salah' });
      }

      /* Mengosongkan HARUS menyebut nomor agen. Dulu DELETE menghapus
         seluruh kotak; dengan dua agen itu berarti satu sesi bisa
         menghapus surat yang belum sempat dibaca sesi sebelah. */
      if (!agen) return res.status(400).json({ galat: 'sebutkan ?agen=N' });

      const sasaran = await kumpulkan(balasan ? AWALAN_BALAS : AWALAN, agen,
                                      ikutLama && !balasan);
      if (sasaran.length) await del(sasaran.map((b) => b.url));
      return res.status(200).json({ ok: true, dihapus: sasaran.length });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ galat: 'cara tidak didukung' });
  } catch (e) {
    return res.status(500).json({ galat: String(e?.message || e) });
  }
}
