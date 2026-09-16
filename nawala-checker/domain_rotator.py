#!/usr/bin/env python3
"""Domain rotator / Nawala checker.

NAWALA hanya jika jawaban DNS mengandung indikator sinkhole
(internetpositif / blockpage XL / TrustPositif / IP sinkhole yang dikenal).

Bukan karena IP berbeda dari 8.8.8.8 (false positif Cloudflare).
Timeout / resolver mati = tidak terukur, bukan AMAN.

Grup:
  Telkom   — resolver 118.98.44.10 (terbukti filter dari luar ID)
  IOH      — resolver 114.5.230.209 (Indosat + Tri)
  XLSMART  — probe Globalping AS139994 (XL tidak filter dari luar jaringannya)

Setiap siklus ada canary (pornhub.com). Kalau jalur tidak men-sinkhole canary,
grup itu ditandai tidak terukur — jangan sampai AMAN palsu.

Usage:
  python3 domain_rotator.py --once
  python3 domain_rotator.py --once --self-test
  python3 domain_rotator.py
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

import requests

try:
    import dns.resolver
except ImportError:
    print("Install dnspython: pip install dnspython", file=sys.stderr)
    sys.exit(1)

# ============================================================
# KONFIGURASI
# ============================================================
DOMAINS = [
    "https://macanterbang.com",
    "https://tamerons.com",
    "https://ericlofgren.net",
    "https://cytoz.com",
    "https://ngonlinenews.com",
    "https://stenopes.com",
    "https://pigmentumstudio.com",
]

# Domain yang hampir pasti kena sinkhole di ISP Indonesia.
# Dipakai menguji jalur ukur, bukan domain yang dipantau.
CANARY_BLOCKED = "pornhub.com"

CHECK_INTERVAL = int(os.environ.get("CHECK_INTERVAL_SECONDS", "600"))
REQUEST_TIMEOUT = 8
STATUS_FILE = Path(
    os.path.expanduser(
        os.environ.get(
            "NAWALA_STATUS_FILE",
            str(Path(__file__).resolve().parent / "domain_status.json"),
        )
    )
)
WHATSAPP_ALERT_FILE = Path(
    os.path.expanduser(
        os.environ.get(
            "WHATSAPP_ALERT_FILE",
            str(Path(__file__).resolve().parent.parent / "wa-anggaran-bot/data/nawala-alert.json"),
        )
    )
)
KANTOR_NAWALA_URL = os.environ.get(
    "KANTOR_NAWALA_URL", "http://127.0.0.1:8790/nawala"
).strip()
KANTOR_KUNCI = os.environ.get("KANTOR_KUNCI", "").strip()
if not KANTOR_KUNCI:
    try:
        KANTOR_KUNCI = (
            Path(__file__).resolve().parent.parent / "kantor/.kunci-auditor"
        ).read_text(encoding="utf-8").strip()
    except OSError:
        pass
GLOBALPING_CREATE = "https://api.globalping.io/v1/measurements"

ISP_GROUPS = {
    "Telkom": {
        "alias": "Telkom",
        "via": "dns",
        "resolvers": ["118.98.44.10"],
        "fallback": {"via": "globalping", "magic": "AS7713", "asn": "7713", "limit": 3},
    },
    "IOH": {
        "alias": "IOH (Indosat + Tri)",
        "via": "dns",
        "resolvers": ["114.5.230.209"],
        "fallback": {"via": "globalping", "magic": "AS4761", "asn": "4761", "limit": 3},
    },
    "XLSMART": {
        "alias": "XLSMART (XL + Smartfren)",
        "via": "globalping",
        "magic": "AS139994",
        "asn": "139994",
        "limit": 5,
    },
}

SINKHOLE_MARKERS = (
    "internetpositif",
    "internet positif",
    "internetpositif.id",
    "internetpositif.ioh.co.id",
    "internetsehatku.com",
    "trustpositif",
    "trustpositif.komdigi.go.id",
    "nawala",
    "blockpage.xlaxiata",
    "kominfo",
    "komdigi",
)

# IP halaman blokir yang sudah terverifikasi. Cadangan kalau CNAME tidak ikut.
SINKHOLE_IPS = {
    "36.86.63.185",  # internetpositif.id (Telkom)
    "114.7.173.245",  # internetpositif.ioh.co.id
    "114.7.173.246",
    "43.173.57.48",  # blockpage.xlaxiata.id
    "103.155.26.29",  # TrustPositif block page
}

PUBLIC_RESOLVERS = {
    "8.8.8.8",
    "8.8.4.4",
    "1.1.1.1",
    "1.0.0.1",
    "9.9.9.9",
    "208.67.222.222",
    "208.67.220.220",
}

STATUS_AMAN = "aman"
STATUS_NAWALA = "nawala"
STATUS_DOWN = "down"
STATUS_UNMEASURED = "unmeasured"

IP_RE = re.compile(r"\b(\d{1,3}(?:\.\d{1,3}){3})\b")


def now_stamp() -> str:
    return datetime.now().strftime("%d/%m/%Y %H:%M:%S")


def hostname_of(url: str) -> str:
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return (parsed.hostname or url).strip().lower().rstrip(".")


def looks_like_sinkhole(text: str) -> bool:
    blob = (text or "").lower()
    if any(marker in blob for marker in SINKHOLE_MARKERS):
        return True
    return any(ip in IP_RE.findall(text or "") for ip in SINKHOLE_IPS)


def classify_dns_text(text: str) -> str:
    if looks_like_sinkhole(text):
        return STATUS_NAWALA
    if text and text.strip() and text.strip() != "NXDOMAIN":
        return STATUS_AMAN
    return STATUS_UNMEASURED


def dns_response_text(hostname: str, nameserver: str) -> tuple[str, str | None]:
    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = [nameserver]
    resolver.timeout = 5
    resolver.lifetime = 6
    try:
        resolver.use_edns(0, payload=1232)
    except Exception:
        pass
    try:
        answer = resolver.resolve(hostname, "A")
        response = answer.response
        return str(response) if response is not None else "", None
    except dns.resolver.NXDOMAIN:
        return "NXDOMAIN", None
    except dns.resolver.NoAnswer:
        return "", None
    except Exception as exc:
        return "", f"{type(exc).__name__}: {exc}"


def check_group_dns(hostname: str, resolvers: list[str]) -> str:
    saw_aman = False
    for ns in resolvers:
        text, err = dns_response_text(hostname, ns)
        if err:
            continue
        verdict = classify_dns_text(text)
        if verdict == STATUS_NAWALA:
            return STATUS_NAWALA
        if verdict == STATUS_AMAN:
            saw_aman = True
    return STATUS_AMAN if saw_aman else STATUS_UNMEASURED


def globalping_dns(hostname: str, magic: str, asn: str, limit: int) -> str:
    payload = {
        "type": "dns",
        "target": hostname,
        "limit": limit,
        "locations": [{"magic": magic}],
        "measurementOptions": {"query": {"type": "A"}},
    }
    try:
        created = requests.post(GLOBALPING_CREATE, json=payload, timeout=20)
        if created.status_code >= 400:
            print(f"    [!] Globalping {hostname} {magic}: HTTP {created.status_code} {created.text[:180]}")
            return STATUS_UNMEASURED
        measurement_id = created.json()["id"]
    except Exception as exc:
        print(f"    [!] Globalping {hostname} {magic}: {exc}")
        return STATUS_UNMEASURED

    data = None
    for _ in range(25):
        time.sleep(1)
        try:
            data = requests.get(f"{GLOBALPING_CREATE}/{measurement_id}", timeout=20).json()
        except Exception:
            continue
        if data.get("status") in ("finished", "failed"):
            break
    if not data or data.get("status") != "finished":
        return STATUS_UNMEASURED

    saw_nawala = False
    saw_aman = False
    for item in data.get("results") or []:
        probe = item.get("probe") or {}
        result = item.get("result") or {}
        if result.get("status") != "finished":
            continue
        resolver = str(result.get("resolver") or "")
        if resolver in PUBLIC_RESOLVERS:
            continue
        if str(probe.get("asn")) != str(asn):
            continue
        parts = [resolver, result.get("rawOutput") or ""]
        for ans in result.get("answers") or []:
            parts.append(str(ans.get("name") or ""))
            parts.append(str(ans.get("type") or ""))
            parts.append(str(ans.get("value") or ""))
        blob = "\n".join(parts)
        if looks_like_sinkhole(blob):
            saw_nawala = True
        elif result.get("answers"):
            saw_aman = True

    if saw_nawala:
        return STATUS_NAWALA
    if saw_aman:
        return STATUS_AMAN
    return STATUS_UNMEASURED


def check_spec(hostname: str, spec: dict) -> str:
    if spec["via"] == "dns":
        return check_group_dns(hostname, spec["resolvers"])
    if spec["via"] == "globalping":
        return globalping_dns(hostname, spec["magic"], str(spec["asn"]), spec["limit"])
    return STATUS_UNMEASURED


def check_group(hostname: str, spec: dict) -> str:
    verdict = check_spec(hostname, spec)
    if verdict != STATUS_UNMEASURED:
        return verdict
    fallback = spec.get("fallback")
    if fallback:
        return check_spec(hostname, fallback)
    return STATUS_UNMEASURED


def check_http(url: str) -> str:
    try:
        resp = requests.get(
            url,
            timeout=REQUEST_TIMEOUT,
            allow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 domain-rotator"},
        )
        haystack = f"{resp.url}\n{resp.text[:20000]}"
        if looks_like_sinkhole(haystack):
            return STATUS_NAWALA
        return STATUS_AMAN if resp.status_code == 200 else STATUS_DOWN
    except Exception:
        return STATUS_DOWN


def probe_paths() -> dict[str, str]:
    """Uji canary per grup. nawala = jalur sehat; selain itu jangan percaya AMAN."""
    health = {}
    for name, spec in ISP_GROUPS.items():
        verdict = check_group(CANARY_BLOCKED, spec)
        health[name] = verdict
        print(f"  canary {spec['alias']}: {verdict}")
    return health


def apply_path_health(isp: dict[str, str], health: dict[str, str]) -> dict[str, str]:
    adjusted = dict(isp)
    for name, verdict in isp.items():
        if health.get(name) != STATUS_NAWALA:
            # Jalur tidak men-sinkhole canary → hasil AMAN tidak bisa dipercaya.
            if verdict == STATUS_AMAN:
                adjusted[name] = STATUS_UNMEASURED
    return adjusted


def load_status() -> dict:
    if not STATUS_FILE.exists():
        return {}
    try:
        return json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_json(path: Path, payload: dict) -> None:
    """Tulis utuh lalu rename agar pembaca tidak pernah melihat JSON separuh."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    tmp.replace(path)


