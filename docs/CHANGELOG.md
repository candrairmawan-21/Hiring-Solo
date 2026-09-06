# Changelog

## [Revisi #2 — Dark Mode, Dashboard, Screening Stage, Pipeline, Database] — sesi ini

Sesi ini mempelajari langsung Google Sheet sumber (lihat `js/config.js` untuk
link & mapping kolom A-W) dan menindaklanjuti 6 permintaan perbaikan/penambahan.

### 1. Bug kontras dark mode: font & diagram sama-sama cerah
- **File:** `index.html` (CSS)
- **Akar masalah #1 (badge/label):** aturan CSS lama
  `body.theme-night span, th, td { color: inherit }` mewarisi warna terang
  kontainer (`--theme-text`, hampir putih) — ini menimpa PULUHAN badge status
  (Shortlist, Menunggu CV, Review, Interview, Hired, Rejected, dsb.) yang
  memakai kombinasi warna pastel Tailwind (mis. `bg-amber-100 text-amber-800`)
  yang didesain untuk latar TERANG. Karena latar pastelnya sendiri tidak ikut
  berubah gelap, hasilnya teks terang di atas latar terang.
  **Perbaikan:** ditambahkan ~15 aturan override dark-mode spesifik-kombinasi
  (mis. `.bg-amber-100.text-amber-800`) yang secara CSS specificity otomatis
  menang atas aturan lama, mengubah tiap badge jadi latar gelap bernuansa +
  teks terang senada (tetap mempertahankan makna warna semantiknya). Juga
  ditambahkan override untuk `.text-slate-600/700/800` (teks konten biasa
  yang sebelumnya jadi gelap-di-atas-gelap).
- **Akar masalah #2 (diagram distribusi posisi di Dashboard):** selector CSS
  lama `body.theme-night #dashboard-position-bars [class*="bg-"]` terlalu
  luas — mengecat baik **track** (latar penuh, `bg-slate-100`) MAUPUN
  **fill** (bar aktual sesuai persentase, `bg-blue-600`) dengan gradient
  neon yang SAMA PERSIS, sehingga track selalu terlihat 100% terisi warna
  apa pun persentase sebenarnya — persentase jadi tidak bisa dibaca sama
  sekali secara visual.
  **Perbaikan:** track dan fill sekarang diberi treatment terpisah — track
  dibuat redup/netral, fill tetap neon sesuai urutan posisi.

### 2. Dashboard: kartu metrik sekarang membaca kolom M & V, bukan cuma V
- **File:** `js/dashboard.js`
- **Sebelum:** "Shortlisted" hanya menghitung kandidat yang kolom V (Status
  Hiring)-nya sudah SHORTLIST/WAITING_CV/dst — kandidat yang di kolom M
  (Screening Awal) sudah SHORTLIST tapi belum "dipindah" ke kanban Pipeline
  (V masih kosong) tidak terhitung sama sekali.
- **Sesudah:** Total Pelamar = seluruh baris; **Shortlisted** = kolom M =
  SHORTLIST; **Masih Proses** = Shortlisted di atas yang V-nya belum
  HIRED/REJECTED; **Diterima** = kolom V = HIRED. Detail & alasan lengkap ada
  di `docs/ARCHITECTURE.md` § Logika Dashboard (ini keputusan interpretasi,
  boleh disesuaikan lagi bila maknanya berbeda dari yang dimaksud).

### 3. Screening card: tahapan kandidat, WA bisa di-copy, CV ditampilkan
- **File:** `js/screening.js`, fungsi baru `getCandidateStage()` &
  `stageToneClasses()` di `js/api.js`
