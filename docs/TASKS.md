# Backlog / Tasks

> **PERINGATAN:** versi dokumen ini sebelumnya mencentang sederet tugas sebagai
> "selesai" padahal kodenya tidak pernah diubah (lihat tabel koreksi di bagian
> atas `docs/CHANGELOG.md`). Dokumen ini sudah direset agar hanya mencantumkan
> status yang **terverifikasi ke kode**. Jangan centang apa pun di sini tanpa
> membuktikannya dengan `grep` ke file yang bersangkutan.

## Sudah Selesai & Terverifikasi (Revisi #3)

Semua item ini diverifikasi ada di kode **dan** diuji jalan di browser asli
(Playwright). Detail root cause tiap item ada di `docs/CHANGELOG.md`.

- [x] Validasi bentuk response backend di `fetchCandidatesFromSheet()`
      (`js/api.js`) + guard `Array.isArray` di 4 render function
- [x] Kartu metrik Dashboard membaca kolom M + V lewat `getCandidateStage()`
- [x] Antrean Screening tidak lagi selalu kosong (status V kosong = RAW)
- [x] Logo MR.DIY diganti SVG inline (base64 lama corrupt)
- [x] Diagram distribusi posisi: track & fill diwarnai terpisah
- [x] `copyWaLink()` didefinisikan; nomor WA di Screening jadi tombol copy
- [x] Badge "Tahapan Saat Ini" + panel aksi lanjutan kandidat shortlist
- [x] Pipeline: gerbang kanban pakai kolom M, limit 50 kartu dihapus,
      body kartu ikut kolom, tombol "CV Sudah Masuk" & "Copy Link WA"
- [x] Database: header kolom CV ditambahkan, badge pakai `getCandidateStage()`,
      filter Tahapan, sorting kolom, baris per halaman (25/50/100/Semua)
- [x] POST hybrid (baca response, fallback `no-cors`)

## Prioritas Berikutnya (butuh `code.gs`)

- [ ] **Dapatkan isi `code.gs` dari pemilik proyek.** Ini memblokir beberapa hal
      sekaligus: verifikasi bentuk response `doPost`, nama field asli kolom
      N/O/P/R/T/U/W, dan logika deteksi `isDuplicate`. Lihat
      `docs/KNOWN_ISSUES.md` #1, #3b.
- [ ] Setelah `code.gs` ada: lengkapi `getCandidateStage()` dengan kolom
      N/O/P/R/T/U/W supaya badge tahapan lebih detail (nama reviewer, hasil
      interview, store penempatan).
- [ ] Setelah `code.gs` ada: putuskan apakah kolom O (Link WA) dipakai sebagai
      sumber template pesan WA, menggantikan `generateWhatsAppLink()` yang
      template-nya di-hardcode di frontend. Keputusan produk, bukan teknis.

## Perbaikan yang Butuh Keputusan Produk

- [ ] Rollback otomatis saat backend menolak update (sekarang state lokal tetap
      berubah walau backend gagal). Lihat `docs/KNOWN_ISSUES.md` #2.
- [ ] UX multi-select filter: `<select multiple>` native kurang ramah (harus
      Ctrl+klik). Pertimbangkan dropdown checkbox kustom.
- [ ] Opsi filter (posisi, kota) masih hardcode di `index.html` — kalau ada
      posisi/kota baru, harus edit HTML manual. Bisa digenerate dari data.
- [ ] Validasi tanggal interview (sekarang tanggal lampau pun diterima).
      Lihat `docs/KNOWN_ISSUES.md` #5.
- [ ] Tailwind via CDN -> build lokal (butuh menambah build step).
      Lihat `docs/KNOWN_ISSUES.md` #4.
- [ ] Retry / offline queue untuk koneksi tidak stabil di lapangan.
      Lihat `docs/KNOWN_ISSUES.md` #6.

## Utang Teknis

- [ ] Tidak ada test otomatis. Minimal: skrip Playwright yang mengklik keempat
      tab dan gagal kalau ada `pageerror` — pola ini sudah dipakai manual di
      Revisi #3, tinggal disimpan sebagai file di repo.
- [ ] Tidak ada linter/CI yang memvalidasi bahwa setiap fungsi di
      `onclick="..."` benar-benar terdefinisi. Dua bug nyata (`copyWaLink`,
      `toggleInboxModal` di proyek lain milik pemilik yang sama) lolos lama
      justru karena ini. Skrip pengecekannya ada di `docs/AGENT_GUIDE.md`.
