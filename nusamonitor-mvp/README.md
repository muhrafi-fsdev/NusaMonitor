# NusaMonitor

**NusaMonitor** adalah prototype dashboard intelijen global dan Indonesia dengan peta interaktif, monitoring event, risk overview, news feed, dan situation brief.

Project ini dibuat dari nol sebagai implementasi orisinal yang terinspirasi oleh konsep situational-awareness dashboard. Tidak menyalin source code atau branding World Monitor.

## Fitur MVP

- Peta dunia interaktif menggunakan Leaflet dan dark map tiles
- Layer conflict, disaster, cyber, infrastructure, economic, aviation, dan maritime
- Marker dengan severity dan pulse animation
- Search berdasarkan negara, area, kategori, dan event
- Filter timeline 6–72 jam
- Global Risk Index dinamis
- Active signal counters
- Situation Brief berbasis data event aktif
- Intelligence news stream
- Focus Indonesia dan global
- Detail event dari marker atau feed
- Command palette dengan `Ctrl + K`
- Responsive desktop dan mobile
- PWA shell dan service worker dasar
- Tidak memerlukan backend atau API key untuk versi demo

## Penting

Seluruh event dan signal bawaan adalah **data demonstrasi/simulasi**. Data tersebut bukan informasi real-time dan tidak boleh dipakai untuk keputusan operasional, keselamatan, investasi, atau keamanan.

## Menjalankan secara lokal

```powershell
cd path\ke\nusamonitor-mvp
python -m http.server 8000
```

Buka `http://localhost:8000`.

## Deploy GitHub Pages

1. Upload seluruh isi folder ke repository GitHub.
2. Pastikan `index.html` berada di root.
3. Buka `Settings -> Pages`.
4. Pilih `Deploy from a branch`.
5. Pilih branch `main` dan folder `/ (root)`.

## Roadmap

- Adapter API berita dan RSS
- Data gempa, cuaca ekstrem, dan bencana
- Aviation dan maritime live feeds
- Market and commodity signals
- Authentication dan saved dashboard
- Backend proxy untuk menyembunyikan API key
- Database event dan historical timeline
- AI summarization melalui NusaMind AI
- Bahasa Indonesia dan Inggris
- Desktop package dengan Tauri

## Developer

Muhammad Rafi Priyo — `muhrafi-fsdev`

## License

MIT License untuk kode NusaMonitor MVP ini.