def save_status(payload: dict) -> None:
    write_json(STATUS_FILE, payload)


def label_http(status: str) -> str:
    return {
        STATUS_AMAN: "Aktif",
        STATUS_NAWALA: "NAWALA terdeteksi",
        STATUS_DOWN: "DOWN",
    }.get(status, status)


def label_isp(status: str) -> str:
    return {
        STATUS_AMAN: "AMAN",
        STATUS_NAWALA: "NAWALA",
        STATUS_UNMEASURED: "tidak terukur",
    }.get(status, status)


def domain_blocked(row: dict) -> bool:
    if row.get("http") == STATUS_NAWALA:
        return True
    return any(value == STATUS_NAWALA for value in (row.get("isp") or {}).values())


def snapshot_of(rows: list[dict]) -> dict:
    return {
        row["domain"]: {"http": row["http"], "isp": row["isp"]}
        for row in rows
    }


def newly_blocked(rows: list[dict], previous: dict) -> list[dict]:
    old = previous.get("domains") or {}
    return [
        row
        for row in rows
        if domain_blocked(row) and not domain_blocked(old.get(row["domain"], {}))
    ]


def format_whatsapp_alert(rows: list[dict]) -> str:
    lines = ["🚨 *NAWALA TERDETEKSI*", f"🕑 {now_stamp()}"]
    for row in rows:
        kena = [
            ISP_GROUPS[name]["alias"]
            for name, status in row["isp"].items()
            if status == STATUS_NAWALA
        ]
        if row["http"] == STATUS_NAWALA:
            kena.insert(0, "HTTP")
        lines.extend(["", f"• {hostname_of(row['domain'])}", "  " + ", ".join(kena)])
    lines.append("\nPeriksa dan siapkan domain pengganti.")
    return "\n".join(lines)


