# Nawala Checker

Memeriksa semua domain di `DOMAINS` setiap 10 menit melalui DNS Telkom,
IOH, dan XLSMART. Canary memastikan jalur ukur benar-benar melihat blokir;
jalur yang gagal diukur tidak pernah dilabeli aman.

```sh
python3 -m pip install -r requirements.txt
./jalan.sh --self-test
./jalan.sh
```

Hanya perubahan baru menjadi `NAWALA` yang ditulis ke antrean WhatsApp.
Status lengkap dikirim ke karakter Nawala Checker di kantor.
