// ==========================================
// FILE: js/screening.js
// KETERANGAN: Mengatur tampilan Kartu Kandidat (Sistem Slicer, Anti-Duplikat, Tombol Aksi, & Logika Skip ke Antrean Belakang).
// ==========================================

let currentScreeningIndex = 0;

function renderScreeningCard(filteredList) {
    const container = document.getElementById('card-container');
    const noMoreCards = document.getElementById('no-more-cards');
    const queueCountEl = document.getElementById('queue-count');
    
    if (queueCountEl) queueCountEl.innerText = filteredList.length;

    if (currentScreeningIndex >= filteredList.length) {
        if (container) container.innerHTML = '';
        if (noMoreCards) {
            noMoreCards.classList.remove('hidden');
            noMoreCards.classList.add('flex');
        }
        return;
    }

    if (noMoreCards) {
        noMoreCards.classList.add('hidden');
        noMoreCards.classList.remove('flex');
    }
    
    const candidate = filteredList[currentScreeningIndex];
    if (!candidate || !container) return;

    // Banner Peringatan Anti-Duplikat
    let duplicateWarning = '';
    if (candidate.isDuplicate) {
        duplicateWarning = `
            <div class="bg-rose-50 text-rose-700 text-xs font-bold px-5 py-3 flex items-center gap-2.5 border-b border-rose-100">
                <i class="fa-solid fa-triangle-exclamation text-rose-500 text-base"></i>
                <span>PERINGATAN: Kandidat ini terdeteksi duplikat (Pernah terdaftar/gagal sebelumnya).</span>
            </div>
        `;
    }

    container.innerHTML = `
        <div id="active-card" class="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden w-full transition-all">
            ${duplicateWarning}
            <div class="p-6 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 mb-2 inline-block">
                        <i class="fa-solid fa-briefcase"></i> ${candidate.position || '-'}
                    </span>
                    <h2 class="text-2xl font-extrabold text-slate-800">${candidate.name || 'Tanpa Nama'}</h2>
                    <span class="text-xs text-slate-400 font-mono">ID: ${candidate.id || '-'}</span>
                </div>
                <div class="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold text-sm">
                    ${candidate.age || '-'} Thn
                </div>
            </div>
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase">Domisili</p>
                        <p class="text-slate-700 font-semibold mt-0.5"><i class="fa-solid fa-location-dot text-slate-400 mr-1"></i> ${candidate.city || '-'}</p>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase">No WhatsApp</p>
                        <p class="text-slate-700 font-semibold mt-0.5"><i class="fa-brands fa-whatsapp text-emerald-500 mr-1"></i> ${candidate.phone || '-'}</p>
                    </div>
                </div>
                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-1">Pengalaman / Keterangan</p>
                    <p class="text-slate-700 text-sm">${candidate.experience || 'Tidak ada catatan'}</p>
                </div>
            </div>
            
            <!-- Tombol Aksi Screening dengan melewatkan currentFilteredList -->
            <div class="p-5 bg-slate-50 flex justify-between gap-3 border-t border-slate-100">
                <button onclick="handleScreeningAction('${candidate.id}', 'REJECTED', filteredList)" class="flex-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                    <i class="fa-solid fa-xmark text-lg"></i> Reject
                </button>
                <button onclick="handleScreeningAction('${candidate.id}', 'SKIP', filteredList)" class="w-16 bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 py-3.5 rounded-2xl font-bold transition flex items-center justify-center cursor-pointer" title="Lewati">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button onclick="handleScreeningAction('${candidate.id}', 'SHORTLIST', filteredList)" class="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-3.5 rounded-2xl font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                    <i class="fa-solid fa-check text-lg"></i> Shortlist
                </button>
            </div>
        </div>
    `;
}

async function handleScreeningAction(candidateId, actionType, currentFilteredList) {
    const card = document.getElementById('active-card');
    
    if (actionType === 'REJECTED') {
        if (card) card.classList.add('card-swipe-left');
        await updateCandidateDataInSheet(candidateId, { status: 'REJECTED' });
        showToast("Kandidat ditolak dan diarsipkan.", "error");
    } else if (actionType === 'SHORTLIST') {
        if (card) card.classList.add('card-swipe-right');
        await updateCandidateDataInSheet(candidateId, { status: 'SHORTLIST' });
        showToast("Kandidat masuk Shortlist!", "success");
    } else if (actionType === 'SKIP') {
        if (card) {
            card.style.transform = "translateY(10px)";
            card.style.opacity = "0";
        }
        // Logika Skip: Dorong kandidat saat ini ke akhir array agar masuk antrean belakang
        if (currentFilteredList && currentFilteredList.length > 0) {
            const skippedCandidate = currentFilteredList[currentScreeningIndex];
            currentFilteredList.push(skippedCandidate);
        }
        showToast("Kandidat dilewati, dipindah ke antrean belakang.", "info");
    }

    setTimeout(() => {
        currentScreeningIndex++;
        if (typeof refreshScreeningQueue === 'function') {
            refreshScreeningQueue(); 
        }
    }, 300);
}