def queue_whatsapp_alert(rows: list[dict]) -> bool:
    if not rows:
        return False
    write_json(
        WHATSAPP_ALERT_FILE,
        {
            "id": str(time.time_ns()),
            "createdAt": datetime.now().astimezone().isoformat(timespec="seconds"),
            "text": format_whatsapp_alert(rows),
            "domains": [hostname_of(row["domain"]) for row in rows],
        },
    )
    return True


def send_to_office(rows: list[dict], health: dict[str, str]) -> bool:
    if not KANTOR_NAWALA_URL:
        return False
    payload = {
        "checked": now_stamp(),
        "canary": health,
        "sites": [
            {
                "domain": hostname_of(row["domain"]),
                "blocked": domain_blocked(row),
                "http": row["http"],
                "isp": row["isp"],
            }
            for row in rows
        ],
    }
    headers = {"X-Kunci": KANTOR_KUNCI} if KANTOR_KUNCI else {}
    try:
        response = requests.post(
            KANTOR_NAWALA_URL, json=payload, headers=headers, timeout=5
        )
        if response.status_code == 200:
            return True
        print(f"  [!] Kantor: HTTP {response.status_code} {response.text[:160]}")
    except Exception as exc:
        print(f"  [!] Kantor tidak terjangkau: {exc}")
    return False


