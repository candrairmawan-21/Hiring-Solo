// ==========================================
// FILE: js/api.js
// KETERANGAN: Menangani seluruh komunikasi data (GET & POST) ke Google Sheet via Google Apps Script,
//              plus fungsi bersama (stage kandidat, copy WA) dipakai oleh Dashboard/Screening/Pipeline/Database.
// ==========================================

// 1. FUNGSI: Mengambil semua data kandidat dari Google Sheet
async function fetchCandidatesFromSheet() {
    try {
        // Mengirim permintaan GET ke URL Apps Script dengan parameter action=getData
        const response = await fetch(`${CONFIG.API_URL}?action=getData`);
        const data = await response.json();

        // PERBAIKAN AUDIT (root cause "dashboard/pipeline/database error" yang berulang
        // kali dilaporkan): response APAPUN sebelumnya langsung dikembalikan mentah-mentah
        // tanpa validasi bentuknya. Begitu backend membalas OBJEK (bukan array murni) --
        // pola pembungkus umum seperti {success:true, data:[...]} atau objek error
        // {error:"..."} -- globalCandidates jadi bukan array, dan SEMUA render function di
        // 4 tab crash total begitu memanggil .filter()/.forEach(). Dikonfirmasi lewat
        // simulasi browser asli (Playwright), bukan dugaan. Divalidasi & dinormalisasi di
        // SATU TEMPAT ini supaya file lain aman asumsikan globalCandidates SELALU array.
        if (Array.isArray(data)) {
            console.log("Data kandidat berhasil dimuat:", data.length);
            return data;
        }

        if (data && typeof data === 'object') {
            const wrapped = data.data || data.candidates || data.result || data.rows;
            if (Array.isArray(wrapped)) {
                console.log("Data kandidat berhasil dimuat (dari objek pembungkus):", wrapped.length);
                return wrapped;
            }
            if (data.error || data.success === false) {
                const backendMessage = data.error || data.message || "Backend mengembalikan status gagal.";
                console.error("Backend Google Sheet mengembalikan error:", backendMessage);
                showToast(`Gagal memuat data: ${backendMessage}`, "error");
                return [];
            }
        }

        console.error("Format response dari backend tidak dikenali:", data);
        showToast("Format data dari server tidak dikenali. Cek console untuk detail.", "error");
        return [];
    } catch (error) {
        console.error("Gagal mengambil data dari Google Sheet:", error);
        showToast("Gagal memuat data dari server.", "error");
        return []; // Kembalikan array kosong jika gagal agar web tidak error
    }
}

// 2. FUNGSI: Mengirim pembaruan status kandidat ke Google Sheet
async function updateCandidateDataInSheet(candidateId, updateData) {
    const payload = JSON.stringify({
        action: "updateStatus",
        candidateId: candidateId,
        updates: updateData
    });

    // STRATEGI HYBRID (lihat docs/KNOWN_ISSUES.md #1) —
    // Percobaan #1: kirim TANPA mode "no-cors" (Content-Type default text/plain, ini
    // "simple request" yang TIDAK memicu preflight OPTIONS) supaya response backend BISA
    // dibaca kembali -- kalau code.gs mengirim {success:true|false}, kita dapat konfirmasi
    // sukses/gagal yang SEBENARNYA, bukan optimistic-blind seperti sebelumnya.
    //
    // Percobaan #2 (fallback): kalau percobaan #1 gagal (bisa karena CORS BENAR-BENAR
    // diblokir backend, ATAU sebab lain), TIDAK langsung dianggap gagal -- fallback ke
    // "no-cors" (perilaku ASLI yang SUDAH TERBUKTI menyimpan data ke Sheet, hanya
    // responsnya tidak terbaca). Ini konservatif secara SENGAJA: kalau asumsi CORS di
    // atas ternyata salah untuk backend ini, aksi TETAP tersimpan (optimistic) alih-alih
    // benar-benar gagal — mencegah regresi terhadap perilaku lama yang sudah terbukti jalan.
    //
    // ⚠️ BELUM TERVERIFIKASI terhadap code.gs asli (tidak ada di repo ini) — lihat
    // docs/KNOWN_ISSUES.md #1 untuk apa yang perlu dicek begitu code.gs tersedia.
    try {
        const response = await fetch(CONFIG.API_URL, { method: "POST", body: payload });
        const result = await response.json();
        if (result && result.success === false) {
            const msg = result.message || "Backend menolak pembaruan data.";
            console.error("Update ditolak backend:", msg);
            showToast(`Gagal menyimpan: ${msg}`, "error");
            return false;
        }
        return true;
    } catch (primaryError) {
        console.warn("Percobaan baca response gagal (kemungkinan CORS), fallback ke mode no-cors (optimistic):", primaryError);
        try {
            await fetch(CONFIG.API_URL, { method: "POST", mode: "no-cors", body: payload });
            return true; // Optimistic: fetch tidak melempar error jaringan = anggap terkirim
        } catch (fallbackError) {
            console.error("Gagal mengupdate data (kedua percobaan gagal):", fallbackError);
            showToast("Gagal menyinkronkan data ke Google Sheet. Cek koneksi internet.", "error");
            return false;
        }
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

// 4. FUNGSI BERSAMA: salin link WhatsApp (wa.me + pesan siap kirim) ke clipboard.
// PERBAIKAN AUDIT: dipanggil di js/database.js (onclick="copyWaLink(...)") tapi
// SEBELUMNYA TIDAK PERNAH DIDEFINISIKAN di file manapun -- tombol WA di Database selalu
// error "copyWaLink is not defined" di console tanpa melakukan apa-apa. Sekarang
// didefinisikan di sini (dipakai bersama Database & Screening) dan memakai
// generateWhatsAppLink() dari js/pipeline.js untuk isi pesannya (satu sumber template).
function copyWaLink(phone) {
    const link = (typeof generateWhatsAppLink === 'function')
        ? generateWhatsAppLink(phone)
        : `https://wa.me/${normalizePhoneNumber(phone).replace(/^0/, '62')}`;

    const doFallbackCopy = () => {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            if (typeof showToast === 'function') showToast('Link WhatsApp disalin ✓', 'success');
        } catch (e) {
            if (typeof showToast === 'function') showToast('Gagal menyalin link WhatsApp.', 'error');
        }
        document.body.removeChild(textarea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
            if (typeof showToast === 'function') showToast('Link WhatsApp disalin ✓', 'success');
        }).catch(doFallbackCopy);
    } else {
        doFallbackCopy();
    }
}

