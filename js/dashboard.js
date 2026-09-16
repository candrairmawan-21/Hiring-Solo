// ==========================================
// FILE: js/dashboard.js
// KETERANGAN: Mengelola statistik, metrik funnel, dan visualisasi data rekrutmen di halaman Dashboard.
// ==========================================

function renderDashboardMetrics(candidatesArray) {
    const posContainer = document.getElementById('dashboard-position-bars');

    // PERBAIKAN AUDIT: guard supaya tidak crash "candidatesArray.filter is not a function"
    // kalau data yang masuk bukan array (perbaikan utamanya di js/api.js).
    if (!Array.isArray(candidatesArray)) {
        console.error("renderDashboardMetrics: data yang diterima bukan array.", candidatesArray);
        if (posContainer) posContainer.innerHTML = `<p class="text-xs text-rose-500 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Gagal memuat data dashboard (format data tidak valid). Cek console untuk detail.</p>`;
        return;
    }

    // 1. Hitung statistik memakai getCandidateStage() (js/api.js) — SATU sumber logika
    // bersama Pipeline/Database/Screening.
    //
    // PERBAIKAN AUDIT (root cause "data card ditampilkan salah": Total 5.420 tapi
    // Shortlisted cuma 1): logika lama HANYA membaca kolom V (`c.status`). Padahal
    // keputusan Shortlist dari tab Screening ditulis ke kolom M (`screeningAwal`), dan
    // kolom V baru terisi setelah kandidat diproses di tab Pipeline. Akibatnya kandidat
    // yang sudah di-Shortlist tapi belum di-WA (V masih kosong) TIDAK terhitung sama
    // sekali — praktis semua metrik selain "Total Pelamar" selalu mendekati 0.
    const stages = candidatesArray.map(c => getCandidateStage(c).step);
    const totalPelamar = candidatesArray.length;
    // Shortlisted = lolos screening awal (apapun sub-tahap lanjutannya, selama tidak rejected)
    const shortlistedCount = stages.filter(s => ['SHORTLIST', 'WAITING_CV', 'REVIEW_CV', 'INTERVIEW', 'HIRED'].includes(s)).length;
    // Dalam Proses = sudah shortlist & sedang berjalan, belum final (belum hired/rejected)
    const processCount = stages.filter(s => ['SHORTLIST', 'WAITING_CV', 'REVIEW_CV', 'INTERVIEW'].includes(s)).length;
    const hiredCount = stages.filter(s => s === 'HIRED').length;

    // 2. Perbarui elemen angka di UI Dashboard jika elemennya tersedia
    const elTotal = document.getElementById('metric-total');
    const elShortlist = document.getElementById('metric-shortlist');
    const elProcess = document.getElementById('metric-process');
    const elHired = document.getElementById('metric-hired');

    if (elTotal) elTotal.innerText = totalPelamar.toLocaleString();
    if (elShortlist) elShortlist.innerText = shortlistedCount.toLocaleString();
    if (elProcess) elProcess.innerText = processCount.toLocaleString();
    if (elHired) elHired.innerText = hiredCount.toLocaleString();

    // 3. Hitung distribusi posisi yang dilamar secara dinamis
    let positionCounts = {};
    candidatesArray.forEach(c => {
        let pos = c.position || 'Lainnya';
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });

    // 4. Render bar progress distribusi posisi ke UI
    if (posContainer) {
        posContainer.innerHTML = '';

        // Urutkan posisi dari peminat terbanyak
        const sortedPositions = Object.entries(positionCounts).sort((a, b) => b[1] - a[1]);

        if (sortedPositions.length === 0) {
            posContainer.innerHTML = `<p class="text-xs text-slate-400">Belum ada data posisi tersedia.</p>`;
            return;
        }

        // PERBAIKAN AUDIT (warna diagram tidak sesuai): track (latar penuh) & fill (bar
        // sesuai persentase) sekarang diberi class penanda eksplisit `js-bar-track` dan
        // `js-bar-fill`. CSS dark-mode di index.html memakai penanda ini untuk mewarnai
        // KEDUANYA secara BERBEDA — sebelumnya selector-nya terlalu luas ([class*="bg-"])
        // sehingga track ikut dicat gradient neon yang sama dengan fill, membuat SEMUA bar
        // tampak 100% terisi (persentase mustahil dibaca secara visual).
        posContainer.innerHTML = sortedPositions.map(([pos, count]) => {
            const percentage = totalPelamar > 0 ? Math.round((count / totalPelamar) * 100) : 0;
            // Bar yang persentasenya membulat jadi 0% tetap diberi lebar minimum tipis
            // supaya masih terlihat ada (bukan hilang sama sekali).
            const barWidth = percentage === 0 && count > 0 ? 1 : percentage;
            return `
                <div>
                    <div class="flex justify-between text-sm mb-1 font-medium text-slate-700">
                        <span>${pos}</span>
                        <span class="text-slate-500">${count.toLocaleString()} pelamar (${percentage}%)</span>
                    </div>
                    <div class="js-bar-track w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div class="js-bar-fill bg-blue-600 h-full rounded-full transition-all duration-500" style="width: ${barWidth}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}
