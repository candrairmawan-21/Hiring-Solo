// ============================================================================
// FILE: js/screening.js
// DESKRIPSI: Menangani logika rendering UI kartu kandidat dan aksi screening (Revisi Audit Internal)
// ============================================================================

/**
 * Fungsi untuk merender kartu screening berdasarkan list kandidat dengan penanganan fallback dan error handling yang aman.
 * @param {Array} list - Array objek kandidat yang sudah melalui proses filter
 */
function renderScreeningCard(list) {
    // Penyelarasan ID DOM: Menggunakan 'card-container' sesuai dengan elemen pembungkus di index.html
    const container = document.getElementById('card-container');
    
    if (!container) {
        console.error("Elemen penampung DOM (#card-container) tidak ditemukan.");
        return;
    }

    // Penanganan Kesalahan & Fallback: Validasi jika list kosong atau tidak valid
    if (!Array.isArray(list) || list.length === 0 || typeof currentScreeningIndex === 'undefined' || currentScreeningIndex >= list.length) {
        container.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center transform transition-all duration-300 scale-100 opacity-100">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                    <i class="fa-solid fa-check-double"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Antrean Selesai!</h3>
                <p class="text-slate-500 text-sm">Semua kandidat pada filter ini telah discreening atau data sinkronisasi kosong.</p>
                <button onclick="triggerScreeningFilter()" class="mt-6 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer">
                    <i class="fa-solid fa-rotate-right mr-1"></i> Muat Ulang Antrean
                </button>
            </div>
        `;
        return;
    }

    const candidate = list[currentScreeningIndex];

    // Validasi kondisi objek kandidat untuk mencegah crash jika data bernilai null/undefined
    if (!candidate || typeof candidate !== 'object') {
        container.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-rose-200 p-8 text-center">
                <div class="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-1">Kesalahan Sinkronisasi Data</h3>
                <p class="text-slate-500 text-xs">Struktur data kandidat tidak valid atau kosong.</p>
            </div>
        `;
        return;
    }
    
    // Pemetaan properti dengan Fallback aman (mengatasi inkonsistensi properti data seperti lastEducation / education)
    const candidateId = candidate.id || '-';
    const candidatePosition = candidate.position || '-';
    const candidateName = candidate.name || 'Tanpa Nama';
    const candidateAge = candidate.age || '-';
    const candidateCity = candidate.city || '-';
    const candidatePhone = candidate.phone || '-';
    const candidateGender = candidate.gender || '-';
    const candidateEducation = candidate.lastEducation || candidate.education || '-';
    const candidateScore = candidate.score || '0';
    // TEMUAN AUDIT: code.gs tidak pernah mengirim field "fullAddress" — kolom G "Alamat Lengkap"
    // sebenarnya dipetakan ke field "city" (lihat getHeaderIndices: alamat/domisili -> indices.city).
    // Fallback ke candidate.city ditambahkan agar section ini tidak selalu tampil "-".
    const candidateAddress = candidate.fullAddress || candidate.city || '-';
    const candidateStatus = candidate.status || 'RAW';
    const candidateExperience = candidate.experience || 'Tidak ada catatan';
    // Kolom Q "Link CV" (field: cvLink dari code.gs). Di Sheet, kolom ini berisi formula
    // HYPERLINK() dengan teks tampilan "Lihat CV" — Apps Script getValues() hanya membaca teks
    // tampilan tsb, bukan URL aslinya. Tombol ditampilkan HANYA jika sel terisi & bukan
    // placeholder "Belum Response" (kosong = belum ada CV masuk).
    const candidateCvLinkRaw = (candidate.cvLink || '').toString().trim();
    const hasCvLink = candidateCvLinkRaw !== '' && candidateCvLinkRaw.toLowerCase() !== 'belum response';

    // Label peringatan jika data terdeteksi ganda di sistem
    const duplicateWarning = candidate.isDuplicate ? 
        `<div class="bg-amber-100 text-amber-800 px-4 py-2 text-xs font-bold text-center border-b border-amber-200">
            <i class="fa-solid fa-triangle-exclamation mr-1"></i> Peringatan: Data duplikat terdeteksi
        </div>` : '';

    // Render HTML Kartu Screening Komprehensif dengan data yang sudah divalidasi
    container.innerHTML = `
        <div id="active-card" class="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden w-full transition-all duration-300 transform scale-100 opacity-100">
            ${duplicateWarning}
            <div class="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 mb-2 inline-block shadow-sm">
                        <i class="fa-solid fa-briefcase"></i> ${candidatePosition}
                    </span>
                    <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">${candidateName}</h2>
                    <span class="text-xs text-slate-400 font-mono">ID: ${candidateId}</span>
                </div>
                <div class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-slate-200">
                    ${candidateAge} Thn
                </div>
            </div>
            
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Domisili</p>
                        <p class="text-slate-700 font-semibold mt-1"><i class="fa-solid fa-location-dot text-slate-400 mr-1.5"></i> ${candidateCity}</p>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">No WhatsApp</p>
                        <p class="text-slate-700 font-semibold mt-1"><i class="fa-brands fa-whatsapp text-emerald-500 mr-1.5"></i> ${candidatePhone}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-3 text-xs">
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Gender / Pendidikan</p>
                        <p class="text-slate-700 font-semibold mt-1">${candidateGender} • ${candidateEducation}</p>
                    </div>
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Skor Screening</p>
                        <p class="text-blue-600 font-bold mt-1 text-sm"><i class="fa-solid fa-star mr-1"></i> ${candidateScore}</p>
                    </div>
                </div>
                
                <div class="mt-4">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</p>
                    <p class="text-slate-700 text-sm mt-1 leading-relaxed">${candidateAddress}</p>
                </div>

                ${hasCvLink ? `
                <div class="flex items-center justify-between bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
                    <span class="text-xs font-bold text-emerald-800"><i class="fa-solid fa-file-lines mr-1"></i> CV Tersedia</span>
                    ${/^https?:\/\//i.test(candidateCvLinkRaw) ? `
                    <a href="${candidateCvLinkRaw}" target="_blank" rel="noopener noreferrer" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-bold shadow-sm transition-colors cursor-pointer">
                        Lihat CV <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i>
                    </a>` : `
                    <span class="text-xs text-emerald-700 font-semibold px-3 py-1.5" title="Link CV belum bisa diambil otomatis dari Sheet — buka langsung dari Google Sheet kolom Q">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i> Buka via Sheet
                    </span>`}
                </div>` : ''}
                
                <div class="mt-4 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 shadow-inner">
                    <span class="text-xs font-bold text-blue-800">Progress Rekrutmen:</span>
                    <span class="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">${candidateStatus}</span>
                </div>

                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pengalaman / Keterangan</p>
                    <p class="text-slate-700 text-sm leading-relaxed">${candidateExperience}</p>
                </div>
            </div>
            
            <div class="p-5 bg-slate-50 flex justify-between gap-3 border-t border-slate-100">
                <button onclick="handleScreeningAction('${candidateId}', 'REJECTED')" class="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                    <i class="fa-solid fa-xmark text-lg"></i> Reject
                </button>
                <button onclick="handleScreeningAction('${candidateId}', 'SKIP')" class="w-16 bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm" title="Lewati Sementara">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button onclick="handleScreeningAction('${candidateId}', 'SHORTLIST')" class="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20">
                    <i class="fa-solid fa-check text-lg"></i> Shortlist
                </button>
            </div>
        </div>
    `;
}

/**
 * Mendorong (push) hasil keputusan screening dari kartu ke Google Sheet.
 * - SELALU menulis field "screeningAwal" (kolom M "Screening Awal") = aksi yang diambil.
 * - Menulis field "status" (kolom V "Status Hiring") HANYA untuk REJECTED & SHORTLIST — SKIP
 *   tidak mengubah status pipeline, kandidat tetap RAW dan bisa muncul lagi di antrean.
 * - Memakai updateCandidateDataInSheet() dari js/api.js. CATATAN: karena Google Apps Script
 *   Web App tidak mengirim header CORS pada response POST, fungsi itu memakai mode "no-cors"
 *   dan keberhasilannya bersifat OPTIMISTIC (fetch tidak error = dianggap terkirim) — bukan
 *   konfirmasi tervalidasi dari server, karena response POST tidak bisa dibaca sama sekali
 *   oleh browser (lihat catatan lengkap di js/api.js).
 *
 * @param {string} candidateId
 * @param {string} action - 'REJECTED' | 'SHORTLIST' | 'SKIP'
 */
async function pushScreeningResultToSheet(candidateId, action) {
    if (typeof updateCandidateDataInSheet !== 'function') {
        console.error('pushScreeningResultToSheet: fungsi updateCandidateDataInSheet (js/api.js) tidak ditemukan. Pastikan js/api.js sudah dimuat sebelum js/screening.js.');
        return;
    }

    const updates = { screeningAwal: action };
    if (action !== 'SKIP') {
        updates.status = action;
    }

    const success = await updateCandidateDataInSheet(candidateId, updates);

    if (success && typeof showToast === 'function') {
        showToast('Data berhasil disimpan ke Google Sheet ✓', 'success');
    }
    // Kegagalan (jaringan maupun backend mengembalikan success:false) sudah ditampilkan
    // sebagai toast oleh updateCandidateDataInSheet() di js/api.js — tidak perlu duplikasi di sini.
}

/**
 * Fungsi untuk menangani aksi pada kartu (Reject, Skip, Shortlist) beserta animasinya.
 * @param {string} candidateId - ID unik dari kandidat
 * @param {string} action - Aksi keputusan (SHORTLIST, REJECTED, SKIP)
 */
function handleScreeningAction(candidateId, action) {
    const card = document.getElementById('active-card');
    
    // 1. Eksekusi Animasi Keluar (Out-Animation)
    if (card) {
        if (action === 'SHORTLIST') {
            card.classList.add('translate-x-full', 'opacity-0');
        } else if (action === 'REJECTED') {
            card.classList.add('-translate-x-full', 'opacity-0');
        } else if (action === 'SKIP') {
            card.classList.add('-translate-y-4', 'opacity-0', 'scale-95');
        }
    }

    // 1b. Push ke Google Sheet berjalan paralel, TIDAK memblokir animasi/antrean supaya swipe
    // tetap responsif. Notifikasi sukses/gagal muncul via toast begitu respons backend diterima.
    pushScreeningResultToSheet(candidateId, action);

    // 2. Beri jeda agar animasi selesai sebelum mengubah state dan merender kartu baru
    setTimeout(() => {
        if (typeof globalCandidates !== 'undefined') {
            const candidateIndex = globalCandidates.findIndex(c => c.id === candidateId);
            if (candidateIndex !== -1) {
                // Jika bukan di-skip, update status pipeline lokal (optimistic update)
                if (action !== 'SKIP') {
                    globalCandidates[candidateIndex].status = action;
                }
                // Update screeningAwal lokal untuk SEMUA aksi agar Slicer Progress konsisten
                // tanpa perlu menunggu reload/sync ulang dari Sheet.
                globalCandidates[candidateIndex].screeningAwal = action;
            }
        }

        // 3. Majukan indeks antrean
        if (typeof currentScreeningIndex !== 'undefined' && typeof filteredScreeningList !== 'undefined') {
            currentScreeningIndex++;
            
            // 4. Update indikator sisa jumlah antrean di antarmuka
            const queueCount = document.getElementById('queue-count');
            if (queueCount) {
                const remaining = filteredScreeningList.length - currentScreeningIndex;
                queueCount.innerText = remaining > 0 ? remaining : 0;
            }

            // 5. Rekursi: Render kartu untuk kandidat selanjutnya di dalam antrean
            renderScreeningCard(filteredScreeningList);
        }
    }, 300); // 300ms sejalan dengan durasi 'duration-300' pada Tailwind
}
