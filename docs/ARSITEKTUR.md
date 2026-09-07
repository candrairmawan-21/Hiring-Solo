# Arsitektur & Struktur File

## Daftar File

```
index.html          (2700+ baris — HTML + SEMUA CSS inline + script inisialisasi app)
js/config.js         (9 baris   — 1 konstanta: CONFIG.API_URL)
js/api.js             (71 baris — komunikasi fetch ke Google Apps Script)
js/dashboard.js       (60 baris — render metrik & bar distribusi posisi)
js/screening.js      (312 baris — render kartu swipe + aksi Reject/Skip/Shortlist)
js/pipeline.js       (186 baris — render papan status + aksi lanjutan tiap tahap)
js/database.js       (150 baris — tabel arsip + pencarian + pagination)
```

Tidak ada `package.json`, tidak ada build tool, tidak ada framework JS (React/Vue/
dll). Semua di-load via `<script src="js/....js">` biasa di akhir `<body>`, dan
saling bergantung lewat **variabel & fungsi global** (bukan modul/import-export).

**Urutan pemuatan script penting** (lihat akhir `index.html`):
```html
<script src="js/config.js"></script>      <!-- harus pertama: CONFIG dipakai file lain -->
<script src="js/api.js"></script>          <!-- harus sebelum screening.js/pipeline.js -->
<script src="js/screening.js"></script>
<script src="js/pipeline.js"></script>
<script src="js/dashboard.js"></script>
<script src="js/database.js"></script>
<script> ... script inline (state global, switchTab, filter, init) ... </script>
```
Kalau menambah file JS baru yang butuh `CONFIG` atau `updateCandidateDataInSheet`,
taruh `<script>`-nya SETELAH `config.js`/`api.js`.

## Variabel Global Kunci (dideklarasikan di `<script>` inline paling akhir)

| Variabel | Isi | Di-set ulang di |
|---|---|---|
| `globalCandidates` | Array SEMUA kandidat, hasil `fetchCandidatesFromSheet()` | `loadAllData()` |
| `filteredScreeningList` | Subset `globalCandidates` yang lolos filter slicer screening | `initScreeningQueue()` |
| `currentScreeningIndex` | Posisi kartu yang sedang tampil di antrean screening | `initScreeningQueue()` (reset ke 0), `handleScreeningAction()` (increment) |
| `currentDatabasePage` | Halaman aktif tabel Database (deklarasi di `js/database.js`) | `changeDatabasePage()`, `handleDatabaseSearch()` |

**PENTING:** tidak ada satu "source of truth" objek app-state — semua variabel
di atas lepas (global scope), diakses langsung oleh nama dari file manapun.
Kalau menambah fitur baru yang butuh state, ikuti pola yang sama (deklarasi
`let` di blok `<script>` inline, bukan bikin sistem state management baru)
supaya konsisten dengan gaya kode yang ada.

## Alur Data (Read)

```
window.onload
  → loadAllData()
      → globalCandidates = await fetchCandidatesFromSheet()   [js/api.js]
          → GET {API_URL}?action=getData
      → render view yang sedang aktif (default: switchTab('screening'))
```

**Auto-refresh:** ada `setInterval` 30 detik yang memanggil ulang `loadAllData()`
—  TAPI di-skip kalau tab **Screening** sedang aktif (supaya tidak mengganggu
antrean swipe yang sedang berjalan). Dashboard/Pipeline/Database di-refresh
otomatis; Screening hanya refresh saat user masuk/keluar tab tersebut.

**Tidak ada refresh saat pindah tab** — `switchTab()` hanya me-render ulang
data yang SUDAH ADA di `globalCandidates` (memori), tidak fetch ulang. Fetch
ulang hanya terjadi lewat `loadAllData()` (saat load awal / auto-refresh 30
detik / setelah aksi tertentu).

## Alur Data (Write)

Semua penulisan lewat `updateCandidateDataInSheet(candidateId, updates)`
[`js/api.js`] → `POST {API_URL}` dengan `mode: "no-cors"`.

⚠️ **Batasan penting:** karena `mode: "no-cors"`, response dari backend **TIDAK
BISA DIBACA SAMA SEKALI** oleh JS (ini batasan platform Google Apps Script Web
App yang tidak mengirim header CORS pada POST — bukan bug yang bisa diperbaiki
dari sisi frontend). Konsekuensinya:
- Semua penulisan bersifat **optimistic**: UI langsung dianggap berhasil kalau
  `fetch()` tidak melempar network error, TANPA benar-benar mengonfirmasi
  backend menyimpan dengan sukses.
- Update ke UI (state lokal `globalCandidates`) dilakukan **duluan**, baru
  kirim ke backend di belakang layar (lihat pola di `pipeline.js`:
  `updateStatusToWaiting`, `scheduleInterviewAction`, `processInterviewResult`).
- Kalau backend sebenarnya gagal (mis. `candidateId` tidak ditemukan di Sheet),
  **user tidak akan tahu dari UI** — perlu cek manual ke Google Sheet sesekali.

Ini adalah **trade-off yang disengaja dan sudah didokumentasikan di kode**
(lihat komentar panjang di `js/api.js`), bukan sesuatu yang perlu "diperbaiki"
kecuali arsitektur backend diganti total (mis. pindah dari GAS ke backend yang
support CORS penuh).

## 4 Tampilan (Views)

| View (`#view-*`) | File render utama | Catatan |
|---|---|---|
| `view-dashboard` | `js/dashboard.js` → `renderDashboardMetrics()` | Statistik murni, tidak ada state sendiri |
| `view-screening` | `js/screening.js` → `renderScreeningCard()` | Kartu swipe 1-per-1, ada keyboard shortcut (←/→/Space) |
| `view-pipeline` | `js/pipeline.js` → `renderKanbanBoard()` | **BUKAN drag-drop** — murni tombol per status, dibatasi 50 kartu/kolom demi performa |
| `view-database` | `js/database.js` → `renderDatabaseTable()` | Search + pagination 25 baris/halaman |

## Status Kandidat (field `status`, kolom V di Sheet)

Alur linear (tidak ada jalur mundur otomatis di UI):
```
RAW → SHORTLIST → WAITING_CV → REVIEW_CV → INTERVIEW → HIRED
                                                       └→ REJECTED
```
`REJECTED` bisa terjadi dari tahap Screening (langsung dari `RAW`) ATAU dari
hasil Interview. Kandidat `RAW`/`REJECTED` **tidak muncul** di papan Pipeline
(sengaja di-filter, lihat `pipeline.js` baris ~40).

## Sistem Tema (Day/Night)

CSS murni + `localStorage` (`recruitment-theme`), tidak menyentuh logika data
sama sekali. Kalau ada bug visual, cek `index.html` bagian `<style id="...">`
(ada 5 blok style bertumpuk, urutannya penting karena pakai `!important`
bertingkat) — bukan di file `js/`.
