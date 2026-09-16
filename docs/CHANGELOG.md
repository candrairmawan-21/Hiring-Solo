# Changelog

## ⚠️ KOREKSI PENTING atas entri "Revisi #2" di versi dokumen sebelumnya

Sesi audit ini ("Revisi #3" di bawah) memverifikasi **langsung ke kode** setiap
klaim yang tertulis di entri "Revisi #2" pada versi CHANGELOG sebelumnya (dan di
`docs/TASKS.md` yang mencentangnya sebagai selesai). Hasilnya:

**Sebagian besar klaim "Revisi #2" TIDAK ADA di kode.** Dokumen itu ditulis
seolah pekerjaan sudah selesai, tetapi file `.js`/`.html`-nya tidak pernah
benar-benar diubah. Yang diverifikasi TIDAK ADA saat audit ini dimulai:

| Klaim di "Revisi #2" | Kondisi nyata di kode |
|---|---|
| `getCandidateStage()` & `stageToneClasses()` di `js/api.js` | **Tidak ada.** Kedua fungsi tidak terdefinisi di file manapun |
| Dashboard membaca kolom M & V | **Tidak.** `js/dashboard.js` hanya membaca `c.status` (kolom V) |
| Nomor WA di kartu screening jadi tombol `copyWaLink()` | **Tidak.** Masih teks statis; `copyWaLink` sendiri tidak terdefinisi |
| Pipeline: gerbang kanban pakai kolom M | **Tidak.** Masih murni `c.status` + fallback default ke kolom Shortlist |
| Pipeline: limit 50 kartu/kolom dihapus | **Tidak.** `if (counts[targetColKey] >= 50) return;` masih ada |
| Database: header `<th>CV</th>` ditambahkan | **Tidak.** `<thead>` masih 5 kolom vs 6 sel/baris di `database.js` |
| Database: sortable, filter status, baris/halaman dinamis | **Tidak ada satu pun** |
| Badge status Database pakai `getCandidateStage()` | **Tidak.** Masih rantai if/else lokal |

Selain itu, perbaikan paling kritis dari sesi audit SEBELUM "Revisi #2" —
validasi bentuk response di `fetchCandidatesFromSheet()` beserta guard
`Array.isArray` di render function — juga **hilang/ter-regresi**.

**Pelajaran untuk sesi berikutnya:** jangan percaya CHANGELOG/TASKS sebagai
status sebenarnya. **Selalu `grep` ke kode** untuk memverifikasi sebuah
perbaikan benar-benar ada. Lihat `docs/AGENT_GUIDE.md` § Cara Cepat Verifikasi.

---

## [Revisi #3 — Audit + Perbaikan Terverifikasi Playwright] — sesi ini

Semua perbaikan di bawah **diverifikasi menjalankan aplikasi di browser asli
(Chromium via Playwright)** dengan data mock realistis, bukan hanya dibaca
statis. Setiap item punya root cause yang dikonfirmasi lewat reproduksi.

### 1. [KRITIS] Seluruh aplikasi crash kalau backend membalas objek, bukan array
- **File:** `js/api.js`
- **Gejala:** Dashboard/Pipeline/Database blank atau error; dilaporkan user
  sebagai "dashboard error".
- **Akar masalah:** `fetchCandidatesFromSheet()` mengembalikan response apa pun
  mentah-mentah tanpa validasi bentuk. Begitu backend membalas objek — pola
  umum `{success:true, data:[...]}` atau objek error `{error:"..."}` —
  `globalCandidates` jadi bukan array dan SEMUA render function crash saat
  memanggil `.filter()`/`.forEach()`. Direproduksi dengan 3 bentuk response
  berbeda via Playwright.
- **Perbaikan:** response divalidasi & dinormalisasi di **satu tempat** ini:
  array dipakai langsung; objek pembungkus (`data`/`candidates`/`result`/`rows`)
  di-unwrap; objek error ditampilkan pesan aslinya lewat toast; bentuk tak
  dikenal jadi array kosong + pesan jelas. File lain kini aman mengasumsikan
  `globalCandidates` selalu array.
- **Pertahanan kedua:** guard `Array.isArray` di `renderDashboardMetrics`,
  `renderKanbanBoard`, `renderDatabaseTable`, dan `initScreeningQueue`.

### 2. [KRITIS] Kartu metrik Dashboard menampilkan angka salah
- **File:** `js/dashboard.js`
- **Gejala:** Total Pelamar 5.420 tapi Shortlisted 1, Dalam Proses 1, Hired 0 —
  padahal diagram distribusi posisi (sumber data sama) menampilkan ribuan.
- **Akar masalah:** metrik hanya membaca kolom V (`c.status`). Keputusan
  Shortlist dari tab Screening ditulis ke kolom **M** (`screeningAwal`); kolom V
  baru terisi setelah diproses di Pipeline. Kandidat sudah Shortlist tapi belum
  di-WA (V kosong) tidak terhitung sama sekali.
- **Perbaikan:** metrik dihitung lewat `getCandidateStage()` (kolom M + V).
  Verifikasi: 8 kandidat mock -> Total 8, Shortlisted 5, Proses 4, Hired 1 OK

