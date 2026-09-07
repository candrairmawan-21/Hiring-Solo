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
        // PENTING — TEMUAN AUDIT: Google Apps Script Web App TIDAK mengirim header CORS
        // (Access-Control-Allow-Origin) pada response POST — berbeda dari GET yang otomatis
        // lolos CORS (lihat fetchCandidatesFromSheet di atas, yang bekerja normal). Ini
        // keterbatasan platform GAS itu sendiri, BUKAN sesuatu yang bisa diperbaiki lewat
        // kode di code.gs (ContentService tidak punya cara mengatur header CORS secara manual).
        // doPost() di server TETAP berjalan & TETAP menyimpan data dengan benar — browser
        // hanya memblokir JS di sisi client membaca response-nya (net::ERR_FAILED walau
        // server sebenarnya membalas 200 OK).
        //
        // SOLUSI: kirim dengan mode "no-cors". Konsekuensinya, response menjadi "opaque" —
        // status maupun isi body-nya TIDAK BISA dibaca sama sekali oleh JS (pembatasan
        // keamanan browser, bukan bug). Karena itu kita TIDAK BISA lagi mengecek
        // result.success dari response — keberhasilan di sini bersifat OPTIMISTIC: dianggap
        // berhasil kalau fetch tidak melempar error jaringan (mis. benar-benar offline).
        // Kegagalan backend yang sah (mis. candidateId tidak ditemukan di Sheet) TIDAK akan
        // lagi terdeteksi dari sisi client — verifikasi manual di Sheet tetap disarankan
        // sesekali. Ini trade-off yang tidak terhindarkan akibat batasan CORS GAS di atas.
        await fetch(CONFIG.API_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({
                action: "updateStatus",
                candidateId: candidateId,
                updates: updateData
            })
        });

        return true; // Optimistic: fetch tidak melempar error = anggap terkirim
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
