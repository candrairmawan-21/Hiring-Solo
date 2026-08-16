/**
 * js/screening.js
 * Modul untuk menangani tampilan (Render) dan interaksi pada halaman Screening.
 */

// Helper: Animasi Card Swipe out
function animateCardOut(direction, callback) {
    const card = document.getElementById('active-card');
    if (!card) {
        if(callback) callback();
        return;
    }
    
    card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    
    if (direction === 'left') {
        card.style.transform = 'translateX(-120%) rotate(-10deg)';
    } else if (direction === 'right') {
        card.style.transform = 'translateX(120%) rotate(10deg)';
    } else if (direction === 'down') {
        card.style.transform = 'translateY(120%)';
    }
    
    card.style.opacity = '0';
    
    setTimeout(() => {
        if(callback) callback();
    }, 300);
}

// Render Kartu Kandidat
function renderScreeningCard(list) {
    const container = document.getElementById('card-container');
    const noMoreEl = document.getElementById('no-more-cards');
    
    // Pastikan hanya memproses kandidat yang statusnya RAW (Belum discreening)
    const rawList = list.filter(c => c.status === 'RAW');

    if (!rawList || rawList.length === 0 || window.currentScreeningIndex >= rawList.length) {
        if(container) container.innerHTML = '';
        if(noMoreEl) noMoreEl.style.display = 'flex';
        return;
    }

    if(noMoreEl) noMoreEl.style.display = 'none';
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

    // Tampilan HTML Kartu
    let html = `
    <div id="active-card" class="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col w-full text-slate-800 relative z-10">
        
        <!-- Header Profil -->
        <div class="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-2xl">
            <div>
                <h3 class="text-xl font-bold text-slate-800 leading-tight">${c.name || 'Tanpa Nama'}</h3>
                <div class="mt-2 flex flex-wrap gap-2">
                    <span class="px-2.5 py-1 bg-[#b85c43]/10 text-[#b85c43] text-xs font-bold rounded-lg">${c.position || 'Posisi Kosong'}</span>
                    <span class="px-2.5 py-1 bg-slate-200/70 text-slate-600 text-xs font-semibold rounded-lg">${c.gender || '-'} • ${c.age ? c.age + ' thn' : '-'}</span>
                </div>
            </div>
            <div class="text-right">
                <span class="text-2xl font-black text-slate-300">#${window.currentScreeningIndex + 1}</span>
                <span class="block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Total: ${rawList.length}</span>
            </div>
        </div>

        <!-- Body Data Lengkap -->
        <div class="p-5 flex-1 flex flex-col gap-4">
            
            ${(c.isDuplicate || (c.notes && c.notes.toLowerCase().includes('duplikat'))) ? 
            `<div class="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-bold">
                <i class="fa-solid fa-triangle-exclamation"></i> Kandidat terindikasi Duplikat
            </div>` : ''}

            <!-- Grid Informasi -->
            <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Domisili / Kota</span>
                    <span class="text-sm font-semibold text-slate-700 block">${c.city || '-'}</span>
                    ${c.address ? `<span class="text-xs text-slate-500 font-medium mt-1 line-clamp-2" title="${c.address}">${c.address}</span>` : ''}
                </div>
                
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pendidikan Terakhir</span>
                    <span class="text-sm font-semibold text-slate-700 block">${c.lastEducation || c.education || '-'}</span>
                    ${(c.major || c.jurusan || c.school) ? `<span class="text-xs text-slate-500 font-medium mt-1 line-clamp-2" title="${c.major || c.jurusan || ''} ${c.school ? '(' + c.school + ')' : ''}">${c.major || c.jurusan || ''} ${c.school ? '(' + c.school + ')' : ''}</span>` : ''}
                </div>
                
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Postur Fisik</span>
                    <span class="text-sm font-semibold text-slate-700">${c.height ? c.height + ' cm' : '-'} / ${c.weight ? c.weight + ' kg' : '-'}</span>
                </div>
                
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Sipil</span>
                    <span class="text-sm font-semibold text-slate-700">${c.maritalStatus || c.statusPernikahan || '-'}</span>
                </div>
                
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Waktu Melamar</span>
                    <span class="text-sm font-semibold text-slate-700">${c.timestamp || c.waktu || '-'}</span>
                </div>
                
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skor Penilaian</span>
                    <span class="text-sm font-bold text-[#b85c43]"><i class="fa-solid fa-star"></i> ${c.score || c.skor || '-'}</span>
                </div>

                <!-- Pengalaman Kerja -->
                <div class="col-span-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pengalaman Kerja</span>
                    <div class="text-sm font-semibold text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto pr-2" style="scrollbar-width: thin;">${c.experience || c.workExperience || c.pengalamanKerja || 'Belum ada pengalaman kerja / Tidak diisi'}</div>
                </div>
            </div>

            <!-- Status Screening Awal (Muncul jika ada isinya saja) -->
            ${(c.screeningAwal && c.screeningAwal.trim() !== '') ?
            `<div class="flex items-center justify-between px-4 py-2.5 bg-purple-50 border border-purple-100 rounded-xl">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-clipboard-check text-purple-500"></i>
                    <span class="text-xs font-bold text-purple-700 uppercase tracking-wider">Status Tahap Awal:</span>
                </div>
                <span class="text-sm font-extrabold text-purple-800">${c.screeningAwal}</span>
            </div>` : ''}

            <!-- Tombol Aksi Tautan (WA & CV) -->
            <div class="grid grid-cols-2 gap-3 mt-2">
                <a href="${waLink}" target="${waTarget}" class="${waClass} flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all">
                    <i class="fa-brands fa-whatsapp text-lg"></i> Hubungi WA
                </a>
                <a href="${cvLink}" target="${cvTarget}" class="${cvClass} flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all">
                    <i class="fa-solid fa-file-pdf text-lg"></i> Lihat CV
                </a>
            </div>
        </div>

        <!-- Tombol Eksekusi Status -->
        <div class="p-4 border-t border-slate-100 flex justify-between gap-3 bg-slate-50 rounded-b-2xl">
            <button onclick="handleScreeningAction('${c.id}', 'REJECTED')" class="flex-1 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                <i class="fa-solid fa-xmark"></i> Reject
            </button>
            <button onclick="handleScreeningAction('${c.id}', 'SKIP')" class="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <i class="fa-solid fa-rotate-right"></i> Skip
            </button>
            <button onclick="handleScreeningAction('${c.id}', 'SHORTLIST')" class="flex-1 py-3 bg-[#b85c43] border border-[#a6523b] text-white rounded-xl font-bold hover:bg-[#8f4533] transition-all flex items-center justify-center gap-2 shadow-sm">
                <i class="fa-solid fa-check"></i> Shortlist
            </button>
        </div>
    </div>
    `;

    if(container) container.innerHTML = html;
}

