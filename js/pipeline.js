// ==========================================
// FILE: js/pipeline.js (Optimized Performance)
// KETERANGAN: Mengatur Kanban Board dengan optimasi DOM (mencegah lag), Optimistic UI, & WhatsApp API.
// ==========================================

// 1. FUNGSI: Membuat Link WhatsApp API dengan format pesan yang ditentukan
function generateWhatsAppLink(candidatePhone) {
    let cleanPhone = candidatePhone.toString().replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
    }

    const message = `Selamat Siang,\n\nKami dari MR DIY Indonesia bermaksud ingin menindaklanjuti lamaran yang sudah Anda submit di website. Vacancy yang available saat ini untuk penempatan Area Jawa Tengah dan jika Anda bersedia mohon untuk mengisi link berikut :\nhttps://tinyurl.com/MRDIYRecruit\n\nSetelah selesai kami akan melakukan screening CV dan kandidat yang lolos akan dihubungi kembali melalui pesan WhatsApp untuk mengikuti proses selanjutnya.\n\nGood luck and thank you`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// 2. FUNGSI: Render Kanban Board dengan Optimasi Performa Tinggi (Tanpa innerHTML += dalam loop)
function renderKanbanBoard(candidatesArray) {
    const cols = {
        shortlist: document.getElementById('kanban-shortlist'),
        waiting: document.getElementById('kanban-waiting'),
        review: document.getElementById('kanban-review'),
        interview: document.getElementById('kanban-interview'),
        hired: document.getElementById('kanban-hired')
    };

    let counts = { shortlist: 0, waiting: 0, review: 0, interview: 0, hired: 0 };
    
    // Objek penampung string HTML per kolom (Mencegah reflow DOM berulang-ulang)
    let colHTML = {
        shortlist: '',
        waiting: '',
        review: '',
        interview: '',
        hired: ''
    };

    candidatesArray.forEach(c => {
        if (c.status === 'RAW' || c.status === 'REJECTED') return;

        let targetColKey = 'shortlist';
        if (c.status === 'SHORTLIST') targetColKey = 'shortlist';
        else if (c.status === 'WAITING_CV') targetColKey = 'waiting';
        else if (c.status === 'REVIEW_CV') targetColKey = 'review';
        else if (c.status === 'INTERVIEW') targetColKey = 'interview';
        else if (c.status === 'HIRED') targetColKey = 'hired';

        // Batasi tampilan maksimal 50 kartu terbaru per kolom untuk menjaga performa web tetap ringan
        if (counts[targetColKey] >= 50) return;

        counts[targetColKey]++;

        let cardHTML = `
            <div class="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 mb-3 hover:border-blue-300 transition">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-bold text-sm text-slate-800">${c.name || 'Tanpa Nama'}</h4>
                    <span class="text-[11px] bg-slate-100 px-2.5 py-0.5 rounded font-semibold text-slate-600">${c.position || '-'}</span>
                </div>
                <p class="text-xs text-slate-500 mb-3"><i class="fa-solid fa-phone mr-1"></i> ${c.phone || '-'}</p>
        `;

        if (c.status === 'SHORTLIST') {
            const waLink = generateWhatsAppLink(c.phone);
            cardHTML += `
                <a href="${waLink}" target="_blank" onclick="updateStatusToWaiting('${c.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                    <i class="fa-brands fa-whatsapp text-sm"></i> Chat WA & Kirim Form
                </a>
            `;
        } else if (c.status === 'WAITING_CV') {
            cardHTML += `
                <div class="text-xs text-blue-600 bg-blue-50 p-2.5 rounded-xl text-center font-medium border border-blue-100">
                    <i class="fa-solid fa-clock mr-1"></i> Menunggu Isi G-Form & Upload CV
                </div>
            `;
        } else if (c.status === 'REVIEW_CV') {
            cardHTML += `
                <div class="space-y-2">
                    <a href="${c.cvLink || '#'}" target="_blank" class="block bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 text-center rounded-xl transition">
                        <i class="fa-solid fa-file-pdf mr-1"></i> Lihat CV Kandidat
                    </a>
                    <div class="flex gap-1.5 items-center">
                        <input type="date" id="date-${c.id}" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5 w-full outline-none focus:ring-1 focus:ring-blue-500" />
                        <button onclick="scheduleInterviewAction('${c.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer">Undang</button>
                    </div>
                </div>
            `;
        } else if (c.status === 'INTERVIEW') {
            cardHTML += `
                <div class="space-y-2">
                    <p class="text-[11px] text-purple-700 bg-purple-50 p-2.5 rounded-xl font-medium text-center border border-purple-100">
                        <i class="fa-solid fa-calendar-check mr-1"></i> Jadwal: <b>${c.interviewDate || 'Belum diatur'}</b>
                    </p>
                    <div class="flex gap-2">
                        <button onclick="processInterviewResult('${c.id}', 'REJECTED')" class="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold py-2 rounded-xl transition cursor-pointer">Reject</button>
                        <button onclick="processInterviewResult('${c.id}', 'HIRED')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer">Offering / Hired</button>
                    </div>
                </div>
            `;
        } else if (c.status === 'HIRED') {
            cardHTML += `
                <div class="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl font-semibold text-center border border-emerald-100">
                    <i class="fa-solid fa-check-circle mr-1"></i> Diterima (HIRED)
                </div>
            `;
        }

        cardHTML += `</div>`;
        
        if (colHTML[targetColKey] !== undefined) {
            colHTML[targetColKey] += cardHTML;
        }
    });

    // Masukkan string HTML ke DOM HANYA SEKALI setelah perulangan selesai (Sangat Cepat & Responsif)
    Object.keys(cols).forEach(key => {
        if (cols[key]) {
            cols[key].innerHTML = colHTML[key] || `<div class="text-center py-8 text-slate-400 text-xs italic">Belum ada kandidat</div>`;
        }
    });

    // Update Counter Badge di Header Kolom
    if (document.getElementById('count-shortlist')) document.getElementById('count-shortlist').innerText = counts.shortlist;
    if (document.getElementById('count-waiting')) document.getElementById('count-waiting').innerText = counts.waiting;
    if (document.getElementById('count-review')) document.getElementById('count-review').innerText = counts.review;
    if (document.getElementById('count-interview')) document.getElementById('count-interview').innerText = counts.interview;
    if (document.getElementById('count-hired')) document.getElementById('count-hired').innerText = counts.hired;
}

