// ==========================================
// FILE: js/database.js
// KETERANGAN: Mengelola Tabel Master, Pencarian Arsip, & Pagination untuk Ribuan Data Kandidat.
// ==========================================

let currentDatabasePage = 1;
// PERBAIKAN (permintaan user, poin 5): sebelumnya rowsPerPage konstan 25 dan
// tidak bisa diubah, sehingga menjelajah data dalam jumlah besar terasa
// lambat (klik Next berkali-kali). Sekarang bisa dipilih user, dan disimpan
// sebagai variabel biasa (bukan const) supaya bisa diganti dari dropdown.
let rowsPerPage = 50;
// Filter status (khusus tabel Database) & state sorting kolom.
// PERBAIKAN (permintaan user, poin 5): sebelumnya tabel Database sama sekali
// tidak bisa difilter per status maupun diurutkan per kolom — hanya bisa
// dicari lewat search box nama/HP/posisi.
let databaseStatusFilter = 'ALL';
let databaseSortColumn = null;   // 'name' | 'position' | 'status' | null (urutan asli/API)
let databaseSortDirection = 'asc';

function setDatabaseRowsPerPage(value) {
    rowsPerPage = (value === 'all') ? Infinity : parseInt(value, 10);
    currentDatabasePage = 1;
    if (typeof refreshDatabaseView === 'function') refreshDatabaseView();
}

function setDatabaseStatusFilter(value) {
    databaseStatusFilter = value || 'ALL';
    currentDatabasePage = 1;
    if (typeof refreshDatabaseView === 'function') refreshDatabaseView();
}

function sortDatabaseBy(column) {
    if (databaseSortColumn === column) {
        databaseSortDirection = (databaseSortDirection === 'asc') ? 'desc' : 'asc';
    } else {
        databaseSortColumn = column;
        databaseSortDirection = 'asc';
    }
    currentDatabasePage = 1;
    if (typeof refreshDatabaseView === 'function') refreshDatabaseView();
    updateDatabaseSortIndicators();
}

function updateDatabaseSortIndicators() {
    document.querySelectorAll('#view-database th[data-sort]').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (!icon) return;
        if (th.getAttribute('data-sort') === databaseSortColumn) {
            icon.className = 'sort-icon fa-solid ' + (databaseSortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
        } else {
            icon.className = 'sort-icon fa-solid fa-sort opacity-30';
        }
    });
}

