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

Field berikut **diasumsikan** dikirim oleh `code.gs` (disimpulkan dari
pemakaiannya di `js/*.js` + komentar audit yang sudah ada sebelumnya di kode).
**Belum diverifikasi langsung ke `code.gs`** karena file itu tidak ada di
repo — verifikasi ini masuk ke `docs/KNOWN_ISSUES.md`.

| Field JS         | Asal (dugaan)         | Dipakai di                          | Catatan |
|-------------------|-----------------------|--------------------------------------|---------|
| `id`               | Kolom ID               | semua                                 | |
| `name`              | Nama                   | semua                                  | |
| `position`           | Posisi dilamar          | semua                                   | |
| `phone`               | No. WhatsApp             | semua (dinormalisasi via `normalizePhoneNumber` saat dibutuhkan) | |
| `age`                  | Usia                      | screening, filter usia                 | |
| `gender`                | Gender                     | screening, filter gender                | |
| `city`                    | Kolom G "Alamat Lengkap"    | screening (fallback alamat), filter domisili | Lihat catatan di bawah — nama field **menyesatkan**. |
| `fullAddress`               | (kemungkinan tidak pernah dikirim backend) | screening, filter domisili (prioritas di atas `city`) | Selalu fallback ke `city` bila kosong. |
| `lastEducation` / `education` | Pendidikan terakhir | screening, filter pendidikan | Dua nama field dipakai bergantian (fallback ganda) — backend kemungkinan hanya kirim salah satu. |
| `score`                  | Kolom J "Score"            | screening (`formatScoreAsPercentage`)   | Diasumsikan pecahan (0–1) ATAU skala 0–100. |
| `screeningAwal`            | Kolom M "Screening Awal"     | screening (keputusan final Reject/Shortlist/Skip) | Domain: `''`, `SHORTLIST`, `REJECT`/`REJECTED`, `SKIP`. |
| `status`                     | Kolom V "Status Hiring"       | dashboard, pipeline, database              | Domain: `RAW`, `SHORTLIST`, `WAITING_CV`, `REVIEW_CV`, `INTERVIEW`, `HIRED`, `REJECTED`. |
| `cvLink`                       | Kolom Q "Link CV"                | screening, pipeline, database (**field benar** — lihat CHANGELOG) | Hasil `getValues()` atas sel dengan formula `HYPERLINK()` — GAS hanya membaca **teks tampilan**, bukan URL sebenarnya, kecuali teks tampilannya memang berupa URL. |
| `interviewDate`                  | Ditulis balik oleh app (`scheduleInterviewAction`) | pipeline | |
| `isDuplicate`                       | Deteksi duplikat di backend         | screening, database                        | |
| `experience`                          | Catatan pengalaman                    | screening                                    | |

### Catatan penting: `city` sebenarnya berarti "Alamat"

Komentar audit yang sudah ada di `js/screening.js` (baris terkait
`candidateAddress`) menyatakan `code.gs` **tidak pernah** mengirim
`fullAddress` — kolom G "Alamat Lengkap" di-mapping ke field `city`. Semua
fallback ganda (`c.fullAddress || c.city`) di kode ini sudah menangani hal
itu. **Jangan hapus fallback ini** kecuali `code.gs` sudah dipastikan
mengirim `fullAddress` sungguhan.

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
