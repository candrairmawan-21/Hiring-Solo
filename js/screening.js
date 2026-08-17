// ============================================================================
// FILE: js/screening.js
// DESKRIPSI: Menangani logika rendering UI kartu kandidat dan aksi screening 
// (Desain Kartu Premium V1 digabungkan dengan Fitur Data V2)
// ============================================================================

/**
 * Fungsi untuk merender kartu screening berdasarkan list kandidat
 */
function renderScreeningCard(list) {
    const container = document.getElementById('card-container');
    const noMoreEl = document.getElementById('no-more-cards');
    
    // Sembunyikan elemen bawaan index.html jika ada (kita pakai desain internal js)
    if(noMoreEl) noMoreEl.style.display = 'none';
    
    if (!container) return;

    // Pastikan hanya memproses kandidat yang statusnya RAW (Belum discreening)
    const rawList = list.filter(c => c.status === 'RAW');

    // STATE: KOSONG ATAU SELESAI
    if (!rawList || rawList.length === 0 || window.currentScreeningIndex >= rawList.length) {
        container.innerHTML = `
            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center transform transition-all duration-300 scale-100 opacity-100">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                    <i class="fa-solid fa-check-double"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-800 mb-2">Antrean Selesai!</h3>
                <p class="text-slate-500 text-sm">Semua kandidat pada filter ini telah diproses atau antrean sedang kosong.</p>
                <button onclick="triggerScreeningFilter()" class="mt-6 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer">
                    <i class="fa-solid fa-rotate-right mr-1"></i> Muat Ulang Antrean
                </button>
            </div>
        `;
        return;
    }

    const c = rawList[window.currentScreeningIndex];

    // Setup Tautan WhatsApp
    let waLink = '#';
    if (c.phone && c.phone.trim() !== '') {
        let formattedPhone = c.phone.toString().replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('62')) {
            formattedPhone = '62' + formattedPhone;
        }
        waLink = `https://wa.me/${formattedPhone}`;
    }
    const waClass = (waLink !== '#') ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed';
    const waTarget = (waLink !== '#') ? '_blank' : '_self';

    // Setup Tautan CV
    const cvLink = (c.cv && c.cv.trim() !== '') ? c.cv : '#';
    const cvTarget = (cvLink !== '#') ? '_blank' : '_self';
    const cvClass = (cvLink !== '#') ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed';

    // Label peringatan jika data terdeteksi ganda di sistem
    const duplicateWarning = (c.isDuplicate || (c.notes && c.notes.toLowerCase().includes('duplikat'))) ? 
        `<div class="bg-amber-100 text-amber-800 px-4 py-2 text-xs font-bold text-center border-b border-amber-200">
            <i class="fa-solid fa-triangle-exclamation mr-1"></i> Peringatan: Data duplikat terdeteksi
        </div>` : '';

    // Status Screening Awal
    let screeningAwalHtml = '';
    if (c.screeningAwal && c.screeningAwal.trim() !== '') {
        screeningAwalHtml = `
        <div class="mt-4 flex items-center justify-between bg-purple-50 px-4 py-3 rounded-xl border border-purple-100 shadow-inner">
            <span class="text-xs font-bold text-purple-800"><i class="fa-solid fa-clipboard-check mr-1"></i> Status Tahap Awal:</span>
            <span class="text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-bold shadow-sm">${c.screeningAwal}</span>
        </div>`;
    }

    // TAMPILAN HTML KARTU 
    container.innerHTML = `
        <div id="active-card" class="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden w-full transition-all duration-300 transform scale-100 opacity-100 relative z-10">
            ${duplicateWarning}
            
            <div class="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 mb-2 inline-block shadow-sm">
                        <i class="fa-solid fa-briefcase"></i> ${c.position || '-'}
                    </span>
                    <h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">${c.name || 'Tanpa Nama'}</h2>
                    <span class="text-xs text-slate-400 font-mono mt-1 block">ID: ${c.id || '-'} • Sisa Antrean: #${window.currentScreeningIndex + 1} / ${rawList.length}</span>
                </div>
                <div class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-slate-200">
                    ${c.age ? c.age + ' Thn' : '-'}
                </div>
            </div>
            
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Domisili / Kota</p>
                        <p class="text-slate-700 font-semibold mt-1"><i class="fa-solid fa-location-dot text-slate-400 mr-1.5"></i> ${c.city || '-'}</p>
                        ${c.address ? `<p class="text-xs text-slate-500 font-medium mt-1 line-clamp-2" title="${c.address}">${c.address}</p>` : ''}
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendidikan</p>
                        <p class="text-slate-700 font-semibold mt-1"><i class="fa-solid fa-graduation-cap text-slate-400 mr-1.5"></i> ${c.lastEducation || c.education || '-'}</p>
                        ${(c.major || c.jurusan || c.school) ? `<p class="text-xs text-slate-500 font-medium mt-1 line-clamp-2" title="${c.major || c.jurusan || ''} ${c.school ? '(' + c.school + ')' : ''}">${c.major || c.jurusan || ''} ${c.school ? '(' + c.school + ')' : ''}</p>` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-3 text-xs">
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Gender / Sipil</p>
                        <p class="text-slate-700 font-semibold mt-1">${c.gender || '-'} • ${c.maritalStatus || c.statusPernikahan || '-'}</p>
                    </div>
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Tinggi / Berat Fisik</p>
                        <p class="text-slate-700 font-semibold mt-1">${c.height ? c.height + ' cm' : '-'} / ${c.weight ? c.weight + ' kg' : '-'}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-3 text-xs">
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Waktu Melamar</p>
                        <p class="text-slate-700 font-semibold mt-1">${c.timestamp || c.waktu || '-'}</p>
                    </div>
                    <div>
                        <p class="font-bold text-slate-400 uppercase tracking-wider">Skor Screening</p>
                        <p class="text-blue-600 font-bold mt-1 text-sm"><i class="fa-solid fa-star mr-1"></i> ${c.score || c.skor || '-'}</p>
                    </div>
                </div>
                
                ${screeningAwalHtml}

                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pengalaman Kerja</p>
                    <div class="text-slate-700 text-sm leading-relaxed max-h-24 overflow-y-auto pr-2" style="scrollbar-width: thin;">${c.experience || c.workExperience || c.pengalamanKerja || 'Belum ada pengalaman kerja / Tidak diisi'}</div>
                </div>

                <!-- Tombol Eksternal (WA & CV) -->
                <div class="grid grid-cols-2 gap-3 mt-4">
                    <a href="${waLink}" target="${waTarget}" class="${waClass} flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
                        <i class="fa-brands fa-whatsapp text-lg"></i> WhatsApp
                    </a>
                    <a href="${cvLink}" target="${cvTarget}" class="${cvClass} flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
                        <i class="fa-solid fa-file-pdf text-lg"></i> Lihat CV
                    </a>
                </div>
            </div>
            
            <!-- Tombol Aksi Pipeline -->
            <div class="p-5 bg-slate-50 flex justify-between gap-3 border-t border-slate-100">
                <button onclick="handleScreeningAction('${c.id}', 'REJECTED')" class="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                    <i class="fa-solid fa-xmark text-lg"></i> Reject
                </button>
                <button onclick="handleScreeningAction('${c.id}', 'SKIP')" class="w-16 bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm" title="Lewati Sementara">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button onclick="handleScreeningAction('${c.id}', 'SHORTLIST')" class="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3.5 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20">
                    <i class="fa-solid fa-check text-lg"></i> Shortlist
                </button>
            </div>
        </div>
    `;
}

