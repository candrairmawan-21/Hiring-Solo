// ==========================================
// FILE: js/database.js
// KETERANGAN: Mengelola Tabel Master, Pencarian Arsip, & Pagination untuk Ribuan Data Kandidat.
// ==========================================

let currentDatabasePage = 1;
let rowsPerPage = 25; // Bisa diubah user lewat dropdown di footer tabel (25/50/100/Semua)
let databaseStatusFilter = 'all';
let databaseSortKey = null;   // 'name' | 'position' | 'status'
let databaseSortAsc = true;

function renderDatabaseTable(allCandidates, searchTerm = '') {
    const tbody = document.getElementById('database-table-body');
    const totalCountEl = document.getElementById('db-total-count');

    if (!tbody) return;
    tbody.innerHTML = '';

    // PERBAIKAN AUDIT: guard supaya tidak crash kalau data bukan array
    // (perbaikan utamanya di js/api.js).
    if (!Array.isArray(allCandidates)) {
        console.error("renderDatabaseTable: data yang diterima bukan array.", allCandidates);
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-rose-500 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Gagal memuat data (format data tidak valid). Cek console untuk detail.</td></tr>`;
        if (totalCountEl) totalCountEl.innerText = '0 Total Data';
        return;
    }

    // 1. Filter data berdasarkan pencarian (nama, nomor HP dengan aman, atau posisi)
    const query = searchTerm.toLowerCase();
    let filtered = allCandidates.filter(c => {
        const nameMatch = (c.name || '').toLowerCase().includes(query);
        const phoneMatch = (c.phone || '').toString().toLowerCase().includes(query);
        const posMatch = (c.position || '').toLowerCase().includes(query);
        return nameMatch || phoneMatch || posMatch;
    });

    // 1b. BARU: filter berdasarkan tahapan/status (memakai getCandidateStage -> konsisten
    // dengan Dashboard & Pipeline, bukan membaca kolom V mentah yang sering kosong).
    if (databaseStatusFilter !== 'all') {
        filtered = filtered.filter(c => getCandidateStage(c).step === databaseStatusFilter);
    }

    // 1c. BARU: sorting berdasarkan kolom yang diklik user.
    if (databaseSortKey) {
        const dir = databaseSortAsc ? 1 : -1;
        filtered = [...filtered].sort((a, b) => {
            let va, vb;
            if (databaseSortKey === 'status') {
                va = getCandidateStage(a).label;
                vb = getCandidateStage(b).label;
            } else {
                va = (a[databaseSortKey] || '').toString();
                vb = (b[databaseSortKey] || '').toString();
            }
            return va.localeCompare(vb, 'id') * dir;
        });
    }

    if (totalCountEl) {
        totalCountEl.innerText = `${filtered.length.toLocaleString()} Total Data`;
    }

    // 2. Logika Pagination (Membagi data per halaman). rowsPerPage <= 0 berarti "Semua".
    const showAll = rowsPerPage <= 0;
    const totalPages = showAll ? 1 : (Math.ceil(filtered.length / rowsPerPage) || 1);
    if (currentDatabasePage > totalPages) currentDatabasePage = totalPages;
    if (currentDatabasePage < 1) currentDatabasePage = 1;

    const startIndex = showAll ? 0 : (currentDatabasePage - 1) * rowsPerPage;
    const paginatedData = showAll ? filtered : filtered.slice(startIndex, startIndex + rowsPerPage);

    // 3. Tampilkan pesan kosong jika data tidak ditemukan
    if (paginatedData.length === 0) {
        // colspan="6": Nama, Posisi, WA, CV, Status, Duplikat
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">Tidak ada data kandidat yang ditemukan.</td></tr>`;
        renderPaginationControls(0, 0);
        return;
    }

    // 4. Render baris data ke dalam tabel
    const rowsHTML = paginatedData.map(c => {
        // PERBAIKAN AUDIT: badge status sekarang memakai getCandidateStage() (js/api.js)
        // — SATU sumber logika bersama Dashboard/Pipeline/Screening. Sebelumnya file ini
        // punya rantai if/else sendiri yang HANYA membaca kolom V, sehingga kandidat yang
        // sudah Shortlist di kolom M tapi V-nya masih kosong SELALU tampil "Baru / RAW".
        const stage = getCandidateStage(c);
        const statusBadge = `<span class="${stageToneClasses(stage.tone)} px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" title="${stage.detail}">${stage.label}</span>`;

        const duplicateInfo = c.isDuplicate
            ? '<span class="text-rose-600 font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> Duplikat</span>'
            : '<span class="text-slate-400">Aman</span>';

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
        // Field yang benar adalah cvLink (dipakai konsisten oleh screening.js & pipeline.js);
        // fallback ke c.cv untuk kompatibilitas data lama.
        const cvLink = (c.cvLink || c.cv || '').toString().trim();
        let cvButtonHTML;
        if (cvLink !== '' && cvLink.toLowerCase() !== 'belum response' && cvLink.toLowerCase().includes('http')) {
            cvButtonHTML = `
                <a href="${cvLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white border border-blue-200 transition-colors shadow-sm cursor-pointer">
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

        return `
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
    }).join('');

    // PERBAIKAN PERFORMA: disusun sebagai string dulu lalu di-inject SEKALI, bukan
    // `tbody.innerHTML +=` di dalam loop (yang memaksa browser re-parse seluruh tabel
    // setiap baris — sangat lambat untuk ribuan data).
    tbody.innerHTML = rowsHTML;

    renderPaginationControls(totalPages, filtered.length);
    renderSortIndicators();
}

// BARU: ubah jumlah baris per halaman (dipanggil dropdown di footer tabel).
function changeDatabaseRowsPerPage(value) {
    rowsPerPage = parseInt(value, 10);
    if (isNaN(rowsPerPage)) rowsPerPage = 25;
    currentDatabasePage = 1;
    if (typeof refreshDatabaseView === 'function') refreshDatabaseView();
}

// BARU: filter berdasarkan tahapan kandidat.
function changeDatabaseStatusFilter(value) {
    databaseStatusFilter = value || 'all';
    currentDatabasePage = 1;
    if (typeof refreshDatabaseView === 'function') refreshDatabaseView();
}

// BARU: urutkan berdasarkan kolom (klik header). Klik kolom yang sama = toggle asc/desc.
function sortDatabaseBy(key) {
    if (databaseSortKey === key) {
        databaseSortAsc = !databaseSortAsc;
    } else {
        databaseSortKey = key;
        databaseSortAsc = true;
    }
    currentDatabasePage = 1;
    if (typeof refreshDatabaseView === 'function') refreshDatabaseView();
}

// Tampilkan ikon panah pada header kolom yang sedang dipakai untuk mengurut.
function renderSortIndicators() {
    ['name', 'position', 'status'].forEach(key => {
        const el = document.getElementById(`db-sort-icon-${key}`);
        if (!el) return;
        if (databaseSortKey !== key) {
            el.className = 'fa-solid fa-sort text-slate-300 ml-1';
        } else {
            el.className = `fa-solid ${databaseSortAsc ? 'fa-sort-up' : 'fa-sort-down'} text-blue-500 ml-1`;
        }
    });
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

    const rowsSelector = `
        <label class="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            Baris:
            <select onchange="changeDatabaseRowsPerPage(this.value)" class="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer">
                <option value="25" ${rowsPerPage === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${rowsPerPage === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${rowsPerPage === 100 ? 'selected' : ''}>100</option>
                <option value="-1" ${rowsPerPage <= 0 ? 'selected' : ''}>Semua</option>
            </select>
        </label>
    `;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = `
            ${rowsSelector}
            <span class="text-xs text-slate-400">Menampilkan seluruh ${totalFilteredRows.toLocaleString()} data</span>
        `;
        return;
    }

    paginationContainer.innerHTML = `
        ${rowsSelector}
        <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500">Halaman ${currentDatabasePage} dari ${totalPages} (Total ${totalFilteredRows.toLocaleString()} data)</span>
            <div class="flex gap-2">
                <button onclick="changeDatabasePage(-1)" ${currentDatabasePage === 1 ? 'disabled class="opacity-50 cursor-not-allowed bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold"' : 'class="bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"'}>
                    <i class="fa-solid fa-chevron-left"></i> Prev
                </button>
                <button onclick="changeDatabasePage(1)" ${currentDatabasePage === totalPages ? 'disabled class="opacity-50 cursor-not-allowed bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold"' : 'class="bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"'}>
                    Next <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>
        </div>
    `;
}

function changeDatabasePage(direction) {
    currentDatabasePage += direction;
    if (typeof refreshDatabaseView === 'function') {
        refreshDatabaseView();
    }
}
