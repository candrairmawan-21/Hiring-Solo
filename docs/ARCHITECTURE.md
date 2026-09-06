# Arsitektur & Kontrak Data

## Alur Umum

```
Browser (index.html + js/*.js)
   |  GET  ?action=getData          -> fetchCandidatesFromSheet()      [js/api.js]
   |  POST { action: "updateStatus", candidateId, updates }
   v
Google Apps Script Web App (code.gs — TIDAK ADA di repo ini)
   v
Google Sheet (sumber data utama / satu-satunya "database")
```

Tidak ada state management framework (React/Vue/dst). Semua state UI
disimpan di dua variabel global (dideklarasikan di `<script>` inline paling
bawah `index.html`):

- `globalCandidates` — array seluruh kandidat, hasil `fetchCandidatesFromSheet()`.
- `filteredScreeningList` — subset `globalCandidates` yang lolos filter slicer,
  khusus untuk antrean di tab Screening.
- `currentScreeningIndex` — index kandidat yang sedang tampil di kartu screening.
- `currentDatabasePage` (di `js/database.js`) — halaman aktif tabel Database.

Setiap tab (`switchTab()`) merender ulang dari `globalCandidates` yang sama —
**tidak ada fetch ulang per tab**, kecuali `loadAllData()` dipanggil manual
(saat load awal, atau lewat `refreshPipelineView()`).

## Pemetaan Field (Sheet -> objek kandidat JS)

**Update:** header kolom A-W di bawah ini sudah **dikonfirmasi langsung** dari
Google Sheet sumber (lihat tombol "Buka Google Sheet Master" di header app,
atau `js/config.js`). Nama *field JS* untuk kolom A-L, Q, S, V sudah
dipastikan benar dari kode yang ada. Nama field untuk kolom **N, O, P, R, T,
U, W masih ASUMSI** (belum ada `code.gs` untuk diverifikasi) — lihat catatan
di setiap baris dan di `docs/KNOWN_ISSUES.md`.

| Kolom | Header di Sheet | Field JS (dugaan bila belum pasti) | Dipakai di |
|---|---|---|---|
| A | Candidate ID | `id` | semua |
| B | Nama Lengkap | `name` | semua |
| C | *(kolom kosong/spacer di Sheet)* | — | — |
| D | Usia | `age` | screening, filter |
| E | Jenis Kelamin | `gender` | screening, filter |
| F | No HP | `phone` | semua (dinormalisasi via `normalizePhoneNumber`) |
| G | Alamat Lengkap | `city` (⚠️ nama field menyesatkan, lihat catatan di bawah), fallback `fullAddress` | screening, filter domisili |
| H | Pengalaman kerja | `experience` | screening |
| I | Posisi yang dilamar | `position` | semua |
| J | Score | `score` | screening (`formatScoreAsPercentage`) |
| K | Grade | *(belum dipakai di UI manapun)* | — |
| L | Date Submitted | *(belum dipakai di UI manapun)* | — |
| M | **Screening Awal** | `screeningAwal` | screening (keputusan Reject/Shortlist/Skip), dashboard (metrik), pipeline (gerbang masuk kanban) — domain: `''`, `SHORTLIST`, `REJECT`/`REJECTED`, `SKIP` (kapitalisasi tidak konsisten di data asli, semua perbandingan menormalkan ke UPPERCASE) |
| N | **Review by** (nama reviewer) | ⚠️ ASUMSI: `reviewedBy` / `reviewBy` / `reviewer` | `getCandidateStage()` di `js/api.js` (tahapan kandidat) |
| O | **Link WA** (link wa.me + pesan siap kirim, tampaknya sudah dibuat backend) | ⚠️ ASUMSI: `waLink` — **belum dipakai di UI manapun**, app membuat link WA-nya sendiri lewat `generateWhatsAppLink()` di `js/pipeline.js` alih-alih memakai link dari kolom ini | (belum dipakai) |
| P | **WA CV** (status kirim WA, nilai contoh: `Sent` / kosong) | ⚠️ ASUMSI: `waSent` / `waCv` | `getCandidateStage()` (deteksi tahap "WA Terkirim") |
| Q | **Link CV** (`Lihat CV` = hyperlink ke CV, `Belum Response` = belum isi form) | `cvLink` (**sudah dipastikan benar** — lihat CHANGELOG) | screening, pipeline, database, `getCandidateStage()` |
| R | **Review CV** (lolos/tidak untuk interview) | ⚠️ ASUMSI: `cvReview` / `reviewCv` | `getCandidateStage()` (tahap "Review CV: ...") |
| S | Tanggal Interview | `interviewDate` (**sudah dipastikan benar** — ditulis balik oleh `scheduleInterviewAction`) | pipeline, `getCandidateStage()` |
| T | **Hasil Interview** | ⚠️ ASUMSI: `interviewResult` / `hasilInterview` | `getCandidateStage()` (tahap "Hasil Interview: ...") |
| U | Remark | ⚠️ ASUMSI: `remark` | `getCandidateStage()` (detail tambahan) |
| V | **Status Hiring** | `status` (**sudah dipastikan benar**) | dashboard, pipeline, database, `getCandidateStage()` — domain: `''`/`RAW`, `SHORTLIST`, `WAITING_CV`, `REVIEW_CV`, `INTERVIEW`, `HIRED`, `REJECTED` |
| W | Store Penempatan | ⚠️ ASUMSI: `placementStore` / `storePenempatan` / `store` | `getCandidateStage()` (detail saat Hired) |
| — | Deteksi duplikat (dihitung backend?) | `isDuplicate` | screening, database |

