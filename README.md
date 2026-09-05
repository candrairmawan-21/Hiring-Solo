# Sistem Rekrutmen Solo Raya (MR DIY)

Aplikasi web satu halaman (single-page, no build step) untuk mengelola pipeline
rekrutmen: screening awal, kanban pipeline, dashboard metrik, dan database
master kandidat. Data disimpan di **Google Sheet**, diakses lewat backend
**Google Apps Script (GAS) Web App**.

> Dokumentasi ini sengaja dibuat untuk memudahkan **multi-AI / multi-developer**
> mengerjakan proyek ini secara bergantian tanpa kehilangan konteks. Baca
> `docs/AGENT_GUIDE.md` sebelum mulai mengerjakan sesuatu.

## Struktur Proyek

```
index.html          # Seluruh markup + CSS (inline <style>) + script inisialisasi utama (inline <script> di akhir body)
js/
  config.js          # URL backend Apps Script (CONFIG.API_URL)
  api.js             # Semua komunikasi fetch ke Google Sheet (GET & POST)
  screening.js        # Render kartu swipe screening + aksi Reject/Skip/Shortlist
  pipeline.js         # Render kanban board (Shortlist -> Waiting -> Review -> Interview -> Hired)
  dashboard.js         # Render metrik & bar distribusi posisi
  database.js          # Render tabel master + pencarian + pagination
docs/
  ARCHITECTURE.md      # Alur data, pemetaan kolom Sheet <-> field JS, kontrak API
  AGENT_GUIDE.md        # Panduan kerja untuk AI/dev yang melanjutkan proyek ini
  CHANGELOG.md           # Riwayat perbaikan yang sudah dilakukan
  KNOWN_ISSUES.md         # Bug yang BELUM diperbaiki / butuh akses code.gs atau keputusan produk
  TASKS.md                  # Backlog terbuka, checklist siap dikerjakan
```

**PENTING:** Backend Google Apps Script (`code.gs`) **TIDAK ADA** di dalam repo
ini — hanya frontend statis. Semua asumsi tentang bentuk response backend
(field `success`, `message`, dsb.) ditulis eksplisit di `docs/ARCHITECTURE.md`
dan **wajib diverifikasi** terhadap kode `code.gs` yang sebenarnya sebelum
dipakai di produksi.

## Menjalankan Secara Lokal

Karena tidak ada build step, cukup buka `index.html` langsung di browser, atau
serve dengan static server sederhana (disarankan, agar path `js/*.js` konsisten
dan Clipboard API bisa berfungsi — beberapa browser membatasi fitur tertentu
di `file://`):

```bash
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

Isi `js/config.js` dengan URL deployment Google Apps Script Web App Anda
sendiri (`API_URL`).

## Status Perbaikan

Lihat `docs/CHANGELOG.md` untuk daftar bug yang **sudah** diperbaiki pada
revisi ini, dan `docs/KNOWN_ISSUES.md` untuk yang **belum** — termasuk yang
butuh perubahan di backend (`code.gs`) yang tidak tersedia di repo ini.