// 5. FUNGSI BERSAMA: tentukan "tahapan saat ini" seorang kandidat dari kombinasi kolom
// M (screeningAwal) & V (status), dipakai bersama oleh Dashboard (hitung metrik),
// Pipeline (gerbang masuk Kanban & sub-kolom), Database (badge Status), dan Screening
// (badge tahapan) -- SATU sumber logika supaya keempat tempat itu tidak pernah lagi
// tidak-sinkron satu sama lain (masalah yang berulang kali ditemukan: tiap file punya
// logika if/else sendiri-sendiri yang saling berbeda dan gampang tidak sinkron).
//
// PENTING: kolom M "Screening Awal" adalah GERBANG PERTAMA (hasil keputusan di tab
// Screening). Kolom V "Status Hiring" adalah SUB-TAHAP lanjutan (diisi dari tab Pipeline,
// SERING KALI MASIH KOSONG untuk kandidat yang baru saja di-Shortlist tapi belum di-WA).
// Kandidat dengan M=SHORTLIST & V=kosong TETAP dianggap "Shortlist", BUKAN "Baru/RAW".
//
// CATATAN UNTUK SESI BERIKUTNYA: versi ini SENGAJA hanya memakai kolom yang sudah
// TERVERIFIKASI benar (M, Q, S, V) -- TIDAK menebak field untuk kolom N/O/P/R/T/U/W
// (Review by, Link WA, WA CV, Review CV, Hasil Interview, Remark, Store Penempatan)
// karena code.gs (backend) tidak tersedia untuk memverifikasi nama field aslinya, dan
// field yang salah tebak berisiko menampilkan info yang keliru/kosong secara diam-diam.
// Begitu code.gs tersedia, kolom-kolom itu bisa ditambahkan ke sini (lihat detail
// tiap kolom di docs/ARCHITECTURE.md § Pemetaan Field).
function getCandidateStage(candidate) {
    const screeningAwal = (candidate.screeningAwal || '').toString().trim().toUpperCase();
    const status = (candidate.status || '').toString().trim().toUpperCase();

    if (status === 'HIRED') {
        return { step: 'HIRED', tone: 'emerald', label: 'Hired', detail: 'Diterima bekerja' };
    }
    if (status === 'REJECTED' || screeningAwal === 'REJECT' || screeningAwal === 'REJECTED') {
        return { step: 'REJECTED', tone: 'rose', label: 'Rejected', detail: 'Tidak lolos proses' };
    }
    if (status === 'INTERVIEW') {
        return { step: 'INTERVIEW', tone: 'purple', label: 'Interview', detail: candidate.interviewDate ? `Jadwal: ${candidate.interviewDate}` : 'Menunggu jadwal interview' };
    }
    if (status === 'REVIEW_CV') {
        return { step: 'REVIEW_CV', tone: 'indigo', label: 'Review CV', detail: 'Menunggu review CV oleh tim' };
    }
    if (status === 'WAITING_CV') {
        return { step: 'WAITING_CV', tone: 'blue', label: 'Menunggu CV', detail: 'Menunggu isi form & upload CV' };
    }
    if (screeningAwal === 'SHORTLIST') {
        return { step: 'SHORTLIST', tone: 'amber', label: 'Shortlist', detail: 'Lolos screening awal, belum dikirim WA' };
    }
    if (screeningAwal === 'SKIP') {
        return { step: 'SKIP', tone: 'slate', label: 'Skip', detail: 'Dilewati sementara saat screening' };
    }
    return { step: 'RAW', tone: 'slate', label: 'Baru', detail: 'Belum melalui proses screening' };
}

// 6. FUNGSI BANTU: peta "tone" abstrak -> kombinasi class Tailwind pastel. Dipasangkan
// dengan override kontras dark-mode di index.html (blok "Dark-mode: badge status
// bersama"), supaya badge dari getCandidateStage() otomatis terbaca jelas di tema Day
// maupun Night, di container manapun ia dipakai (Screening/Pipeline/Database).
function stageToneClasses(tone) {
    const map = {
        emerald: 'bg-emerald-100 text-emerald-800',
        rose: 'bg-rose-100 text-rose-800',
        purple: 'bg-purple-100 text-purple-800',
        indigo: 'bg-indigo-100 text-indigo-800',
        blue: 'bg-blue-100 text-blue-800',
        amber: 'bg-amber-100 text-amber-800',
        slate: 'bg-slate-100 text-slate-700'
    };
    return map[tone] || map.slate;
}
