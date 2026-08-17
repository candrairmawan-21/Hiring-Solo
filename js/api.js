// ============================================================================
// FILE: js/api.js
// DESKRIPSI: Menangani komunikasi (GET & POST) antara Website dan Google Sheet
// ============================================================================

// ⚠️ PENTING: Ganti tulisan di dalam tanda kutip ini dengan URL Web App Google Apps Script Anda yang asli (yang berakhiran /exec)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQL9hKAT-SdL9B9pHc7uIti4rgVyeEI1Dv22N97z2NH3jb7JESDzbX1Ims3N3vpL8jQg/exec'; 

/**
 * 1. Fungsi untuk mengambil data (GET) dari Google Sheet ke Website
 */
async function fetchCandidatesFromSheet() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=get_data`);
        const data = await response.json();
        
        if (data && data.success) {
            console.log(`Data kandidat berhasil dimuat: ${data.data.length}`);
            return data.data;
        } else {
            console.error("Format data gagal dibaca dari server.");
            return [];
        }
    } catch (error) {
        console.error("Gagal memuat data dari Sheet:", error);
        return [];
    }
}

/**
 * 2. Fungsi untuk mengirim (POST) hasil Reject/Shortlist kembali ke Google Sheet
 */
async function updateCandidateStatus(id, newStatus) {
    try {
        // Menggunakan URLSearchParams agar lolos dari blokir CORS Google
        const formData = new URLSearchParams();
        formData.append('action', 'update_status'); 
        formData.append('id', id);
        formData.append('status', newStatus);

        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        const result = await response.json();
        return result.success; 
        
    } catch (error) {
        console.error('Error saat push data ke Sheet:', error);
        return false;
    }
}
