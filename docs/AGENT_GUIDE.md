# Panduan untuk AI / Developer yang Melanjutkan Proyek Ini

Proyek ini kemungkinan akan dikerjakan bergantian oleh beberapa sesi AI
(Claude, ChatGPT, dst.) atau developer berbeda. Dokumen ini adalah "kontrak"
supaya setiap sesi baru bisa langsung produktif tanpa membaca ulang seluruh
kode dari nol, dan supaya perbaikan satu sesi tidak ditimpa/dikontradiksi
sesi berikutnya.

## Sebelum Mulai Mengerjakan Apa pun

1. Baca `README.md` (gambaran umum) dan `docs/ARCHITECTURE.md` (kontrak data).
2. Baca `docs/KNOWN_ISSUES.md` — cek apakah yang ingin kamu kerjakan sudah
   tercatat di sana (mungkin sudah ada analisis akar masalahnya).
3. Baca `docs/CHANGELOG.md` — supaya tidak mengerjakan ulang / membalikkan
   perbaikan yang sudah dilakukan sesi sebelumnya.
4. Cek `docs/TASKS.md` untuk backlog yang sudah disusun.

## Aturan Kerja

- **Selalu update dokumentasi di commit/PR yang sama** dengan perubahan kode:
  - Bug baru ditemukan → tambahkan ke `docs/KNOWN_ISSUES.md` (atau pindahkan
    ke `docs/CHANGELOG.md` jika langsung diperbaiki).
  - Field data baru / berubah maknanya → update tabel di
    `docs/ARCHITECTURE.md`.
  - Tugas selesai → centang / hapus dari `docs/TASKS.md`, tugas baru yang
    kamu temukan → tambahkan ke sana.
- **Jangan menghapus komentar "PERBAIKAN" atau "TEMUAN AUDIT"** di dalam kode
  tanpa memindahkan intinya ke dokumentasi terlebih dahulu — komentar itu
  sering berisi konteks penting (kenapa sebuah workaround ada) yang tidak
  jelas dari kode itu sendiri.
- **File `code.gs` (backend) tidak ada di repo ini.** Jika kamu punya akses
  ke sana (mis. user menempelkannya di chat), tuliskan ringkasannya di
  `docs/ARCHITECTURE.md` bagian kontrak API, supaya sesi berikutnya tidak
  perlu menebak-nebak lagi.
- **Jangan duplikasi logika "tahapan kandidat"** dengan menulis if/else baru
  berdasar kolom M-W di file lain. Pakai/lengkapi `getCandidateStage()` di
  `js/api.js` (satu sumber logika, sudah dipakai Screening & Database) —
  lihat `docs/ARCHITECTURE.md` § Fungsi bersama.
- Sebelum mengubah **nama field data** (`cvLink`, `city`, `screeningAwal`,
  dst.), cek dulu semua tempat field itu dipakai — field yang sama sengaja
  dipakai konsisten lintas `screening.js`, `pipeline.js`, `database.js`.
  Riwayat bug `cv` vs `cvLink` (lihat CHANGELOG) terjadi justru karena satu
  file memakai nama field yang berbeda dari file lain.
- Selalu cek konsistensi `onclick="..."` / `onchange="..."` di `index.html`
  terhadap fungsi yang benar-benar didefinisikan di `js/*.js` — bug
  `copyWaLink` yang hilang (lihat CHANGELOG) tidak terdeteksi lama karena
  tidak ada proses build/linting yang memvalidasi ini secara otomatis.

## Cara Cepat Verifikasi Perubahan (Tidak Ada Build Step)

Karena tidak ada bundler/test runner, minimal lakukan ini sebelum
menyerahkan hasil kerja:

```bash
# Validasi sintaks setiap file JS
for f in js/*.js; do node -c "$f" || echo "SYNTAX ERROR: $f"; done

# Cek semua fungsi yang dipanggil lewat onclick/onchange/oninput benar-benar ada
grep -oE '(onclick|onchange|oninput)="[a-zA-Z_]+\(' index.html js/*.js \
  | sed -E 's/.*="//; s/\($//' | sort -u
# lalu pastikan setiap nama fungsi hasil grep di atas benar-benar
# didefinisikan (grep -n "function namaFungsi" index.html js/*.js)
```

Idealnya buka juga `index.html` di browser sungguhan dan cek Console (F12) —
banyak bug di proyek ini (fungsi hilang, field salah) hanya kelihatan lewat
`console.error` di runtime, bukan lewat pembacaan kode statis.

## Batasan Lingkungan yang Perlu Diingat

- **Google Apps Script Web App** punya keterbatasan CORS khusus (preflight
  OPTIONS tidak ditangani) — lihat penjelasan lengkap & fix-nya di
  `docs/ARCHITECTURE.md` § Kontrak API dan komentar di `js/api.js`. **Jangan**
  menambahkan header custom (mis. `Content-Type: application/json`) ke
  request POST ke GAS tanpa memahami konsekuensi preflight ini.
- Tailwind dimuat lewat CDN (`cdn.tailwindcss.com`) — cocok untuk prototipe,
  **tidak ideal untuk produksi** (tidak ada purge CSS, tergantung koneksi ke
  CDN). Kalau proyek ini naik skala, pertimbangkan build Tailwind lokal —
  tapi ini keputusan produk, catat di `docs/TASKS.md`, jangan diubah sepihak.
- Tidak ada test otomatis. Kandidat menyempurnakan ini ada di
  `docs/TASKS.md`.