def check_one_domain(url: str, health: dict[str, str]) -> dict:
    host = hostname_of(url)
    print(f"  Cek: {url}")
    http_status = check_http(url)
    isp = {name: check_group(host, spec) for name, spec in ISP_GROUPS.items()}
    isp = apply_path_health(isp, health)
    row = {"domain": url, "http": http_status, "isp": isp}
    tag = "[NAWALA]" if domain_blocked(row) else "[AMAN]"
    isp_text = {name: label_isp(value) for name, value in isp.items()}
    print(f"    {tag} HTTP={label_http(http_status)} | {isp_text}")
    return row


def run_check() -> list[dict]:
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Mengecek {len(DOMAINS)} domain...")
    print(f"  Uji jalur canary ({CANARY_BLOCKED})...")
    health = probe_paths()

    rows: list[dict] = []
    # HTTP + DNS lokal cepat; Globalping XL paralel per domain.
    with ThreadPoolExecutor(max_workers=min(4, len(DOMAINS))) as pool:
        futures = [pool.submit(check_one_domain, url, health) for url in DOMAINS]
        ordered = {fut: url for fut, url in zip(futures, DOMAINS)}
        done = {}
        for fut in as_completed(futures):
            done[ordered[fut]] = fut.result()
        rows = [done[url] for url in DOMAINS]

    previous = load_status()
    current = snapshot_of(rows)
    alerts = newly_blocked(rows, previous)
    save_status(
        {
            "updated": now_stamp(),
            "waktu": time.time(),
            "canary": {name: health[name] for name in ISP_GROUPS},
            "domains": current,
        }
    )
    send_to_office(rows, health)
    if alerts:
        try:
            queue_whatsapp_alert(alerts)
            print(f"  [ALERT] {len(alerts)} domain Nawala masuk antrean WhatsApp.")
        except Exception as exc:
            print(f"  [!] Gagal menulis antrean WhatsApp: {exc}")
    else:
        print("  [OK] Tidak ada domain baru yang berubah menjadi Nawala.")
    return rows


def self_test() -> int:
    assert looks_like_sinkhole("CNAME internetpositif.id")
    assert looks_like_sinkhole("A 36.86.63.185")
    assert not looks_like_sinkhole("A 1.2.3.4")
    assert classify_dns_text("NXDOMAIN") == STATUS_UNMEASURED
    blocked = {"domain": "https://example.com", "http": STATUS_AMAN,
               "isp": {"Telkom": STATUS_NAWALA}}
    safe = {"http": STATUS_AMAN, "isp": {"Telkom": STATUS_AMAN}}
    assert newly_blocked([blocked], {"domains": {"https://example.com": safe}}) == [blocked]
    assert newly_blocked([blocked], {"domains": {"https://example.com": blocked}}) == []
    print("Self-test jalur ukur (canary harus NAWALA)...")
    health = probe_paths()
    failed = [name for name, verdict in health.items() if verdict != STATUS_NAWALA]
    for name, spec in ISP_GROUPS.items():
        print(f"  {spec['alias']}: {health[name]}")
    if failed:
        print("GAGAL: jalur ini tidak men-sinkhole canary:", ", ".join(failed))
        return 1
    print("OK: Telkom, IOH, XLSMART semua men-sinkhole canary.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Domain rotator Nawala Telkom / IOH / XLSMART")
    parser.add_argument("--once", action="store_true", help="Satu siklus lalu keluar")
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Hanya uji canary (pornhub.com) lalu keluar",
    )
    args = parser.parse_args()

    print("Domain rotator started — Telkom / IOH / XLSMART")
    print("Deteksi: sinkhole DNS (bukan beda IP vs 8.8.8.8)")
    print(f"Interval: {CHECK_INTERVAL} detik · notifikasi: WhatsApp Cost SEO")

    if args.self_test:
        return self_test()

    if args.once:
        run_check()
        return 0

    while True:
        run_check()
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    raise SystemExit(main())
