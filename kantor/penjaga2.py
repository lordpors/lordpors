#!/usr/bin/env python3
"""
Penjaga kotak masuk Agent 2.

Inilah yang membuat Porscy bisa menghubungi Agent 2 dari kantor daring
tanpa Claude harus membuka kotak2.py sendiri. Alurnya:

    kantor (HP)  ->  laci pesan/agen2--  ->  penjaga ini  ->  claude -p
                                                            |
    chat kantor  <-  laci balas/agen2--  <-----------------

BUKAN AI YANG MENGANTAR. Ollama dan kawan-kawannya cuma menghasilkan
teks; tidak ada yang bisa membangunkan sebuah proses. Yang membangunkan
adalah skrip bodoh ini: ia mengintip, dan kalau ada surat baru ia
menjalankan claude. Itu saja rahasianya.

BIAYA. Mengintip kotak tidak menagih apa pun -- itu cuma HTTP biasa ke
Vercel. Yang memakai kuota hanyalah surat yang benar-benar datang, dan
itu ditarik dari LANGGANAN, bukan tagihan API, selama CLAUDE_CONFIG_DIR
di bawah menunjuk config dir yang login lewat OAuth dan tidak ada
ANTHROPIC_API_KEY di lingkungan. Kalau suatu hari ada yang menaruh kunci
API di berkas service systemd, tagihannya pindah ke API tanpa peringatan.

    python3 penjaga2.py            jalan terus
    python3 penjaga2.py --sekali   periksa sekali lalu berhenti
    python3 penjaga2.py --uji      tampilkan yang akan dikerjakan, tanpa
                                   memanggil claude
"""
import json, os, subprocess, sys, time, urllib.error, urllib.request, uuid
from pathlib import Path

NOMOR   = 2
DIR     = Path(__file__).resolve().parent
KERJA   = DIR.parent                       # ~/My_Business/AI-agent
KUNCI_B = DIR / ".kunci-kantor"            # untuk membaca kotak masuk
KUNCI_K = DIR / ".kunci-kirim"             # untuk mengirim balasan
KEADAAN = DIR / f"penjaga{NOMOR}-keadaan.json"
AWAN    = "https://kantor-lordpors.vercel.app/api/pesan"
JEDA    = 8                                # detik antar intipan

# Config dir yang login lewat langganan. HARUS eksplisit: systemd tidak
# mewarisi lingkungan shell, jadi tanpa ini claude tidak menemukan
# kredensialnya.
CONFIG_DIR = os.environ.get("CLAUDE_CONFIG_DIR", str(Path.home() / ".claude-personal"))

# Alat yang boleh dipakai saat dibangunkan surat. Sengaja TANPA Bash:
# surat yang datang dari internet tidak boleh langsung menjadi perintah
# shell, sekalipun kotaknya sudah berkunci. Tambahkan "Bash" di sini
# hanya kalau memang itu yang diinginkan, sadar akan akibatnya.
ALAT = "Read Grep Glob Edit Write"

WATAK = (
    "Kamu Agent 2 di kantor LordPors Commpany. Pesan ini datang dari kotak "
    "masuk kantor daring, dikirim Porscy dari ponselnya. Jawab dalam Bahasa "
    "Indonesia, ringkas, langsung ke inti -- jawabanmu tampil di gelembung "
    "chat kecil di layar ponsel, bukan di terminal. "
    "SEBELUM menjawab apa pun soal kantor, proyek, atau keadaan pekerjaan, "
    "BACA DULU PROGRES.md di folder kerja ini; seluruh keadaan proyek "
    "tercatat di sana, termasuk tata letak kantor dan siapa menempati meja "
    "mana. Jangan pernah menjawab 'tidak tahu' sebelum memeriksanya -- kamu "
    "punya alat Read dan Grep, pakai. "
    "Kalau tugasnya butuh alat yang tidak kamu punya (misalnya menjalankan "
    "perintah shell), katakan terus terang apa yang perlu Porscy jalankan "
    "sendiri."
)


def kunci(p: Path) -> str:
    if not p.is_file():
        sys.exit(f"  {p.name} tidak ada -- penjaga tidak bisa jalan.")
    return p.read_text(encoding="utf-8").strip()


def keadaan() -> dict:
    if KEADAAN.is_file():
        try:
            return json.loads(KEADAAN.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"sesi": None, "dilihat": []}


