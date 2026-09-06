# Backlog / Tugas Terbuka

Format: `[ ]` belum dikerjakan, `[x]` selesai (pindahkan ringkasannya ke
`docs/CHANGELOG.md` saat menandai selesai).

## Prioritas Tinggi

- [ ] Dapatkan/tempelkan isi `code.gs` ke sesi AI berikutnya, lalu verifikasi:
      - asumsi bentuk response `doPost()` di `docs/KNOWN_ISSUES.md` #1.
      - nama field asli untuk kolom N/O/P/R/T/U/W (dipakai `getCandidateStage()`
        di `js/api.js`) — `docs/KNOWN_ISSUES.md` #3b.
- [ ] Putuskan & implementasikan strategi saat update backend gagal
      (rollback otomatis vs. manual refresh) — `docs/KNOWN_ISSUES.md` #2.
- [ ] Putuskan apakah link WA di kolom O ("Link WA", tampaknya sudah jadi
      lengkap dari backend) sebaiknya dipakai langsung menggantikan
      `generateWhatsAppLink()` yang meng-hardcode template pesan di frontend
      — `docs/KNOWN_ISSUES.md` #3b.

## Prioritas Sedang

- [ ] Standarkan nama field pendidikan & alamat di backend, lalu hapus
      fallback ganda di frontend — `docs/KNOWN_ISSUES.md` #3.
- [ ] Tambahkan validasi tanggal interview (tidak boleh tanggal lampau) di
      `scheduleInterviewAction()` (`js/pipeline.js`).
- [ ] Pertimbangkan retry/offline-queue sederhana untuk aksi yang gagal
      karena koneksi terputus.
- [ ] Tinjau ulang definisi "Masih Proses" di dashboard (`js/dashboard.js`)
      bersama pemilik proses rekrutmen — saat ini didefinisikan sebagai
      "kolom M SHORTLIST dan kolom V belum HIRED/REJECTED"; sesuaikan bila
      maknanya berbeda dari yang dimaksud (lihat `docs/ARCHITECTURE.md`
      § Logika Dashboard).
- [ ] Pertimbangkan menambahkan kolom "Tahapan" (hasil `getCandidateStage()`)
      sebagai kolom terpisah di tabel Database (saat ini info detailnya baru
      muncul lewat tooltip `title=` pada badge Status).

## Prioritas Rendah / Nice-to-have

- [ ] Evaluasi migrasi Tailwind dari CDN ke build lokal (butuh build step) —
      `docs/KNOWN_ISSUES.md` #4.
- [ ] Tambahkan indikator loading global saat `loadAllData()` berjalan
      (saat ini hanya tab Screening yang punya `#screening-loading`).
- [ ] Pertimbangkan memecah `index.html` yang berukuran besar (>2700 baris)
      — pisahkan CSS ke file `.css` terpisah agar lebih mudah di-diff/di-review.
- [ ] Tambahkan smoke-test manual sederhana (checklist klik-per-fitur) ke
      `docs/` agar QA sebelum deploy lebih terstruktur.
- [ ] Jika satu kolom Kanban (`js/pipeline.js`) suatu saat berisi ribuan
      kartu dan terasa berat (limit 50 sudah dihapus di Revisi #2),
      pertimbangkan virtualisasi render (render hanya kartu yang terlihat
      di viewport) alih-alih membangun seluruh HTML kolom sekaligus.

## Sudah Selesai (lihat detail di CHANGELOG.md)

- [x] Perbaiki `copyWaLink` yang hilang (kini di `js/api.js`, dipakai bersama
      Screening & Database).
- [x] Perbaiki field CV salah (`c.cv` -> `c.cvLink`) di `js/database.js`.
- [x] Perbaiki `mode: "no-cors"` di `js/api.js` agar response backend bisa
      dibaca kembali.
- [x] Deklarasikan `currentScreeningIndex` secara eksplisit.
- [x] Hapus duplikasi fungsi slicer di `index.html`.
- [x] Perbaiki kontras dark mode: badge/label pastel & diagram distribusi
      posisi (Revisi #2).
- [x] Dashboard: kartu metrik membaca kolom M (Shortlisted) & V (Proses,
      Hired), bukan cuma V (Revisi #2).
- [x] Screening card: tahapan kandidat (`getCandidateStage()`), WA bisa
      di-copy (Revisi #2).
- [x] Pipeline: perbaiki bug kandidat salah masuk kolom "Shortlist (Belum
      WA)", hapus limit 50 kartu/kolom (Revisi #2).
- [x] Database: kolom CV di header hilang (perbaikan colspan tidak lengkap),
      tambah sort/filter/sticky header/pilihan jumlah baris (Revisi #2).