Field dengan tanda ⚠️ ASUMSI memakai **fallback berlapis** di
`getCandidateStage()` (`js/api.js`) — mis. `c.reviewedBy || c.reviewBy ||
c.reviewer || c.n` — supaya tetap berfungsi (walau mungkin tidak lengkap)
sekalipun nama field aslinya sedikit berbeda dari dugaan ini. **Begitu
`code.gs` tersedia**, cocokkan nama field asli lalu perbarui daftar alias di
`getCandidateStage()` — lihat `docs/KNOWN_ISSUES.md` #1.

### Catatan penting: `city` sebenarnya berarti "Alamat"

Komentar audit yang sudah ada di `js/screening.js` (baris terkait
`candidateAddress`) menyatakan `code.gs` **tidak pernah** mengirim
`fullAddress` — kolom G "Alamat Lengkap" di-mapping ke field `city`. Semua
fallback ganda (`c.fullAddress || c.city`) di kode ini sudah menangani hal
itu. **Jangan hapus fallback ini** kecuali `code.gs` sudah dipastikan
mengirim `fullAddress` sungguhan.

### Fungsi bersama: `getCandidateStage(candidate)` (di `js/api.js`)

Ditambahkan untuk menjawab kebutuhan "kandidat ini sudah sampai tahapan
mana?" dengan membaca kombinasi kolom M sampai W sekaligus (bukan cuma satu
kolom `status`). Dipakai oleh:
- **Screening card** (`js/screening.js`) — badge "Tahapan Saat Ini".
- **Database & Arsip** (`js/database.js`) — badge kolom "Status" (menggantikan
  if/else manual yang sebelumnya terpisah dan berisiko tidak sinkron).