// Logika Pemrosesan Aksi (Reject, Skip, Shortlist)
async function handleScreeningAction(id, action, listParam) {
    // Membaca array dari parameter ATAU mengambil fallback dari variabel global di index.html
    const listToUse = listParam || (typeof filteredScreeningList !== 'undefined' ? filteredScreeningList : []);
    const rawList = listToUse.filter(c => c.status === 'RAW');
    
    if (window.currentScreeningIndex >= rawList.length) return;

    const currentCandidate = rawList[window.currentScreeningIndex];
    if (currentCandidate.id !== id) return;

    // Tentukan Arah Animasi
    let direction = 'down'; // Default untuk SKIP
    if (action === 'REJECTED') direction = 'left';
    if (action === 'SHORTLIST') direction = 'right';

    // Jalankan Animasi
    animateCardOut(direction, async () => {
        if (action === 'SKIP') {
            window.currentScreeningIndex++;
        } else {
            // Notifikasi UI memproses (Opsional)
            if(typeof showToast === 'function') showToast(`Memproses ${action}...`, 'info');
            
            // Panggil fungsi update di api.js
            const success = await updateCandidateStatus(id, action);
            if (success) {
                if(typeof showToast === 'function') showToast(`Kandidat berhasil di-${action}`, 'success');
                
                // Perbarui status langsung pada Array Global agar datanya "hilang" dari antrean saat ini
                const globalIdx = globalCandidates.findIndex(c => c.id === id);
                if(globalIdx > -1) globalCandidates[globalIdx].status = action;
                
                // Index tidak perlu dinaikkan, karena elemennya otomatis terpangkas dari 'rawList'
            } else {
                if(typeof showToast === 'function') showToast('Gagal memproses data ke Sheet!', 'error');
            }
        }
        
        // Panggil refresh dari index.html untuk memunculkan kartu berikutnya
        if (typeof refreshScreeningQueue === 'function') {
            refreshScreeningQueue();
        } else {
            renderScreeningCard(listToUse);
        }
    });
}