### 3. [KRITIS] Antrean Screening SELALU kosong ("Antrean Selesai!")
- **File:** `index.html` (`initScreeningQueue`)
- **Akar masalah:** filter mengharuskan kolom V berisi **tepat** string `"RAW"`.
  Di Sheet nyata, kandidat baru punya kolom V **kosong** — bukan `"RAW"` —
  sehingga semua kandidat baru tersaring habis.
- **Perbaikan:** memakai `getCandidateStage()` yang menganggap V kosong + M
  kosong sebagai tahap RAW. Kandidat bertahap SKIP juga muncul kembali (sesuai
  makna "lewati sementara").

### 4. Logo MR.DIY pecah/tidak muncul
- **File:** `index.html`
- **Akar masalah:** string base64 PNG-nya **corrupt** — panjang 17.579 karakter
  (sisa modulo 4 = 3), mustahil di-decode browser. Kemungkinan ter-truncate saat
  pengeditan file di sesi sebelumnya.
- **Perbaikan:** diganti mark **SVG inline** berbasis teks (wordmark merah
  MR.DIY). Tidak bisa corrupt lagi & tidak bergantung data eksternal.

### 5. Warna diagram "Distribusi Peminat Posisi" tidak sesuai
- **File:** `index.html` (CSS), `js/dashboard.js`
- **Akar masalah:** 16 aturan CSS memakai selector terlalu luas
  `#dashboard-position-bars > div:nth-child(N) [class*="bg-"]`. Selector itu
  mengenai **dua** elemen per baris: TRACK (latar penuh `bg-slate-100`) DAN FILL
  (bar sesuai persentase `bg-blue-600`) — keduanya dicat gradient neon yang
  sama. Akibatnya setiap bar tampak terisi 100% berapa pun persentase
  sebenarnya (30%, 29%, 19%, 2%, 1% semua tampak penuh).
- **Perbaikan:** `js/dashboard.js` menandai kedua elemen dengan `.js-bar-track`
  dan `.js-bar-fill`; 16 selector lama diarahkan ulang ke `.js-bar-fill` saja;
  blok override final mewarnai track redup/netral & fill skala tunggal
  biru->cyan sesuai peringkat (konsisten Day & Night, bukan acak).
  Verifikasi Night: track `rgba(12,29,43,.85)`, fill `rgb(34,211,238)` OK

### 6. Tombol copy nomor WhatsApp hilang di Screening Card
- **File:** `js/api.js`, `js/screening.js`
- **Akar masalah:** fitur ini memang belum pernah ada di kartu Screening; dan
  `copyWaLink()` yang dipanggil `js/database.js` **tidak terdefinisi di file
  manapun** (tombol WA di Database selalu error di console tanpa efek).
- **Perbaikan:** `copyWaLink()` didefinisikan di `js/api.js` (dipakai bersama
  Database, Screening, Pipeline) dengan fallback `execCommand('copy')` untuk
  browser/konteks non-HTTPS. Nomor WA di kartu Screening kini berupa tombol.

### 7. Fitur tambahan untuk kandidat yang sudah shortlist
- **File:** `js/screening.js`
- Kotak "Status Hiring: RAW" yang tidak informatif diganti badge **"Tahapan
  Saat Ini"** dari `getCandidateStage()` (mis. "Menunggu CV — Menunggu isi form
  & upload CV").
- **Panel aksi lanjutan** muncul untuk kandidat yang sudah lolos screening awal:
  Chat WA & Kirim Form (sekaligus memajukan status ke WAITING_CV lewat
  `advanceShortlistedToWaiting()`), Copy Link WA, dan Buka di Pipeline.

### 8. Data Pipeline tidak lengkap
- **File:** `js/pipeline.js`
- **Akar masalah A:** filter kanban murni dari kolom V, dengan fallback default
  ke kolom "Shortlist (Belum WA)" untuk status apa pun yang tidak cocok —
  **termasuk kosong**. Karena mayoritas baris nyata punya V kosong (termasuk
  yang di kolom M sudah REJECT/SKIP), kolom Shortlist kebanjiran data tidak
  relevan sementara kandidat yang benar-benar baru shortlist tenggelam.
- **Akar masalah B:** batas keras `if (counts[col] >= 50) return;` — kandidat
  ke-51 dst di kolom manapun disembunyikan **diam-diam** tanpa indikasi apa pun.
- **Akar masalah C:** body kartu memakai `c.status` mentah, sehingga kandidat
  shortlist dengan V kosong tidak mendapat tombol aksi apa pun (mustahil
  diproses dari UI).
- **Perbaikan:** gerbang & penempatan kolom pakai `getCandidateStage()`; limit
  50 dihapus (performa tetap aman karena HTML disusun sebagai string lalu
  di-inject sekali); body kartu mengikuti kolom tempat kartu diletakkan.
- **Fitur baru:** tombol "CV Sudah Masuk" (`markCvReceived()`) di kolom Menunggu
  CV — sebelumnya kolom itu tidak punya aksi apa pun, sehingga memajukan
  kandidat ke Review hanya bisa lewat edit manual di Sheet. Tombol "Copy Link
  WA" juga ditambahkan di kolom Shortlist.

