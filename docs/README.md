# 📌 Baca Ini Dulu — Konteks Proyek "Hiring-Solo"

> **Untuk AI lain (Claude/ChatGPT/Copilot/dll) yang baru pertama kali melihat repo ini:**
> Baca seluruh folder `docs/` ini SEBELUM mengerjakan permintaan apapun dari user.
> Isinya dirancang supaya kamu tidak perlu bertanya ulang hal-hal dasar yang
> jawabannya sudah ada di sini.

## Apa Proyek Ini?

**Sistem Rekrutmen Solo Raya - MR DIY** — aplikasi web internal untuk tim HR
menyaring dan mengelola kandidat pelamar kerja MR DIY area Solo Raya (Surakarta,
Boyolali, Sukoharjo, Karanganyar, Sragen).

Alur bisnisnya kira-kira:
1. Kandidat melamar lewat form eksternal (Google Form, di luar repo ini) →
   masuk sebagai baris baru di **Google Sheet** dengan status `RAW`.
2. HR melakukan **screening awal** lewat kartu swipe (Tinder-style) di tab
   **Screening** → memutuskan `SHORTLIST`, `REJECTED`, atau `SKIP`.
3. Kandidat yang di-`SHORTLIST` masuk ke tab **Pipeline** (papan status,
   BUKAN drag-drop kanban — murni tombol aksi per tahap) → HR kirim WhatsApp,
   tunggu CV, jadwalkan interview, sampai keputusan akhir `HIRED`/`REJECTED`.
4. Tab **Dashboard** menampilkan ringkasan angka (total, shortlist, proses, hired).
5. Tab **Database** adalah arsip/pencarian semua kandidat (paginated, 25 baris/halaman).

## Arsitektur Singkat

**Ini situs statis 100% client-side** (HTML+JS biasa, tanpa build step/npm/framework
JS). Backend-nya **Google Apps Script (GAS)** yang membaca/menulis ke **Google Sheet**
sebagai database.

```
Browser (index.html + js/*.js)
        │  fetch()
        ▼
Google Apps Script Web App  (CONFIG.API_URL di js/config.js)
        │
        ▼
Google Sheet (database sesungguhnya)
```

⚠️ **PENTING:** Kode backend (`code.gs` di Google Apps Script) **TIDAK ADA di
repo/ZIP ini**. Semua yang tertulis di dokumen `docs/` ini tentang perilaku
backend adalah **HASIL INFERENSI** dari komentar & kode di frontend (banyak
komentar `// TEMUAN AUDIT:` di kode yang sudah cukup detail), **bukan** hasil
membaca kode backend itu sendiri. Kalau kamu (AI lain) diminta memperbaiki
sesuatu yang menyentuh backend, **minta user upload `code.gs` juga** — jangan
menebak isinya.

Baca lebih detail di (urutan yang disarankan):
1. **`ARCHITECTURE.md`** — struktur file, alur data, kontrak API, dan tabel
   **Pemetaan Field** (nama field JS ↔ kolom A–W Google Sheet). Baca bagian
   Pemetaan Field sebelum menyentuh nama field apa pun.
2. **`CHANGELOG.md`** — apa yang sudah diperbaiki beserta root cause-nya.
   **Baca bagian paling atas dulu**: ada koreksi penting bahwa entri
   "Revisi #2" di versi dokumen sebelumnya mengklaim banyak hal selesai
   padahal kodenya tidak pernah diubah.
3. **`KNOWN_ISSUES.md`** — bug/celah yang **belum** diperbaiki karena butuh
   `code.gs` atau keputusan produk.
4. **`TASKS.md`** — backlog & prioritas berikutnya.
5. **`AGENT_GUIDE.md`** — aturan kerja & skrip verifikasi cepat.

⚠️ **Jangan percaya CHANGELOG/TASKS sebagai status sebenarnya.** Riwayat proyek
ini menunjukkan dokumentasi pernah ditulis seolah pekerjaan selesai padahal
kodenya tidak berubah. **Selalu `grep` ke kode** untuk membuktikan sebuah
perbaikan benar-benar ada sebelum menganggapnya beres.

## Cara Kerja dengan User Proyek Ini

- User (pemilik repo) menyebut dirinya "vibe coder" — beberapa komentar di kode
  ditujukan langsung ke dia ("Developer/Vibe Coder: ..."). Artinya dia paham
  konsep dasar tapi tidak menulis kode manual sendiri — **jelaskan dampak
  perubahan dalam bahasa yang jelas, bukan cuma diff teknis**.
- User biasa memberi link **GitHub repo** dan/atau **upload ZIP** hasil "Download
  ZIP" dari GitHub. AI dengan akses web browsing **tidak bisa** membaca isi
  file lewat GitHub secara langsung (halaman `/tree/` diblokir robots.txt,
  halaman `/blob/` untuk file besar me-render isi via JS yang tidak terbaca
  fetch biasa) — **selalu minta ZIP** kalau butuh baca kode sungguhan.
- Setelah melakukan perubahan, **selalu jalankan syntax check** (`node --check`
  untuk tiap `.js`, dan ekstrak `<script>` inline dari `index.html` lalu cek
  juga) sebelum menyerahkan hasil — ini pola yang sudah dibiasakan di sesi-sesi
  sebelumnya bareng proyek lain milik user yang sama (`Portal-Drive`).