/**
 * Fungsi untuk menangani aksi pada kartu (Reject, Skip, Shortlist) beserta animasinya.
 */
function handleScreeningAction(candidateId, action) {
    const card = document.getElementById('active-card');
    
    // 1. Eksekusi Animasi Keluar (Menggunakan kelas Tailwind seperti desain lama)
    if (card) {
        if (action === 'SHORTLIST') {
            card.classList.add('translate-x-full', 'opacity-0');
        } else if (action === 'REJECTED') {
            card.classList.add('-translate-x-full', 'opacity-0');
        } else if (action === 'SKIP') {
            card.classList.add('-translate-y-4', 'opacity-0', 'scale-95');
        }
    }

    // 2. Beri jeda 300ms agar animasi selesai
    setTimeout(async () => {
        
        // Panggil API Google Sheet (Jika bukan SKIP)
        if (action !== 'SKIP') {
            if(typeof showToast === 'function') showToast(`Memproses ${action}...`, 'info');
            
            // Tunggu response update dari sheet
            const success = await updateCandidateStatus(candidateId, action);
            
            if (success) {
                if(typeof showToast === 'function') showToast(`Kandidat berhasil di-${action}`, 'success');
                // Perbarui status langsung pada Array Global 
                const candidateIndex = globalCandidates.findIndex(c => c.id === candidateId);
                if (candidateIndex !== -1) {
                    globalCandidates[candidateIndex].status = action;
                }
            } else {
                if(typeof showToast === 'function') showToast('Gagal memproses data ke Sheet!', 'error');
            }
        } else {
            // Jika SKIP, cukup naikkan antrean
            window.currentScreeningIndex++;
        }

        // 3. Render ulang dengan sisa data yang baru
        if (typeof filteredScreeningList !== 'undefined') {
            // Hitung sisa dan update UI Queue label
            const rawList = filteredScreeningList.filter(c => c.status === 'RAW');
            const queueCount = document.getElementById('queue-count');
            
            if (queueCount) {
                const remaining = rawList.length - window.currentScreeningIndex;
                queueCount.innerText = remaining > 0 ? remaining : 0;
            }

            renderScreeningCard(filteredScreeningList);
        }
    }, 300);
}