### 9. Data Database tidak lengkap & kolom bergeser
- **File:** `index.html`, `js/database.js`
- **Akar masalah:** `<thead>` hanya punya **5** `<th>` sementara `database.js`
  merender **6** `<td>` per baris (Nama, Posisi, WA, **CV**, Status, Duplikat) —
  kolom CV tidak punya header, membuat semua header di kanannya tidak sinkron
  dengan datanya.
- **Perbaikan:** `<th>CV</th>` ditambahkan (verifikasi: 6 header = 6 sel OK).
- Badge Status kini pakai `getCandidateStage()` (sebelumnya rantai if/else lokal
  yang hanya baca kolom V -> kandidat shortlist tampil "Baru / RAW").
- **Fitur baru:** filter dropdown Tahapan (9 opsi), header Nama/Posisi/Status
  bisa diklik untuk mengurut (dengan ikon panah), pilihan baris per halaman
  (25/50/100/Semua).
- **Performa:** render baris diubah dari `tbody.innerHTML +=` di dalam loop
  (memaksa browser re-parse seluruh tabel setiap baris) menjadi satu kali inject
  setelah string tersusun.

### 10. POST ke backend: strategi hybrid
- **File:** `js/api.js`
- `updateCandidateDataInSheet()` kini mencoba dulu POST **tanpa** `no-cors`
  supaya response backend bisa dibaca (dapat konfirmasi sukses/gagal
  sesungguhnya); kalau gagal, **fallback** ke `no-cors` (perilaku lama yang
  sudah terbukti menyimpan data, hanya responsnya tak terbaca). Konservatif
  secara sengaja: kalau asumsi CORS ternyata salah untuk backend ini, aksi tetap
  tersimpan alih-alih benar-benar gagal.
- Masih **belum terverifikasi** terhadap `code.gs` asli (tidak ada di repo) —
  lihat `docs/KNOWN_ISSUES.md` #1.

### Catatan cakupan `getCandidateStage()`
Fungsi ini **sengaja hanya memakai kolom yang sudah terverifikasi** (M, Q, S, V).
Kolom N/O/P/R/T/U/W (Review by, Link WA, WA CV, Review CV, Hasil Interview,
Remark, Store Penempatan) **tidak** ditebak nama field-nya, karena `code.gs`
tidak tersedia dan field salah tebak berisiko menampilkan info keliru secara
diam-diam. Begitu `code.gs` tersedia, kolom itu bisa ditambahkan — lihat
`docs/KNOWN_ISSUES.md` #3b.

### Hasil verifikasi akhir (Playwright, Chromium)
Load awal, klik keempat tab, aksi Shortlist di Screening, copy WA, "CV Sudah
Masuk", jadwalkan interview, search + filter status + sort + ubah baris/halaman
di Database, ganti tema Day/Night: **semua PASS, 0 error console**.
Syntax check (`node --check`) semua file `.js` + script inline: **lolos**.

---

## [Perbaikan Audit] — sesi-sesi sebelumnya

Entri lama dipertahankan sebagai riwayat. Beberapa di antaranya **sempat
ter-regresi** dan baru dipulihkan di Revisi #3 (lihat tabel koreksi di atas).

### 1. Bug: tombol WA di Database selalu error (`copyWaLink is not defined`)
`onclick="copyWaLink(...)"` dipanggil di markup tapi fungsinya tidak pernah
didefinisikan. -> Dipulihkan & diperbaiki di Revisi #3 item 6.

### 2. Bug: tombol "Buka CV" di Database selalu tampil "Kosong"
`database.js` membaca `c.cv`, padahal field yang benar (dipakai konsisten oleh
`screening.js` & `pipeline.js`) adalah `c.cvLink`. -> Diperbaiki dengan
`c.cvLink || c.cv`; masih ada di kode saat ini.

### 3. Bug: `currentScreeningIndex` adalah implicit global variable
Dideklarasikan eksplisit `let currentScreeningIndex = 0;`. -> Masih ada.

### 4. Duplikasi kode: fungsi slicer didefinisikan dua kali
`handleSlicerChange`, `updateSlicerSummary`, `initSlicerSummaries` masing-masing
disisakan satu definisi. -> Masih rapi di kode saat ini.

### 5. Auto-refresh berkala 30 detik
Badge "LIVE - SHEET SYNC" sebelumnya murni dekoratif (data hanya di-fetch sekali
saat load). Ditambahkan `setInterval` 30 detik yang re-fetch & re-render
Dashboard/Pipeline/Database — tab Screening sengaja dikecualikan supaya tidak
mengganggu antrean swipe yang berjalan. -> Masih ada di kode saat ini.

### 6. Pembersihan minor: argumen tidak terpakai di shortcut keyboard
Shortcut (kiri/kanan/Space) memanggil `handleScreeningAction(id, action, list)`
padahal fungsinya hanya menerima 2 parameter; argumen ketiga dihapus.

---

Untuk bug yang **belum** diperbaiki (butuh keputusan produk atau akses ke
`code.gs`), lihat `docs/KNOWN_ISSUES.md`.