function renderDatabaseTable(allCandidates, searchTerm = '') {
    const tbody = document.getElementById('database-table-body');
    const totalCountEl = document.getElementById('db-total-count');
    
    if (!tbody) return;
    tbody.innerHTML = '';

    // 1. Filter data berdasarkan pencarian (nama, nomor HP dengan aman, atau posisi)
    let filtered = allCandidates.filter(c => {
        const query = searchTerm.toLowerCase();
        const nameMatch = (c.name || '').toLowerCase().includes(query);
        const phoneMatch = (c.phone || '').toString().toLowerCase().includes(query);
        const posMatch = (c.position || '').toLowerCase().includes(query);
        return nameMatch || phoneMatch || posMatch;
    });

    // 1b. Filter berdasarkan status (dropdown baru — lihat setDatabaseStatusFilter)
    if (databaseStatusFilter && databaseStatusFilter !== 'ALL') {
        filtered = filtered.filter(c => {
            const st = (c.status || '').toString().trim().toUpperCase();
            if (databaseStatusFilter === 'RAW') return st === '' || st === 'RAW';
            return st === databaseStatusFilter;
        });
    }

    // 1c. Sorting kolom (klik header) — default: urutan asli dari API bila belum dipilih
    if (databaseSortColumn) {
        const dir = databaseSortDirection === 'asc' ? 1 : -1;
        filtered = [...filtered].sort((a, b) => {
            let va, vb;
            if (databaseSortColumn === 'name') { va = (a.name || ''); vb = (b.name || ''); }
            else if (databaseSortColumn === 'position') { va = (a.position || ''); vb = (b.position || ''); }
            else if (databaseSortColumn === 'status') { va = (a.status || 'RAW'); vb = (b.status || 'RAW'); }
            else { va = ''; vb = ''; }
            return va.toString().localeCompare(vb.toString()) * dir;
        });
    }

    if (totalCountEl) {
        totalCountEl.innerText = `${filtered.length.toLocaleString()} Total Data`;
    }

    // 2. Logika Pagination (Membagi data per halaman)
    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    if (currentDatabasePage > totalPages) currentDatabasePage = totalPages;
    if (currentDatabasePage < 1) currentDatabasePage = 1;

    const startIndex = (currentDatabasePage - 1) * rowsPerPage;
    const paginatedData = Number.isFinite(rowsPerPage) ? filtered.slice(startIndex, startIndex + rowsPerPage) : filtered;

    // 3. Tampilkan pesan kosong jika data tidak ditemukan
    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Tidak ada data kandidat yang ditemukan.</td></tr>`;
        renderPaginationControls(0, 1);
        return;
    }

    // 4. Render baris data ke dalam tabel
    paginatedData.forEach(c => {
        // PERBAIKAN: badge status sekarang memakai getCandidateStage() dari js/api.js
        // (satu sumber logika yang sama dipakai juga oleh Screening & Pipeline),
        // bukan lagi if/else terpisah yang mudah tidak sinkron antar file.
        const stage = getCandidateStage(c);
        const statusBadge = `<span class="${stageToneClasses(stage.tone)} px-2.5 py-1 rounded-full text-xs font-bold" title="${(stage.detail || '').replace(/"/g, '&quot;')}">${stage.label}</span>`;

        let duplicateInfo = c.isDuplicate ? 
            '<span class="text-rose-600 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> Duplikat</span>' : 
            '<span class="text-slate-400">Aman</span>';

        // === LOGIKA TOMBOL WA (Hover Animasi) ===
        const waNumber = c.phone || '-';
        let waButtonHTML = '-';
        if (waNumber !== '-') {
            waButtonHTML = `
                <button onclick="copyWaLink('${waNumber}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-500 hover:text-white border border-emerald-200 transition-colors shadow-sm group cursor-pointer">
                    <i class="fa-brands fa-whatsapp text-sm"></i> 
                    <span class="group-hover:hidden">${waNumber}</span>
                    <span class="hidden group-hover:inline">Copy wa.me</span>
                </button>
            `;
        }

        // === LOGIKA TOMBOL CV (Kolom Q) ===
        // PERBAIKAN: field dari backend (code.gs) bernama 'cvLink', BUKAN 'cv'.
        // js/screening.js dan js/pipeline.js sudah memakai 'cvLink' dengan benar;
        // file ini sebelumnya memakai nama field yang salah sehingga tombol CV di
        // tabel Database SELALU tampil "Kosong" walau CV sebenarnya ada di Sheet.
        // Fallback ke c.cv tetap dipertahankan untuk kompatibilitas mundur, kalau-kalau
        // ada baris data lama yang memakai nama field itu.
        const cvLink = (c.cvLink || c.cv || '').trim();
        let cvButtonHTML = '';
        
        if (cvLink !== '' && cvLink.toLowerCase() !== 'belum response' && cvLink.toLowerCase().includes('http')) {
            cvButtonHTML = `
                <a href="${cvLink}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white border border-blue-200 transition-colors shadow-sm cursor-pointer">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Buka CV
                </a>
            `;
        } else {
            cvButtonHTML = `
                <button disabled class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold border border-slate-200 cursor-not-allowed">
                    <i class="fa-solid fa-file-circle-xmark"></i> Kosong
                </button>
            `;
        }

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition text-sm">
                <td class="p-4 font-bold text-slate-800">
                    ${c.name || 'Tanpa Nama'} 
                    <div class="text-xs text-slate-400 font-normal font-mono">ID: ${c.id || '-'}</div>
                </td>
                <td class="p-4 text-slate-600 font-medium">${c.position || '-'}</td>
                <td class="p-4">${waButtonHTML}</td>
                <td class="p-4">${cvButtonHTML}</td>
                <td class="p-4">${statusBadge}</td>
                <td class="p-4 text-xs">${duplicateInfo}</td>
            </tr>
        `;
    });

    // Render navigasi halaman (pagination)
    renderPaginationControls(totalPages, filtered.length);
    updateDatabaseSortIndicators();
}

// Fungsi bantu untuk menampilkan tombol navigasi halaman (Prev / Next) + pemilih jumlah baris
function renderPaginationControls(totalPages, totalFilteredRows) {
    let paginationContainer = document.getElementById('db-pagination-controls');
    
    if (!paginationContainer) {
        const tableWrapper = document.querySelector('#view-database .bg-white');
        if (tableWrapper) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'db-pagination-controls';
            paginationContainer.className = "p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-3 text-sm text-slate-600";
            tableWrapper.appendChild(paginationContainer);
        } else {
            return;
        }
    }

    // PERBAIKAN (permintaan user, poin 5): tambahkan pemilih "tampilkan N baris"
    // supaya user bisa melihat lebih banyak data sekaligus, bukan cuma 25/halaman.
    const pageSizeSelector = `
        <label class="flex items-center gap-2 text-xs text-slate-500">
            Tampilkan
            <select onchange="setDatabaseRowsPerPage(this.value)" class="border border-slate-300 rounded-lg text-xs px-2 py-1 outline-none cursor-pointer">
                <option value="25" ${rowsPerPage === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${rowsPerPage === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${rowsPerPage === 100 ? 'selected' : ''}>100</option>
                <option value="all" ${!Number.isFinite(rowsPerPage) ? 'selected' : ''}>Semua</option>
            </select>
            baris
        </label>
    `;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = `
            ${pageSizeSelector}
            <span class="text-xs text-slate-400">Menampilkan seluruh ${totalFilteredRows.toLocaleString()} data</span>
        `;
        return;
    }

    paginationContainer.innerHTML = `
        ${pageSizeSelector}
        <span class="text-xs text-slate-500">Halaman ${currentDatabasePage} dari ${totalPages} (Total ${totalFilteredRows.toLocaleString()} data)</span>
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
