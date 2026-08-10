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
        // Mengirim permintaan POST berisi ID kandidat dan data yang diubah
        const response = await fetch(CONFIG.API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "updateStatus",
                candidateId: candidateId,
                updates: updateData
            })
        });
        
        const result = await response.json();
        return result.success; // Bernilai true jika berhasil terupdate di sheet
    } catch (error) {
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
