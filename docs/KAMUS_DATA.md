# Kamus Data Kandidat

Dikumpulkan dari komentar `// TEMUAN AUDIT:` yang sebelumnya tersebar di
beberapa file berbeda (`screening.js`, `pipeline.js`, `database.js`) jadi satu
referensi. **Sumber kebenarannya tetap `code.gs` (tidak ada di repo ini)** —
tabel di bawah adalah rekonstruksi dari sisi frontend, ada beberapa yang masih
berstatus DUGAAN (ditandai ⚠️).

| Field JS (`candidate.xxx`) | Kolom Google Sheet | Dipakai di | Catatan |
|---|---|---|---|
| `id` | (kolom ID, kolom A?) | Semua view | ID unik kandidat |
| `name` | Nama | Semua view | Fallback `'Tanpa Nama'` |
| `position` | Posisi dilamar | Semua view | Fallback `'Lainnya'`/`'-'` |
| `age` | Usia | Screening | Dipakai untuk filter rentang usia |
| `city` | **Kolom G "Alamat Lengkap"** | Screening (label "Domisili"), filter Domisili | ⚠️ Nama field `city` menyesatkan — isinya sebenarnya data dari kolom "Alamat Lengkap" |
| `fullAddress` | *(tidak pernah dikirim backend — lihat catatan)* | Screening (label "Alamat Lengkap", ditampilkan HANYA kalau beda dari `city`) | ⚠️ **Field ini kemungkinan besar TIDAK ADA di response backend saat ini.** Frontend sudah siap menerimanya (fallback ke `city` kalau kosong) tapi kalau mau section "Alamat Lengkap" benar-benar berguna, backend perlu ditambah untuk mengirim field terpisah ini |
| `phone` | No. WhatsApp | Screening, Pipeline (tombol WA), Database | Dinormalisasi ke format `08xxx` oleh `normalizePhoneNumber()` di `api.js`, dan ke `62xxx` lagi saat generate link `wa.me` di `pipeline.js` |
| `gender` | Gender | Screening, filter Gender | Nilai: `Pria` / `Wanita` |
| `lastEducation` / `education` | Pendidikan Terakhir | Screening, filter Pendidikan | Dua nama field dicoba (fallback), kemungkinan backend pernah ganti nama field ini |
| `score` | **Kolom J "Score"** | Screening (label "Skor Screening") | Format bisa pecahan (`0.85`) ATAU skala 0-100 (`85`) — `formatScoreAsPercentage()` di `screening.js` menangani keduanya |
| `screeningAwal` | **Kolom M "Screening Awal"** | Screening (progress badge), filter Progress | Nilai: `''` (kosong/belum), `SHORTLIST`, `REJECT`/`REJECTED`, `SKIP`. **Field ini SELALU ditulis** dari kartu screening (lihat `pushScreeningResultToSheet`) |
| `status` | **Kolom V "Status Hiring"** | Semua view, terutama Pipeline | Nilai: `RAW`, `SHORTLIST`, `WAITING_CV`, `REVIEW_CV`, `INTERVIEW`, `HIRED`, `REJECTED`. **TIDAK ditulis dari kartu Screening** (itu domain kolom M) — hanya diubah dari tab Pipeline |
| `experience` | Pengalaman/Keterangan | Screening | Fallback `'Tidak ada catatan'` |
| `cvLink` | **Kolom Q "Link CV"** | Screening, Pipeline | Kolom Sheet berisi formula `HYPERLINK()` dgn teks "Lihat CV" — Apps Script `getValues()` hanya baca teks tampilan, BUKAN URL asli di balik formula. Kosong/`"Belum Response"` = belum ada CV masuk |
| `cv` | *(sama dgn `cvLink`?)* | Database (SEBELUM diperbaiki) | ⚠️ **BUG YANG SUDAH DIPERBAIKI** — `database.js` dulu memakai nama field `cv` (tebakan developer sebelumnya), padahal 2 file lain pakai `cvLink`. Sekarang `database.js` prioritaskan `cvLink`, fallback ke `cv`. **Rekomendasi:** minta backend konsisten kirim `cvLink` saja, hapus kemungkinan pengiriman `cv` |
| `interviewDate` | (ditulis dari UI, kolom tanggal interview) | Pipeline | Diisi dari `<input type="date">` saat HR klik "Undang" |
| `isDuplicate` | *(computed di backend?)* | Screening (banner peringatan), Database (kolom "Aman"/"Duplikat") | ⚠️ Tidak ada kode frontend yang MENGHITUNG nilai ini — diasumsikan backend yang mengirim flag ini sudah dihitung. Kalau field ini selalu `undefined`/`false`, deteksi duplikat backend perlu dicek langsung |

## Pertanyaan Terbuka untuk Pemilik Backend (`code.gs`)

Kalau kamu (AI lain) diminta audit/perbaikan yang menyentuh backend, ini
daftar hal yang PERLU dikonfirmasi langsung dari `code.gs`, jangan ditebak:

1. Apakah response `action=getData` benar-benar mengirim field bernama
   `cvLink` (bukan `cv`)? — frontend sudah diperbaiki mengasumsikan `cvLink`
   sbg prioritas, tapi ini belum terverifikasi dari backend aslinya.
2. Apakah field `fullAddress` pernah/akan dikirim terpisah dari `city`? Kalau
   tidak pernah, section "Alamat Lengkap" di kartu Screening akan permanen
   tersembunyi (sudah ditangani, tidak akan menampilkan duplikat lagi).
3. Apakah `isDuplicate` benar-benar dihitung & dikirim oleh backend, dan
   dengan logika apa (nomor HP sama? nama sama?).
4. Bagaimana persisnya `doPost` di `code.gs` menangani action `updateStatus`
   — apakah field `updates` di-merge partial (hanya field yang dikirim yang
   berubah), atau overwrite seluruh baris? Ini penting karena frontend selalu
   mengirim update parsial (mis. `{ screeningAwal: 'SHORTLIST' }` saja, tanpa
   field lain).
