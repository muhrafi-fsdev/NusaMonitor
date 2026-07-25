# NusaMonitor Indonesia Live

Dashboard situational awareness **khusus Indonesia** dengan data publik nyata. Project ini dibuat orisinal dari nol dan mengambil inspirasi konsep command-center dari World Monitor, tanpa menyalin source code atau branding-nya.

## Live Data Sources

| Layer | Sumber | Status |
|---|---|---|
| Gempa dirasakan dan M5+ | BMKG Data Gempabumi Terbuka | Aktif, tanpa API key |
| Peringatan dini cuaca | BMKG CAP / RSS Nowcast | Aktif, tanpa API key |
| Prakiraan cuaca ADM4 | BMKG API Prakiraan Cuaca | Aktif, tanpa API key |
| Laporan bencana warga | PetaBencana Open API | Aktif, tanpa API key |
| Berita Indonesia | GDELT DOC 2.0 | Aktif, tanpa API key |

Jika sebuah sumber gagal, aplikasi menampilkan **unavailable** dan tidak membuat data palsu.

## Menjalankan

Persyaratan: Node.js 20 atau lebih baru.

```powershell
node server.mjs
```

Buka `http://localhost:3000`.

Tidak ada `npm install` karena server menggunakan modul bawaan Node.js.

## Deployment

Project membutuhkan backend proxy sehingga **tidak cocok untuk GitHub Pages**. Gunakan salah satu:

- VPS dengan Node.js 20+
- Render Web Service
- Railway
- Docker

### Docker

```powershell
docker build -t nusamonitor-indonesia .
docker run -p 3000:3000 nusamonitor-indonesia
```

## Attribution

Aplikasi menampilkan atribusi dan metadata sumber. Penggunaan data BMKG wajib mencantumkan BMKG sebagai sumber.

## Disclaimer

NusaMonitor bukan sistem resmi pemerintah dan bukan pengganti kanal peringatan resmi. Selalu konfirmasi informasi kritis melalui BMKG, BNPB/BPBD, dan instansi terkait.

## Developer

Muhammad Rafi Priyo — `muhrafi-fsdev`