- Ditambahkan fungsi `getCandidateStage(candidate)` yang membaca kombinasi
  kolom M–W (screening awal, reviewer, status kirim WA, CV, review CV,
  tanggal & hasil interview, remark, status hiring, store penempatan) untuk
  menyimpulkan tahapan kandidat saat ini secara manusiawi (mis. "WA
  Terkirim", "Review CV: Lolos Review", "Diterima (Hired) — Penempatan:
  Solo Baru"), dipakai untuk mengganti kotak "Status Hiring: RAW" yang
  sebelumnya tidak informatif.
- Nomor WhatsApp di kartu screening sekarang berupa tombol yang memanggil
  `copyWaLink()` (fungsi yang sama dipakai Database), bukan lagi teks statis
  yang tidak bisa diklik.
- Bagian tampilan CV ("CV Tersedia" + tombol "Lihat CV") **sudah ada
  sebelumnya** di kode ini dan tetap dipertahankan — tidak berubah.
- ⚠️ Field untuk kolom N/O/P/R/T/U/W masih ASUMSI (code.gs tidak tersedia) —
  lihat `docs/KNOWN_ISSUES.md` #3b.

### 4. Pipeline: bug salah kolom + hapus limit 50 kartu
- **File:** `js/pipeline.js`
- **Bug serius ditemukan:** logika lama memfilter kanban murni dari kolom V
  (`status`), dengan fallback default ke kolom "Shortlist (Belum WA)" untuk
  status apa pun yang tidak cocok — **termasuk status KOSONG**. Karena
  mayoritas baris nyata di sheet punya V kosong (termasuk yang di kolom M
  sudah REJECTED/SKIP), kolom "Shortlist (Belum WA)" jadi kebanjiran data
  yang sama sekali tidak relevan, sementara kandidat yang benar-benar baru
  shortlist tenggelam di antaranya.
  **Perbaikan:** gerbang masuk Kanban sekarang kolom M harus SHORTLIST dulu;
  sub-kolom (Menunggu Form/CV, Review, Interview, Hired) tetap dari kolom V.
  Body kartu (tombol "Chat WA", catatan "Menunggu CV", dst.) juga diganti
  mengikuti kolom tempat kartu diletakkan (bukan `c.status` mentah), karena
  sebelumnya kandidat shortlist dengan V kosong tidak mendapat tombol aksi
  apa pun (celah fungsional terpisah).
- Batas keras "maksimal 50 kartu per kolom" dihapus — sebelumnya kandidat
  ke-51 dst di kolom manapun disembunyikan diam-diam tanpa indikasi apa pun.

### 5. Database & Arsip: lebih banyak data, sortable, header sticky, kolom CV hilang
- **File:** `js/database.js`, `index.html`
- **Bug ditemukan:** header tabel (`<thead>`) di HTML statis cuma punya 5
  kolom, padahal `database.js` merender 6 kolom (Nama, Posisi, WA, **CV**,
  Status, Duplikat) — kolom CV tidak punya header sama sekali, membuat
  semua header di sebelah kanannya bergeser tidak sinkron dengan datanya.
  **Diperbaiki:** header `<th>CV</th>` ditambahkan.
- Jumlah baris per halaman naik dari tetap 25 menjadi bisa dipilih user
  (25/50/100/Semua) lewat dropdown baru di footer tabel.
- Ditambahkan filter dropdown Status (Semua/RAW/Shortlist/Menunggu
  CV/Review CV/Interview/Hired/Arsip).
- Header kolom Nama, Posisi, dan Status sekarang bisa diklik untuk mengurut
  (ascending/descending, dengan ikon panah).
- Header tabel dibuat `position: sticky` — kontainer tabel sekarang punya
  scroll vertikal sendiri (bukan mengandalkan scroll seluruh halaman)
  supaya header tetap terlihat saat menggulir banyak baris.
- Badge kolom Status sekarang memakai `getCandidateStage()` yang sama
  dengan Screening (satu sumber logika, bukan if/else terpisah yang
  berisiko tidak sinkron).

### 6. Google Sheet sumber sudah dipelajari
- Header kolom A-W dikonfirmasi langsung dari link Sheet yang diberikan
  (dicatat di `js/config.js` dan `docs/ARCHITECTURE.md`). Ini mengonfirmasi
  mapping field yang sudah benar (M, Q, S, V) sekaligus mengungkap field
  yang sebelumnya sama sekali tidak dipakai (N, O, P, R, T, U, W) — kini
  dipakai lewat `getCandidateStage()`.

---

## [Perbaikan Audit] — sesi sebelumnya

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