def simpan(k: dict):
    k["dilihat"] = k.get("dilihat", [])[-300:]
    KEADAAN.write_text(json.dumps(k, ensure_ascii=False), encoding="utf-8")


def minta(cara: str, tambahan: str = "", isi=None, kirim=False):
    kepala = {"Content-Type": "application/json"}
    kepala["X-Kirim" if kirim else "X-Kunci"] = kunci(KUNCI_K if kirim else KUNCI_B)
    req = urllib.request.Request(
        f"{AWAN}?agen={NOMOR}{tambahan}",
        data=json.dumps(isi).encode() if isi is not None else None,
        headers=kepala, method=cara)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def hadir(aktif: bool, pesan: str = ""):
    """Pinjam agen2.py supaya karakter di panggung ikut duduk saat bekerja."""
    try:
        subprocess.run([sys.executable, str(DIR / f"agen{NOMOR}.py"),
                        "mulai" if aktif else "selesai"] + ([pesan] if aktif else []),
                       capture_output=True, timeout=20)
    except Exception:
        pass


def tanya_claude(teks: str, k: dict) -> str:
    lingkungan = dict(os.environ)
    lingkungan["CLAUDE_CONFIG_DIR"] = CONFIG_DIR
    # Kunci API tidak boleh menyelinap masuk: itu memindahkan tagihan dari
    # langganan ke API tanpa ada yang memberi tahu.
    lingkungan.pop("ANTHROPIC_API_KEY", None)

    baru = not k.get("sesi")
    if baru:
        k["sesi"] = str(uuid.uuid4())

    perintah = ["claude", "-p", teks,
                "--output-format", "json",
                "--allowedTools", ALAT,
                "--append-system-prompt", WATAK]
    perintah += (["--session-id", k["sesi"]] if baru else ["--resume", k["sesi"]])

    hasil = subprocess.run(perintah, cwd=str(KERJA), env=lingkungan,
                           capture_output=True, text=True, timeout=600)

    if hasil.returncode != 0:
        # Sesi bisa hilang (mis. riwayat dibersihkan). Sekali saja, mulai baru.
        if not baru:
            k["sesi"] = None
            return tanya_claude(teks, k)
        return f"(penjaga gagal memanggil claude: {hasil.stderr.strip()[:300]})"

    try:
        d = json.loads(hasil.stdout)
        return str(d.get("result") or hasil.stdout).strip()
    except Exception:
        return hasil.stdout.strip() or "(claude tidak menjawab apa-apa)"


def periksa(uji=False) -> int:
    k = keadaan()
    dilihat = set(k.get("dilihat", []))
    try:
        d = minta("GET")
    except urllib.error.HTTPError as e:
        print(f"  gagal membaca kotak: HTTP {e.code}")
        return 0
    except Exception as e:
        print(f"  gagal membaca kotak: {type(e).__name__}")
        return 0

    # Surat tanpa alamat sengaja dilewati: ia juga tampil di laci agen
    # lain, dan tidak ada yang tahu itu sebenarnya ditujukan ke siapa.
    baru = [p for p in d.get("pesan", [])
            if p.get("id") not in dilihat and p.get("untuk") == str(NOMOR)]
    if not baru:
        return 0

    for p in baru:
        teks = (p.get("teks") or "").strip()
        print(f"  surat: {teks[:70]}")
        if uji:
            k.setdefault("dilihat", []).append(p["id"])
            continue

        hadir(True, teks[:60] or "membalas surat")
        try:
            jawab = tanya_claude(teks, k)
        finally:
            hadir(False)

        try:
            minta("POST", isi={"teks": jawab[:4000], "untuk": str(NOMOR),
                               "balasan": True}, kirim=True)
            print(f"  dibalas: {jawab[:70]}")
        except Exception as e:
            print(f"  gagal mengirim balasan: {type(e).__name__}")

        k.setdefault("dilihat", []).append(p["id"])
        simpan(k)

    simpan(k)
    return len(baru)


def main():
    uji = "--uji" in sys.argv
    sekali = "--sekali" in sys.argv or uji
    print(f"  penjaga Agent {NOMOR} -- config dir {CONFIG_DIR}")
    print(f"  alat yang diizinkan: {ALAT}")
    if sekali:
        periksa(uji)
        return
    while True:
        try:
            periksa()
        except Exception as e:
            print(f"  galat: {type(e).__name__}: {e}")
        time.sleep(JEDA)


if __name__ == "__main__":
    main()
