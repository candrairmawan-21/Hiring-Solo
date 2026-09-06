// ==========================================
// FILE: js/config.js
// KETERANGAN: Menyimpan pengaturan global aplikasi seperti URL Backend Google Apps Script.
// Developer/Vibe Coder: Anda cukup mengubah URL di bawah ini jika nanti melakukan re-deploy backend.
//
// Sheet master sumber data (dipelajari untuk memverifikasi mapping kolom —
// lihat docs/ARCHITECTURE.md untuk tabel lengkap field JS <-> kolom Sheet):
// https://docs.google.com/spreadsheets/d/1PMciImAHO4EF1IzGognIVCeYrP2lxAr_YIsnfvVI-Bc/
// Kolom A-W: Candidate ID, Nama Lengkap, (kolom kosong), Usia, Jenis Kelamin,
// No HP, Pend. Terakhir, Alamat Lengkap, Pengalaman kerja, Posisi yang dilamar,
// Score, Grade, Date Submitted, Screening Awal(M), Review by(N), Link WA(O),
// WA CV(P), Link CV(Q), Review CV(R), Tanggal Interview(S), Hasil Interview(T),
// Remark(U), Status Hiring(V), Store Penempatan(W).
// ==========================================

const CONFIG = {
    API_URL: "https://script.google.com/macros/s/AKfycbxQL9hKAT-SdL9B9pHc7uIti4rgVyeEI1Dv22N97z2NH3jb7JESDzbX1Ims3N3vpL8jQg/exec"
};
