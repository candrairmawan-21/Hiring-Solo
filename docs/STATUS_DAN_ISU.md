# Status Perbaikan & Isu Terbuka

Terakhir diaudit: lihat tanggal commit ZIP ini diserahkan. Semua temuan di
bawah diverifikasi langsung dari kode (bandingkan lintas file), bukan tebakan.

## ✅ Sudah Diperbaiki (audit ini)

| # | Isu | File | Perbaikan |
|---|---|---|---|
| 1 | `database.js` baca field `c.cv` untuk tombol CV, padahal `screening.js` & `pipeline.js` konsisten pakai `c.cvLink` untuk data yang sama → tombol CV di Database kemungkinan besar SELALU "Kosong" | `js/database.js` | Diganti jadi `c.cvLink \|\| c.cv` (prioritaskan yang lebih konsisten, fallback aman) |
| 2 | `currentScreeningIndex` tidak pernah dideklarasikan (`let`/`var`/`const`) — implicit global, rapuh kalau script dipindah ke strict mode | `index.html` | Dideklarasikan eksplisit `let currentScreeningIndex = 0;` di blok state global |
| 3 | 3 fungsi (`handleSlicerChange`, `updateSlicerSummary`, `initSlicerSummaries`) didefinisikan 2× berturut-turut (copy-paste), plus 1 pemanggilan `initSlicerSummaries()` dobel | `index.html` | Duplikat dihapus, sisa 1 definisi + 1 pemanggilan masing-masing |
| 4 | Section "Alamat Lengkap" di kartu Screening selalu menampilkan nilai IDENTIK dengan "Domisili" (karena `fullAddress` tidak pernah dikirim backend, fallback ke `city`) — membingungkan, seolah 2 info berbeda | `js/screening.js` | Section "Alamat Lengkap" sekarang HANYA muncul kalau `fullAddress` benar-benar ada dan berbeda dari `city` |
| 5 | Badge header "LIVE • SHEET SYNC" murni dekoratif — data cuma di-fetch sekali saat load, tidak pernah lagi. Tab yang terbuka lama tidak akan pernah tahu ada perubahan baru di Sheet | `index.html` | Ditambahkan `setInterval` 30 detik yang re-fetch & re-render Dashboard/Pipeline/Database (Screening SENGAJA dikecualikan supaya tidak mengganggu antrean swipe yang berjalan) |

Semua perbaikan di atas sudah lolos `node --check` (syntax) dan diuji dengan
skenario nyata (lihat riwayat percakapan sesi audit ini untuk detail test).

## 🟡 Belum Dikerjakan — Perlu Keputusan/Konfirmasi User Dulu

Ini BUKAN bug yang jelas salah, tapi keputusan desain/prioritas yang sebaiknya
dikonfirmasi ke user sebelum diubah (supaya tidak mengerjakan hal yang salah
arah):

1. **Multi-select native (`<select multiple>`) untuk semua slicer filter.**
   Secara teknis berfungsi, tapi UX-nya kurang ramah (harus Ctrl/Cmd+klik
   untuk pilih banyak, tidak ada checkbox visual). Pertimbangkan ganti ke
   custom dropdown dengan checkbox kalau HR sering pakai multi-filter.
2. **Opsi filter (posisi, kota, dll) di-hardcode di HTML**, tidak dinamis dari
   data aktual. Kalau ada posisi/kota baru yang dilamar, developer harus edit
   HTML manual. Bisa diubah untuk generate opsi dari `globalCandidates` secara
   otomatis kalau ini jadi masalah rutin.
3. **`isDuplicate` tidak pernah dihitung di frontend** — sepenuhnya bergantung
   backend mengirim flag ini sudah terhitung. Kalau backend belum benar-benar
   menghitungnya, banner "Duplikat" di UI tidak akan pernah muncul meski ada
   data ganda sungguhan. Perlu verifikasi ke `code.gs`.
4. **Auto-refresh 30 detik (baru ditambahkan)** memanggil `loadAllData()` yang
   fetch SELURUH data kandidat lagi dari awal. Kalau jumlah kandidat sudah
   sangat besar (ribuan+), ini bisa jadi agak berat/lambat tiap 30 detik.
   Kalau performanya jadi masalah, pertimbangkan: (a) perbesar interval jadi
   60-120 detik, atau (b) backend disediakan endpoint incremental (hanya
   kirim baris yang berubah sejak timestamp tertentu).

## 🔴 Isu yang Butuh Akses ke `code.gs` (Backend) — Belum Bisa Diverifikasi

Lihat juga `KAMUS_DATA.md` bagian "Pertanyaan Terbuka". Ringkasnya:
- Field `cvLink` vs `cv` — mana yang benar-benar dikirim backend, belum
  terverifikasi (frontend sudah dibuat toleran ke keduanya sbg mitigasi).
- Field `fullAddress` kemungkinan besar tidak pernah dikirim sama sekali.
- Logika `updateStatus` (POST) di backend — apakah partial update atau full
  overwrite — tidak bisa dikonfirmasi dari frontend saja.
- Karena keterbatasan CORS pada POST (`mode: "no-cors"`, lihat `js/api.js`),
  **frontend tidak pernah tahu kalau sebuah update sungguhan gagal di
  backend** (mis. ID tidak ditemukan). Ini limitasi struktural platform GAS,
  bukan bug — tidak ada perbaikan di sisi frontend untuk ini. Satu-satunya
  solusi permanen adalah pindah backend ke platform yang mendukung CORS penuh
  (di luar scope kalau proyek ini tetap ingin gratis pakai Google Sheets).

## Prinsip untuk AI Berikutnya

Kalau kamu diminta memperbaiki sesuatu terkait poin 🔴 di atas, **jangan
menebak isi `code.gs`** — minta user upload file itu juga. Kode frontend di
sini sudah cukup terdokumentasi lewat komentar `// TEMUAN AUDIT:` dan
`// PERBAIKAN AUDIT:` di tempat-tempat yang relevan — baca komentar itu
duluan sebelum mengubah baris di sekitarnya.
