// ==========================================
// FILE: js/api.js
// KETERANGAN: Menangani seluruh komunikasi data (GET & POST) ke Google Sheet via Google Apps Script.
// Developer/Vibe Coder: File ini bertugas mengambil data dari Sheet dan mengirim pembaruan status.
// ==========================================

// 1. FUNGSI: Mengambil semua data kandidat dari Google Sheet
async function fetchCandidatesFromSheet() {
    try {
        // Mengirim permintaan GET ke URL Apps Script dengan parameter action=getData
        const response = await fetch(`${CONFIG.API_URL}?action=getData`);
        const data = await response.json();
        
        console.log("Data kandidat berhasil dimuat:", data.length);
        return data; // Mengembalikan array data kandidat
    } catch (error) {
        console.error("Gagal mengambil data dari Google Sheet:", error);
        showToast("Gagal memuat data dari server.", "error");
        return []; // Kembalikan array kosong jika gagal agar web tidak error
    }
}

// 2. FUNGSI: Mengirim pembaruan status kandidat ke Google Sheet
async function updateCandidateDataInSheet(candidateId, updateData) {
    try {
        // PERBAIKAN (sebelumnya memakai mode:"no-cors"):
        // Akar masalah CORS pada Google Apps Script Web App BUKAN karena GAS tidak pernah
        // mengirim header CORS, melainkan karena browser mengirim "preflight" OPTIONS
        // request lebih dulu ketika Content-Type di-set ke "application/json" — dan GAS
        // tidak bisa merespons preflight itu dengan benar (doOptions tidak didukung penuh).
        // Karena request ini TIDAK pernah menge-set header Content-Type secara eksplisit,
        // browser otomatis memakai "text/plain;charset=UTF-8" untuk body berupa string —
        // ini termasuk "simple request" yang TIDAK memicu preflight sama sekali.
        // Akibatnya request ini sebenarnya SUDAH BISA lolos CORS tanpa mode:"no-cors".
        // Dengan menghapus "no-cors", response dari doPost() sekarang BISA dibaca oleh
        // client, sehingga kita bisa mengecek result.success dan menampilkan pesan error
        // backend yang sesungguhnya (mis. candidateId tidak ditemukan), bukan lagi
        // asumsi "optimistic" semata.
        const response = await fetch(CONFIG.API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "updateStatus",
                candidateId: candidateId,
                updates: updateData
            })
        });

        const result = await response.json();

        if (!result || result.success !== true) {
            console.error("Backend menolak update:", result);
            showToast((result && result.message) || "Backend menolak pembaruan data.", "error");
            return false;
        }

        return true;
    } catch (error) {
        // Jika suatu saat deployment GAS berubah dan kembali memicu CORS error murni,
        // fetch akan melempar TypeError di sini. Kita fallback aman ke pesan generik.
        console.error("Gagal mengupdate data:", error);
        showToast("Gagal menyinkronkan data ke Google Sheet.", "error");
        return false;
    }
}

// 3. FUNGSI BANTU: Normalisasi nomor WhatsApp (Merapikan format 0, 62, atau 8x)
function normalizePhoneNumber(phone) {
    if (!phone) return "";
    let cleaned = phone.toString().replace(/\D/g, ''); // Hapus semua karakter selain angka
    if (cleaned.startsWith('62')) {
        cleaned = '0' + cleaned.slice(2);
    } else if (cleaned.startsWith('8')) {
        cleaned = '0' + cleaned;
    }
    return cleaned;
}