Mengembalikan `{ step, tone, label, detail }` — `tone` dipetakan ke kombinasi
class Tailwind lewat `stageToneClasses(tone)`, sengaja memakai kombinasi yang
SUDAH punya override kontras dark-mode (lihat `docs/CHANGELOG.md` bug #1),
supaya badge tahapan otomatis ikut terbaca jelas di dark mode.

## Kontrak API

### `GET {API_URL}?action=getData`

- Tidak memicu CORS preflight (GET selalu "simple request").
- Response: **array JSON** objek kandidat (lihat tabel field di atas).
- Client: `fetchCandidatesFromSheet()` di `js/api.js`.

### `POST {API_URL}` — body `{ action: "updateStatus", candidateId, updates }`

- **PERBAIKAN (lihat CHANGELOG):** request ini TIDAK menge-set header
  `Content-Type` secara eksplisit, sehingga browser otomatis memakai
  `text/plain;charset=UTF-8` untuk body string — ini "simple request" yang
  **tidak memicu preflight OPTIONS**. Karena itu `mode: "no-cors"` yang
  dipakai sebelumnya **tidak diperlukan** dan malah menyembunyikan response
  asli dari client.
- Client sekarang **mengharapkan** response JSON berbentuk:
  ```json
  { "success": true }
  ```
  atau saat gagal:
  ```json
  { "success": false, "message": "alasan gagal" }
  ```
  **Asumsi ini WAJIB diverifikasi** terhadap `doPost()` di `code.gs` yang
  sebenarnya. Jika `code.gs` mengembalikan bentuk lain (mis. tidak ada field
  `success`), maka `updateCandidateDataInSheet()` di `js/api.js` akan selalu
  menganggap gagal walau sebenarnya sukses — sesuaikan pengecekan
  `result.success` di sana agar cocok dengan bentuk response backend yang
  sesungguhnya.
- `updates` adalah object partial, mis. `{ status: 'HIRED' }` atau
  `{ screeningAwal: 'SHORTLIST' }` atau
  `{ status: 'INTERVIEW', interviewDate: '2026-09-10' }`.

## Logika Dashboard (kolom M & V)

`renderDashboardMetrics()` (`js/dashboard.js`) menghitung 4 kartu metrik dari
**seluruh isi `globalCandidates`** (bukan subset yang difilter):

- **Total Pelamar** = jumlah seluruh baris di sheet.
- **Shortlisted** = jumlah kandidat dengan kolom **M** (`screeningAwal`) =
  `SHORTLIST` — terlepas dari kolom V sudah diisi atau belum.
- **Masih Proses** = subset Shortlisted di atas yang kolom **V** (`status`)
  **belum** `HIRED` dan **belum** `REJECTED` (masih berjalan di tahap
  manapun: belum WA, menunggu CV, review, atau interview).
- **Diterima** = jumlah kandidat dengan kolom **V** (`status`) = `HIRED`.

Ini adalah **keputusan desain** hasil interpretasi permintaan user terhadap
makna kolom M & V — bukan sesuatu yang bisa "salah/benar" secara teknis,
tapi bisa saja perlu disesuaikan lagi kalau ternyata maknanya berbeda dari
yang dimaksud pemilik proses rekrutmen. Ubah langsung di
`renderDashboardMetrics()` bila perlu, dan perbarui bagian ini.

## Logika Pipeline / Kanban (gerbang masuk & sub-tahap)

**PERBAIKAN PENTING** (lihat `docs/CHANGELOG.md`): sebelumnya `renderKanbanBoard()`
(`js/pipeline.js`) memakai kolom **V** (`status`) sebagai satu-satunya
penentu kolom kanban, dengan fallback ke kolom "Shortlist (Belum WA)" untuk
status apa pun yang tidak cocok — **termasuk status kosong**. Karena
mayoritas baris di sheet nyata memang punya kolom V kosong (V baru diisi
manual lewat tombol di app ini), efeknya SEMUA kandidat dengan V kosong —
termasuk yang sudah REJECTED/SKIP di kolom M — ikut masuk ke kolom
Shortlist, membanjiri kolom itu dengan data yang tidak relevan.

Sekarang gerbang masuk Kanban adalah kolom **M** (`screeningAwal` harus
`SHORTLIST`); sub-kolom (Menunggu Form/CV, Review CV, Interview, Hired)
ditentukan dari kolom **V** seperti sebelumnya, dengan V kosong pada
kandidat SHORTLIST otomatis masuk sub-kolom "Shortlist (Belum WA)" (makna
aslinya). Kandidat dengan V = `REJECTED` dikeluarkan dari Kanban (dianggap
sudah final, cukup terlihat di Database & Arsip).

## Pola UI: Optimistic Update

Hampir semua aksi (`updateStatusToWaiting`, `scheduleInterviewAction`,
`processInterviewResult`, `handleScreeningAction`) mengubah `globalCandidates`
**secara lokal terlebih dahulu**, me-render ulang UI, baru kemudian mengirim
perubahan ke backend di latar belakang (`await updateCandidateDataInSheet(...)`
dipanggil tapi hasilnya tidak selalu dipakai untuk membatalkan perubahan
lokal jika gagal). Ini pilihan desain sadar (UI tetap responsif), bukan bug —
tapi berarti **jika backend menolak**, state lokal & Sheet bisa jadi tidak
sinkron sampai `loadAllData()` dipanggil ulang (reload halaman). Lihat
`docs/KNOWN_ISSUES.md` untuk saran perbaikan (mis. rollback otomatis saat
`result.success === false`).
