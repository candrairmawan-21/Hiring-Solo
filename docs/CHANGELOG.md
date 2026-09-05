# Changelog

## [Perbaikan Audit] — sesi ini

Semua perubahan berikut dilakukan tanpa mengubah backend `code.gs` (yang
tidak tersedia di repo), dan tanpa mengubah desain optimistic-UI yang sudah
ada — hanya memperbaiki bug fungsional yang membuat fitur tidak berjalan.

### 1. Bug: tombol WA di tab **Database** selalu error (`copyWaLink is not defined`)
- **File:** `js/database.js`
- **Gejala:** klik tombol WA di kolom "No WA" pada tabel Database tidak
  melakukan apa-apa selain error di Console (`Uncaught ReferenceError:
  copyWaLink is not defined`).
- **Akar masalah:** `onclick="copyWaLink('${waNumber}')"` dipanggil di markup,
  tapi fungsi `copyWaLink` **tidak pernah didefinisikan** di file manapun
  dalam repo.
- **Perbaikan:** menambahkan fungsi `copyWaLink()` yang menyalin link
  `wa.me/...` (dibentuk lewat `generateWhatsAppLink()` dari
  `js/pipeline.js`) ke clipboard, dengan fallback `document.execCommand('copy')`
  untuk browser/HTTP context lama yang tidak mendukung
  `navigator.clipboard`.

### 2. Bug: tombol "Buka CV" di tabel Database selalu tampil "Kosong"
- **File:** `js/database.js`
- **Gejala:** kolom CV di tabel Database selalu menampilkan tombol disabled
  "Kosong", walaupun kandidat yang sama tampil punya CV valid di tab
  Screening/Pipeline.
- **Akar masalah:** `database.js` membaca `c.cv`, sedangkan field yang benar
  dikirim backend (dipakai konsisten oleh `screening.js` & `pipeline.js`)
  adalah `c.cvLink`.
- **Perbaikan:** diganti ke `c.cvLink` (dengan fallback `c.cv` untuk
  kompatibilitas mundur bila ada baris data lama).

### 3. Bug: update status ke Google Sheet tidak pernah bisa dideteksi gagal/sukses
- **File:** `js/api.js`
- **Gejala:** setiap aksi (Reject/Shortlist/Skip, pindah kolom kanban,
  jadwalkan interview, hire/reject interview) selalu tampil sebagai
  "berhasil" di UI meskipun backend sebenarnya menolak (mis. `candidateId`
  salah), karena `mode: "no-cors"` membuat response menjadi *opaque*
  (tidak bisa dibaca sama sekali oleh JS).
- **Akar masalah:** asumsi sebelumnya (tertulis di komentar kode) adalah GAS
  Web App "tidak pernah" mengirim header CORS pada POST, padahal akar
  masalah sebenarnya adalah **preflight OPTIONS** yang dipicu ketika
  `Content-Type` di-set ke `application/json`. Request di kode ini justru
  **tidak pernah** meng-set `Content-Type` secara eksplisit (body berupa
  string biasa), sehingga browser otomatis memakai
  `text/plain;charset=UTF-8` — inilah "simple request" yang **tidak memicu
  preflight**. `mode: "no-cors"` sebenarnya tidak diperlukan sama sekali di
  sini.
- **Perbaikan:** menghapus `mode: "no-cors"`, membaca `response.json()`, dan
  memakai `result.success` untuk menentukan sukses/gagal secara nyata
  (bukan optimistic-blind lagi).
- **⚠️ Perlu verifikasi:** bentuk response yang diharapkan
  (`{ success: true|false, message? }`) adalah **asumsi** berdasar pola umum
  REST, karena `code.gs` tidak tersedia di repo ini. Cek `doPost()` yang
  sesungguhnya dan sesuaikan pengecekan di `updateCandidateDataInSheet()`
  bila bentuknya berbeda. Lihat `docs/KNOWN_ISSUES.md` #1.

### 4. Bug: `currentScreeningIndex` adalah implicit global variable
- **File:** `index.html` (script inline)
- **Gejala:** tidak ada gejala yang terlihat pengguna saat ini (kebetulan
  masih berjalan karena script non-strict-mode), tapi rawan pecah kalau kode
  di-refactor ke ES module atau `'use strict'`.
- **Perbaikan:** dideklarasikan eksplisit dengan `let currentScreeningIndex = 0;`
  di samping deklarasi `globalCandidates` / `filteredScreeningList`.

### 5. Duplikasi kode: fungsi slicer didefinisikan dua kali
- **File:** `index.html` (script inline)
- **Gejala:** tidak ada bug fungsional yang terlihat (definisi kedua menimpa
  yang pertama secara diam-diam), tapi risiko tinggi menimbulkan bug "hantu"
  di masa depan bila salah satu salinan diedit sendirian.
- **Perbaikan:** `handleSlicerChange`, `updateSlicerSummary`, dan
  `initSlicerSummaries` masing-masing disisakan satu definisi. Panggilan
  ganda `initSlicerSummaries(); initSlicerSummaries();` saat inisialisasi
  juga dirapikan jadi satu panggilan.

### 6. Pembersihan minor: argumen tidak terpakai di shortcut keyboard
- **File:** `index.html` (script inline)
- Shortcut keyboard (←/→/Space) memanggil `handleScreeningAction(id, action,
  filteredScreeningList)` padahal fungsinya hanya menerima 2 parameter.
  Argumen ketiga dihapus supaya tidak menyesatkan pembaca kode berikutnya.

---

Untuk bug yang **belum** diperbaiki (butuh keputusan produk atau akses ke
`code.gs`), lihat `docs/KNOWN_ISSUES.md`.
