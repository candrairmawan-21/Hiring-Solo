// ============================================================================
// FILE: js/screening.js
// DESKRIPSI: Menangani logika rendering UI kartu kandidat dan aksi screening
// ============================================================================

/**
 * Fungsi untuk merender kartu screening berdasarkan list kandidat
 * @param {Array} list - Array objek kandidat yang sudah melalui proses filter
 */
function renderScreeningCard(list) {
    const container = document.getElementById('screening-container');
    
    if (!container) {
        console.error("Elemen #screening-container tidak ditemukan.");
        return;
    }

    // Pengecekan: Jika antrean kosong atau index sudah melewati batas akhir
    if (!list || list.length === 0 || currentScreeningIndex >= list.length) {
        container.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center transform transition-all duration-300 scale-100 opacity-100">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                    <i class="fa-solid fa-check-double"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Antrean Selesai!</h3>
                <p class="text-slate-500 text-sm">Semua kandidat pada filter ini telah discreening.</p>
                <button onclick="triggerScreeningFilter()" class="mt-6 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors">
                    <i class="fa-solid fa-rotate-right mr-1"></i> Muat Ulang Antrean
                </button>
            </div>
        `;
        return;
    }

    const candidate = list[currentScreeningIndex];
    
    // Label peringatan jika data terdeteksi ganda di sistem
    const duplicateWarning = candidate.isDuplicate ? 
        `<div class="bg-amber-100 text-amber-800 px-4 py-2 text-xs font-bold text-center border-b border-amber-200">
            <i class="fa-solid fa-triangle-exclamation mr-1"></i> Peringatan: Data duplikat terdeteksi
        </div>` : '';

    // Render HTML Kartu Screening Komprehensif
    container.innerHTML = `
        <div id="active-card" class="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden w-full transition-all duration-300 transform scale-100 opacity-100">
            ${duplicateWarning}
            <div class="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 mb-2 inline-block shadow-sm">
                        <i class="fa-solid fa-briefcase"></i> ${candidate.position || '-'}
                    </span>
                    <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">${candidate.name || 'Tanpa Nama'}</h2>
                    <span class="text-xs text-slate-400 font-mono">ID: ${candidate.id || '-'}</span>
                </div>
                <div class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-slate-200">
                    ${candidate.age || '-'} Thn
                </div>
            </div>
            
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Domisili</p>
                        <p class="text-slate-700 font-semibold mt-1"><i class="fa-solid fa-location-dot text-slate-400 mr-1.5"></i> ${candidate.city || '-'}</p>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">No WhatsApp</p>
                        <p class="text-slate-700 font-semibold mt-1"><i class="fa-brands fa-whatsapp text-emerald-500 mr-1.5"></i> ${candidate.phone || '-'}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-3 text-xs">
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Gender / Pendidikan</p>
                        <p class="text-slate-700 font-semibold mt-1">${candidate.gender || '-'} • ${candidate.lastEducation || '-'}</p>
                    </div>
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Skor Screening</p>
                        <p class="text-blue-600 font-bold mt-1 text-sm"><i class="fa-solid fa-star mr-1"></i> ${candidate.score || '0'}</p>
                    </div>
                </div>
                
                <div class="mt-4">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</p>
                    <p class="text-slate-700 text-sm mt-1 leading-relaxed">${candidate.fullAddress || '-'}</p>
                </div>
                
                <div class="mt-4 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 shadow-inner">
                    <span class="text-xs font-bold text-blue-800">Progress Rekrutmen:</span>
                    <span class="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">${candidate.status || 'RAW'}</span>
                </div>

                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pengalaman / Keterangan</p>
                    <p class="text-slate-700 text-sm leading-relaxed">${candidate.experience || 'Tidak ada catatan'}</p>
                </div>
            </div>
            
            <div class="p-5 bg-slate-50 flex justify-between gap-3 border-t border-slate-100">
                <button onclick="handleScreeningAction('${candidate.id}', 'REJECTED')" class="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                    <i class="fa-solid fa-xmark text-lg"></i> Reject
                </button>
                <button onclick="handleScreeningAction('${candidate.id}', 'SKIP')" class="w-16 bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm" title="Lewati Sementara">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button onclick="handleScreeningAction('${candidate.id}', 'SHORTLIST')" class="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20">
                    <i class="fa-solid fa-check text-lg"></i> Shortlist
                </button>
            </div>
        </div>
    `;
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

    // 2. Beri jeda agar animasi selesai sebelum mengubah state dan merender kartu baru
    setTimeout(() => {
        // Jika bukan di-skip, update data master (globalCandidates)
        if (action !== 'SKIP') {
            if (typeof globalCandidates !== 'undefined') {
                const candidateIndex = globalCandidates.findIndex(c => c.id === candidateId);
                if (candidateIndex !== -1) {
                    globalCandidates[candidateIndex].status = action;
                    
                    // TODO: Jika Anda sudah menghubungkan sistem ini ke Backend / Google Apps Script, 
                    // panggil fungsi fetch API untuk sinkronisasi data (POST/PUT) di area ini.
                    // contoh: syncDataToSheet(candidateId, action);
                }
            }
        }

        // 3. Majukan indeks antrean
        if (typeof currentScreeningIndex !== 'undefined' && typeof filteredScreeningList !== 'undefined') {
            currentScreeningIndex++;
            
            // 4. Update indikator sisa jumlah antrean di tampilan index.html
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
