# Known Issues (Belum Diperbaiki)

Bug/celah di bawah ini **sengaja belum diperbaiki** dalam sesi ini karena
butuh akses ke `code.gs` (backend, tidak ada di repo) atau butuh keputusan
produk dari pemilik proyek. Sesi berikutnya (AI atau manusia) yang punya
info tambahan dipersilakan menindaklanjuti lalu memindahkan entrinya ke
`docs/CHANGELOG.md`.

## 1. Bentuk response `doPost()` belum terverifikasi

`js/api.js` (`updateCandidateDataInSheet`) sekarang mengasumsikan `code.gs`
mengembalikan JSON `{ success: true|false, message?: string }`. Ini
**asumsi**, bukan fakta terverifikasi — karena `code.gs` tidak ada di repo.

**Yang perlu dilakukan:** tempelkan isi `code.gs` (khususnya fungsi
`doPost`) ke sesi berikutnya, lalu:
- Jika bentuk response berbeda, sesuaikan pengecekan di
  `updateCandidateDataInSheet()`.
- Jika `doPost` ternyata TIDAK mengembalikan JSON sama sekali (misalnya
  hanya `ContentService.createTextOutput("OK")`), maka `response.json()`
  akan melempar error dan setiap update akan selalu tampil "gagal" padahal
  sebenarnya berhasil — dalam kasus ini, ganti ke `response.text()` dan
  cek isinya secara string, atau minta backend diubah agar mengembalikan
  JSON terstruktur.

## 2. Tidak ada rollback otomatis saat update backend gagal

Pola optimistic-UI di `js/pipeline.js` dan `js/screening.js` mengubah
`globalCandidates` secara lokal SEBELUM mengetahui hasil dari backend. Sejak
Perbaikan #3 (lihat CHANGELOG), kegagalan backend **sudah terlihat** sebagai
toast error — tapi state lokal (kanban board, kartu screening) **tidak
otomatis dikembalikan** ke kondisi semula saat backend menolak.

**Dampak:** user bisa melihat kandidat "pindah kolom" di kanban, lalu dapat
toast error, tapi kartu tetap di kolom baru sampai halaman di-refresh
manual (`loadAllData()`).

**Opsi perbaikan (butuh keputusan produk, bukan cuma teknis):**
- (a) Rollback otomatis + re-render saat `result.success === false`.
- (b) Biarkan seperti sekarang tapi tambahkan tombol "Refresh" yang lebih
  mencolok / auto-refresh berkala.

## 3. Field `lastEducation` vs `education`, `fullAddress` vs `city`

Beberapa field dibaca dengan fallback ganda (`c.lastEducation || c.education`,
`c.fullAddress || c.city`) karena ketidakjelasan nama field yang benar-benar
dikirim backend saat ini. Fallback ini AMAN dipertahankan, tapi idealnya
`code.gs` distandarkan mengirim SATU nama field yang konsisten, lalu
fallback di frontend bisa dihapus. Butuh akses `code.gs` untuk memastikan.

## 3b. Nama field untuk kolom N, O, P, R, T, U, W masih tebakan

Sesi ini menambahkan `getCandidateStage()` (`js/api.js`) yang membaca kolom
N (Review by), O (Link WA), P (WA CV/status kirim), R (Review CV), T (Hasil
Interview), U (Remark), dan W (Store Penempatan) — field-field ini
**sebelumnya sama sekali tidak dipakai** di frontend manapun. Karena
`code.gs` tidak ada di repo, nama field JS untuk kolom-kolom ini adalah
**tebakan** dengan beberapa alias fallback (lihat tabel & penjelasan
lengkap di `docs/ARCHITECTURE.md` § Pemetaan Field). Efek jika tebakan
meleset: badge "Tahapan Saat Ini" di kartu Screening dan kolom Status di
Database tetap berfungsi, tapi mungkin **kurang detail** dari seharusnya
(mis. tidak menyebutkan nama reviewer atau hasil interview) karena field-nya
tidak terbaca — TIDAK akan menyebabkan error, hanya kurang informatif.

**Yang perlu dilakukan:** begitu `code.gs` tersedia, cocokkan nama field
asli untuk kolom N/O/P/R/T/U/W, lalu tambahkan sebagai alias pertama di
`getCandidateStage()` (`js/api.js`) — jangan hapus alias lama, cukup
tambahkan di depan supaya lebih diprioritaskan.

Satu hal lagi yang perlu diputuskan: kolom **O (Link WA)** tampaknya sudah
berisi link wa.me + pesan siap kirim yang dibuat backend, tapi kolom ini
**belum dipakai sama sekali** — app masih membuat link WA-nya sendiri lewat
`generateWhatsAppLink()` (`js/pipeline.js`) dengan template pesan yang
di-hardcode di frontend. Kalau pesan di kolom O ini dimaksudkan sebagai
sumber kebenaran (single source of truth) untuk isi pesan WA — misalnya
supaya recruiter bisa mengubah template pesan lewat Sheet tanpa deploy
ulang kode — sebaiknya `generateWhatsAppLink()` diganti untuk memakai
`candidate.waLink` (kolom O) langsung saat tersedia, dengan
`generateWhatsAppLink()` sebagai fallback saja. Ini keputusan produk, bukan
sekadar teknis, jadi sengaja belum diubah sepihak.

## 4. Tailwind via CDN

`index.html` memuat Tailwind lewat `<script src="https://cdn.tailwindcss.com">`.
Ini nyaman untuk prototipe tapi:
- Bergantung pada koneksi internet ke CDN setiap kali app dibuka.
- Tidak ada purge CSS (bundle besar, tanpa build step).
- Tidak cocok untuk lingkungan dengan Content Security Policy ketat.

Belum diubah karena mengubahnya butuh menambahkan build step
(package.json, Tailwind CLI/PostCSS) — perubahan struktural yang sebaiknya
disetujui dulu oleh pemilik proyek.

## 5. Tidak ada validasi input tanggal interview

`scheduleInterviewAction()` di `js/pipeline.js` hanya mengecek apakah
`dateInput.value` terisi, tidak mengecek apakah tanggalnya masuk akal
(mis. tidak boleh tanggal yang sudah lewat). Minor, tapi bisa jadi sumber
data kotor di Sheet.

## 6. Tidak ada mekanisme retry / offline queue

Jika koneksi terputus saat aksi dilakukan, `updateCandidateDataInSheet()`
akan gagal sekali dan menampilkan toast error — tidak ada retry otomatis
atau antrean offline. Untuk penggunaan lapangan (recruiter di HP dengan
koneksi tidak stabil), ini berisiko data hilang secara diam-diam kalau
recruiter tidak memperhatikan toast error.