// 3. FUNGSI AKSI DENGAN OPTIMISTIC UI: Update status secara instan tanpa menunggu fetch jaringan penuh
async function updateStatusToWaiting(candidateId) {
    // Update lokal terlebih dahulu agar UI merespons seketika
    const targetCandidate = globalCandidates.find(c => c.id === candidateId);
    if (targetCandidate) targetCandidate.status = 'WAITING_CV';
    renderKanbanBoard(globalCandidates);

    showToast("Status diperbarui: Menunggu G-Form.", "info");

    // Kirim ke backend di latar belakang
    await updateCandidateDataInSheet(candidateId, { status: 'WAITING_CV' });
}

// 4. FUNGSI AKSI: Penjadwalan Interview (Alur #8 dengan Optimistic UI)
async function scheduleInterviewAction(candidateId) {
    const dateInput = document.getElementById(`date-${candidateId}`);
    if (!dateInput || !dateInput.value) {
        showToast("Silakan pilih tanggal interview terlebih dahulu.", "error");
        return;
    }

    const interviewDate = dateInput.value;

    // Update lokal instan
    const targetCandidate = globalCandidates.find(c => c.id === candidateId);
    if (targetCandidate) {
        targetCandidate.status = 'INTERVIEW';
        targetCandidate.interviewDate = interviewDate;
    }
    renderKanbanBoard(globalCandidates);
    showToast("Jadwal interview berhasil disimpan!", "success");

    // Kirim ke backend
    await updateCandidateDataInSheet(candidateId, { 
        status: 'INTERVIEW', 
        interviewDate: interviewDate 
    });
}

// 5. FUNGSI AKSI: Hasil Interview (Alur #9 & #10 dengan Optimistic UI)
async function processInterviewResult(candidateId, resultStatus) {
    // Update lokal instan
    const targetCandidate = globalCandidates.find(c => c.id === candidateId);
    if (targetCandidate) {
        targetCandidate.status = resultStatus;
    }
    renderKanbanBoard(globalCandidates);

    if (resultStatus === 'HIRED') {
        showToast("Kandidat resmi diterima (HIRED)!", "success");
    } else {
        showToast("Kandidat ditolak (REJECTED).", "error");
    }

    // Kirim ke backend
    await updateCandidateDataInSheet(candidateId, { status: resultStatus });
}
