// ==========================================
// FILE: js/database.js
// KETERANGAN: Mengelola Tabel Master, Pencarian Arsip, & Pagination untuk Ribuan Data Kandidat.
// ==========================================

let currentDatabasePage = 1;
const rowsPerPage = 25; // Jumlah baris per halaman agar web tidak lemot

function renderDatabaseTable(allCandidates, searchTerm = '') {
    const tbody = document.getElementById('database-table-body');
    const totalCountEl = document.getElementById('db-total-count');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    // 1. Filter data berdasarkan pencarian (nama, nomor HP dengan aman, atau posisi)
    const filtered = allCandidates.filter(c => {
        const query = searchTerm.toLowerCase();
        const nameMatch = (c.name || '').toLowerCase().includes(query);
        const phoneMatch = (c.phone || '').toString().toLowerCase().includes(query);
        const posMatch = (c.position || '').toLowerCase().includes(query);
        return nameMatch || phoneMatch || posMatch;
    });

    if (totalCountEl) {
        totalCountEl.innerText = `${filtered.length.toLocaleString()} Total Data`;
    }

    // 2. Logika Pagination (Membagi data per halaman)
    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    if (currentDatabasePage > totalPages) currentDatabasePage = totalPages;
    if (currentDatabasePage < 1) currentDatabasePage = 1;

    const startIndex = (currentDatabasePage - 1) * rowsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + rowsPerPage);

    // 3. Tampilkan pesan kosong jika data tidak ditemukan
    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">Tidak ada data kandidat yang ditemukan.</td></tr>`;
        renderPaginationControls(0, 1);
        return;
    }

    // 4. Render baris data ke dalam tabel
    paginatedData.forEach(c => {
        let statusBadge = '<span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold">Baru / RAW</span>';
        
        if (c.status === 'SHORTLIST') statusBadge = '<span class="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">Shortlist</span>';
        else if (c.status === 'WAITING_CV') statusBadge = '<span class="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold">Menunggu CV</span>';
        else if (c.status === 'REVIEW_CV') statusBadge = '<span class="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs font-bold">Review CV</span>';
        else if (c.status === 'INTERVIEW') statusBadge = '<span class="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs font-bold">Interview</span>';
        else if (c.status === 'HIRED') statusBadge = '<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">Hired</span>';
        else if (c.status === 'REJECTED') statusBadge = '<span class="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-xs font-bold">Arsip / Gagal</span>';

        let duplicateInfo = c.isDuplicate ? 
            '<span class="text-rose-600 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> Duplikat</span>' : 
            '<span class="text-slate-400">Aman</span>';

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition text-sm">
                <td class="p-4 font-bold text-slate-800">
                    ${c.name || 'Tanpa Nama'} 
                    <div class="text-xs text-slate-400 font-normal font-mono">ID: ${c.id || '-'}</div>
                </td>
                <td class="p-4 text-slate-600 font-medium">${c.position || '-'}</td>
                <td class="p-4 text-slate-600 font-mono">${c.phone || '-'}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-xs">${duplicateInfo}</td>
            </tr>
        `;
    });

    // Render navigasi halaman (pagination)
    renderPaginationControls(totalPages, filtered.length);
}

// Fungsi bantu untuk menampilkan tombol navigasi halaman (Prev / Next)
function renderPaginationControls(totalPages, totalFilteredRows) {
    let paginationContainer = document.getElementById('db-pagination-controls');
    
    if (!paginationContainer) {
        const tableWrapper = document.querySelector('#view-database .bg-white');
        if (tableWrapper) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'db-pagination-controls';
            paginationContainer.className = "p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-sm text-slate-600";
            tableWrapper.appendChild(paginationContainer);
        } else {
            return;
        }
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = `<span class="text-xs text-slate-400">Menampilkan seluruh ${totalFilteredRows} data</span>`;
        return;
    }

    paginationContainer.innerHTML = `
        <span class="text-xs text-slate-500">Halaman ${currentDatabasePage} dari ${totalPages} (Total ${totalFilteredRows} data)</span>
        <div class="flex gap-2">
            <button onclick="changeDatabasePage(-1)" ${currentDatabasePage === 1 ? 'disabled class="opacity-50 cursor-not-allowed bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold"' : 'class="bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"'}>
                <i class="fa-solid fa-chevron-left"></i> Prev
            </button>
            <button onclick="changeDatabasePage(1)" ${currentDatabasePage === totalPages ? 'disabled class="opacity-50 cursor-not-allowed bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold"' : 'class="bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"'}>
                Next <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function changeDatabasePage(direction) {
    currentDatabasePage += direction;
    if (typeof refreshDatabaseView === 'function') {
        refreshDatabaseView();
    }
}
