# Backlog / Tugas Terbuka

Format: `[ ]` belum dikerjakan, `[x]` selesai (pindahkan ringkasannya ke
`docs/CHANGELOG.md` saat menandai selesai).

## Prioritas Tinggi

- [ ] Dapatkan/tempelkan isi `code.gs` ke sesi AI berikutnya, lalu verifikasi
      asumsi bentuk response `doPost()` di `docs/KNOWN_ISSUES.md` #1.
- [ ] Putuskan & implementasikan strategi saat update backend gagal
      (rollback otomatis vs. manual refresh) — `docs/KNOWN_ISSUES.md` #2.

## Prioritas Sedang

- [ ] Standarkan nama field pendidikan & alamat di backend, lalu hapus
      fallback ganda di frontend — `docs/KNOWN_ISSUES.md` #3.
- [ ] Tambahkan validasi tanggal interview (tidak boleh tanggal lampau) di
      `scheduleInterviewAction()` (`js/pipeline.js`).
- [ ] Pertimbangkan retry/offline-queue sederhana untuk aksi yang gagal
      karena koneksi terputus.

## Prioritas Rendah / Nice-to-have

- [ ] Evaluasi migrasi Tailwind dari CDN ke build lokal (butuh build step) —
      `docs/KNOWN_ISSUES.md` #4.
- [ ] Tambahkan indikator loading global saat `loadAllData()` berjalan
      (saat ini hanya tab Screening yang punya `#screening-loading`).
- [ ] Pertimbangkan memecah `index.html` yang berukuran besar (>2700 baris)
      — pisahkan CSS ke file `.css` terpisah agar lebih mudah di-diff/di-review.
- [ ] Tambahkan smoke-test manual sederhana (checklist klik-per-fitur) ke
      `docs/` agar QA sebelum deploy lebih terstruktur.

## Sudah Selesai (lihat detail di CHANGELOG.md)

- [x] Perbaiki `copyWaLink` yang hilang di `js/database.js`.
- [x] Perbaiki field CV salah (`c.cv` -> `c.cvLink`) di `js/database.js`.
- [x] Perbaiki `mode: "no-cors"` di `js/api.js` agar response backend bisa
      dibaca kembali.
- [x] Deklarasikan `currentScreeningIndex` secara eksplisit.
- [x] Hapus duplikasi fungsi slicer di `index.html`.
