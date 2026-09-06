// ==========================================
// FILE: js/dashboard.js
// KETERANGAN: Mengelola statistik, metrik funnel, dan visualisasi data rekrutmen di halaman Dashboard.
// ==========================================

function renderDashboardMetrics(candidatesArray) {
    // PERBAIKAN (permintaan user): metrik dashboard sebelumnya HANYA membaca
    // kolom V "Status Hiring" — sehingga kandidat yang sudah diputuskan
    // SHORTLIST di kolom M (Screening Awal) tapi belum "dipindah" ke kanban
    // Pipeline (kolom V masih kosong) tidak pernah terhitung sebagai
    // "Shortlisted". Sekarang, sesuai penjelasan struktur sheet master:
    //   - Total Pelamar   : seluruh baris di sheet (tidak berubah)
    //   - Shortlisted     : kolom M (Screening Awal) === SHORTLIST — cerminan
    //                       hasil screening otomatis/awal, terlepas dari sudah
    //                       masuk pipeline lanjutan atau belum.
    //   - Masih Proses    : sudah SHORTLIST di kolom M, TAPI kolom V (Status
    //                       Hiring) belum HIRED dan belum REJECTED — artinya
    //                       masih berjalan di suatu tahap (kirim WA, isi CV,
    //                       review, atau interview).
    //   - Diterima        : kolom V (Status Hiring) === HIRED.
    // Nilai kolom M/V di data nyata memakai kapitalisasi yang tidak konsisten
    // (mis. "SHORTLIST" vs "Shortlist", "REJECTED" vs "Reject") — semua
    // perbandingan di bawah ini menormalkan ke UPPERCASE dulu.
    const norm = (v) => (v || '').toString().trim().toUpperCase();
    const isShortlistedAwal = (c) => norm(c.screeningAwal) === 'SHORTLIST';
    const isHired = (c) => norm(c.status) === 'HIRED';
    const isFinalRejected = (c) => norm(c.status) === 'REJECTED';

    // 1. Hitung total statistik
    const totalPelamar = candidatesArray.length;
    const shortlistedCount = candidatesArray.filter(isShortlistedAwal).length;
    const processCount = candidatesArray.filter(c => isShortlistedAwal(c) && !isHired(c) && !isFinalRejected(c)).length;
    const hiredCount = candidatesArray.filter(isHired).length;

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
    const posContainer = document.getElementById('dashboard-position-bars');
    if (posContainer) {
        posContainer.innerHTML = '';
        
        // Urutkan posisi dari peminat terbanyak
        const sortedPositions = Object.entries(positionCounts).sort((a, b) => b[1] - a[1]);

        if (sortedPositions.length === 0) {
            posContainer.innerHTML = `<p class="text-xs text-slate-400">Belum ada data posisi tersedia.</p>`;
            return;
        }

        sortedPositions.forEach(([pos, count]) => {
            let percentage = totalPelamar > 0 ? Math.round((count / totalPelamar) * 100) : 0;
            
            posContainer.innerHTML += `
                <div>
                    <div class="flex justify-between text-sm mb-1 font-medium text-slate-700">
                        <span>${pos}</span> 
                        <span class="text-slate-500">${count.toLocaleString()} pelamar (${percentage}%)</span>
                    </div>
                    <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div class="bg-blue-600 h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
    }
}
