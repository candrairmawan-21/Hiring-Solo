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

// ==========================================
// 4. FUNGSI BARU: Menyalin link WhatsApp ke clipboard
// ==========================================
// PERBAIKAN — FUNGSI HILANG: tombol WA di tabel Database memanggil
// onclick="copyWaLink(...)" tapi fungsi ini sebelumnya TIDAK PERNAH
// didefinisikan di manapun dalam repo (lihat docs/CHANGELOG.md). Diletakkan
// di api.js (bukan database.js) supaya bisa dipakai bersama oleh Screening,
// Pipeline, maupun Database — bukan cuma satu tampilan saja.
function copyWaLink(rawPhone) {
    if (!rawPhone || rawPhone === '-') {
        if (typeof showToast === 'function') showToast('Nomor WhatsApp tidak tersedia.', 'error');
        return;
    }

    const waLink = (typeof generateWhatsAppLink === 'function')
        ? generateWhatsAppLink(rawPhone)
        : `https://wa.me/${rawPhone.toString().replace(/\D/g, '')}`;

    const onCopySuccess = () => {
        if (typeof showToast === 'function') showToast('Link wa.me berhasil disalin!', 'success');
    };
    const onCopyFail = () => {
        if (typeof showToast === 'function') showToast('Gagal menyalin link. Salin manual: ' + waLink, 'error');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(waLink).then(onCopySuccess).catch(onCopyFail);
    } else {
        // Fallback lama untuk konteks non-secure (http) yang tidak mengizinkan Clipboard API
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = waLink;
            tempInput.style.position = 'fixed';
            tempInput.style.opacity = '0';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            onCopySuccess();
        } catch (err) {
            onCopyFail();
        }
    }
}

// ==========================================
// 5. FUNGSI BARU: Menentukan "tahapan" kandidat berdasar kolom M-W di Sheet
// ==========================================
// KETERANGAN LENGKAP mapping kolom ada di docs/ARCHITECTURE.md.
// ⚠️ PENTING — ASUMSI NAMA FIELD: karena code.gs (backend) tidak tersedia di
// repo ini, nama field JS untuk kolom N, O, P, R, T, U, W di bawah adalah
// TEBAKAN berdasar konvensi penamaan yang sudah dipakai kolom lain (M="screeningAwal",
// Q="cvLink", S="interviewDate", V="status" — semua sudah dipastikan benar).
// Setiap field memakai BEBERAPA alias fallback (mis. c.reviewedBy || c.reviewBy
// || c.n) supaya tetap berfungsi walau nama field asli sedikit berbeda — tapi
// WAJIB diverifikasi ke code.gs yang sesungguhnya begitu tersedia. Lihat
// docs/KNOWN_ISSUES.md.
//
// Return: { step, tone, label, detail }
//   - step  : urutan tahap (0=belum apa-apa/ditolak/skip, 1..6 makin jauh, 7=hired)
//   - tone  : salah satu dari 'slate'|'amber'|'blue'|'purple'|'indigo'|'emerald'|'rose'
//             (dipetakan ke kombinasi warna badge yang SUDAH ada override dark-mode-nya)
//   - label : teks pendek untuk ditampilkan sebagai badge tahapan
//   - detail: teks tambahan (opsional) — mis. tanggal interview, nama reviewer, remark
function getCandidateStage(c) {
    c = c || {};
    const norm = (v) => (v || '').toString().trim().toUpperCase();
    const raw = (v) => (v || '').toString().trim();

    const screeningAwal = norm(c.screeningAwal);                                   // Kolom M
    const reviewer = raw(c.reviewedBy || c.reviewBy || c.reviewer || c.n);          // Kolom N
    const waSent = norm(c.waSent || c.waCv || c.p);                                 // Kolom P
    const cvLinkVal = raw(c.cvLink || c.cv || c.q);                                 // Kolom Q
    const cvReview = raw(c.cvReview || c.reviewCv || c.r);                          // Kolom R
    const interviewDate = raw(c.interviewDate || c.tanggalInterview || c.s);        // Kolom S
    const interviewResult = raw(c.interviewResult || c.hasilInterview || c.t);      // Kolom T
    const remark = raw(c.remark || c.u);                                           // Kolom U
    const status = norm(c.status);                                                // Kolom V
    const store = raw(c.placementStore || c.storePenempatan || c.store || c.w);     // Kolom W

    const cvFilled = cvLinkVal && !/belum response/i.test(cvLinkVal);

    if (status === 'HIRED') {
        return { step: 7, tone: 'emerald', label: 'Diterima (Hired)', detail: store ? `Penempatan: ${store}` : '' };
    }
    if (status === 'REJECTED' || screeningAwal.startsWith('REJECT')) {
        return { step: 0, tone: 'rose', label: 'Ditolak', detail: remark || interviewResult || '' };
    }
    if (screeningAwal === 'SKIP') {
        return { step: 0, tone: 'slate', label: 'Dilewati (Skip)', detail: 'Belum diputuskan saat screening awal' };
    }
    if (interviewResult) {
        const isOk = /\bok\b/i.test(interviewResult) && !/not\s*ok/i.test(interviewResult);
        return { step: 6, tone: isOk ? 'emerald' : 'rose', label: `Hasil Interview: ${interviewResult}`, detail: remark || '' };
    }
    if (interviewDate) {
        return { step: 5, tone: 'indigo', label: 'Menunggu Hasil Interview', detail: `Dijadwalkan: ${interviewDate}` };
    }
    if (cvReview) {
        return { step: 4, tone: 'purple', label: `Review CV: ${cvReview}`, detail: 'Menunggu jadwal interview' };
    }
    if (cvFilled) {
        return { step: 3, tone: 'blue', label: 'CV Diterima', detail: 'Menunggu direview tim' };
    }
    if (waSent === 'SENT') {
        return { step: 2, tone: 'amber', label: 'WA Terkirim', detail: 'Menunggu kandidat isi form & CV' };
    }
    if (screeningAwal === 'SHORTLIST') {
        return { step: 1, tone: 'amber', label: 'Shortlisted', detail: reviewer ? `Direview oleh ${reviewer}` : 'Menunggu WA dikirim' };
    }
    return { step: 0, tone: 'slate', label: 'Baru / Belum Discreening', detail: '' };
}

// Memetakan "tone" dari getCandidateStage() ke kombinasi class Tailwind badge.
// Kombinasi ini SENGAJA sama dengan yang sudah punya override kontras di
// dark mode (lihat blok CSS "PERBAIKAN BUG UTAMA #1" di index.html), supaya
// badge tahapan otomatis ikut terbaca jelas di dark mode juga.
function stageToneClasses(tone) {
    const map = {
        slate:   'bg-slate-100 text-slate-700 border border-slate-200',
        amber:   'bg-amber-100 text-amber-800 border border-amber-200',
        blue:    'bg-blue-100 text-blue-800 border border-blue-200',
        purple:  'bg-purple-100 text-purple-800 border border-purple-200',
        indigo:  'bg-indigo-100 text-indigo-800 border border-indigo-200',
        emerald: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        rose:    'bg-rose-100 text-rose-800 border border-rose-200'
    };
    return map[tone] || map.slate;
}
