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
