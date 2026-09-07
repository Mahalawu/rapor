let filteredTPData = [];
let currentTPPage = 1;
const tpRowsPerPage = 10;

function renderTabelTP() {
  let search = (document.getElementById("tpSearch")?.value || "").toLowerCase().trim();
  let filterMapel = (document.getElementById("tpFilterMapel")?.value || "").toUpperCase().trim();
  
  // 🎯 BACA KELAS & SEMESTER AKTIF APLIKASI
  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  let semAktif = String(infoSekolah.semester || "1").trim();

  // 🎯 FILTER TP HANYA UNTUK KELAS & SEMESTER AKTIF
  let filteredTP = listTPData.filter(tp => {
    let tpKelas = String(tp.kelas || "5").trim();
    let tpSem = String(tp.semester || "1").trim();
    
    let matchKelasSem = (tpKelas === kAktif) && (tpSem === semAktif);
    
    let matchSearch = search === "" || 
                      String(tp.id_tp).toLowerCase().includes(search) || 
                      String(tp.narasi_tp).toLowerCase().includes(search);
                      
    let matchMapel = filterMapel === "" || String(tp.id_mapel).trim().toUpperCase() === filterMapel;

    return matchKelasSem && matchSearch && matchMapel;
  });

  let totalRows = filteredTP.length;
  let totalPages = Math.ceil(totalRows / tpRowsPerPage) || 1;
  if (currentTPPage > totalPages) currentTPPage = totalPages;

  let startIndex = (currentTPPage - 1) * tpRowsPerPage;
  let endIndex = startIndex + tpRowsPerPage;
  let pageData = filteredTP.slice(startIndex, endIndex);

  let container = document.getElementById("tabelListTP");
  if (!container) return;

  if (pageData.length === 0) {
    container.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Belum ada data TP tersimpan untuk Kelas ${kAktif} Semester ${semAktif}.</td></tr>`;
    renderPaginationNavTP(0, 1);
    return;
  }

  let html = "";
  pageData.forEach((tp, idx) => {
    let m = listMapelData.find(x => String(x.id_mapel).trim().toUpperCase() === String(tp.id_mapel).trim().toUpperCase());
    let namaMapel = m ? m.nama_mapel : tp.id_mapel;

    html += `
      <tr>
        <td class="text-center">${startIndex + idx + 1}</td>
        <td><span class="badge bg-secondary px-2 py-1">${namaMapel}</span></td>
        <td><span class="badge bg-info text-dark">${tp.id_tp}</span></td>
        <td>${tp.narasi_tp}</td>
      </tr>
    `;
  });

  container.innerHTML = html;
  renderPaginationNavTP(totalRows, totalPages);
}

function renderTabelTPRows() {
  let container = document.getElementById("tabelListTP");
  if (!container) return;

  let totalRows = filteredTPData.length;
  let totalPages = Math.ceil(totalRows / tpRowsPerPage) || 1;
  if (currentTPPage > totalPages) currentTPPage = totalPages;

  let startIndex = (currentTPPage - 1) * tpRowsPerPage;
  let endIndex = startIndex + tpRowsPerPage;
  let pageData = filteredTPData.slice(startIndex, endIndex);

  if (pageData.length === 0) {
    container.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Tidak ada data TP yang cocok.</td></tr>';
    renderTPPaginationNav(0, 1);
    return;
  }

  let html = "";
  pageData.forEach((tp, idx) => {
    let m = listMapelData.find(x => String(x.id_mapel).trim().toUpperCase() === String(tp.id_mapel).trim().toUpperCase());
    let namaMapel = m ? m.nama_mapel : tp.id_mapel;

    html += `
      <tr>
        <td class="text-center">${startIndex + idx + 1}</td>
        <td><span class="badge bg-secondary px-2 py-1">${namaMapel}</span></td>
        <td><span class="badge bg-info text-dark font-monospace px-2 py-1">${tp.id_tp}</span></td>
        <td>${tp.narasi_tp}</td>
      </tr>
    `;
  });

  container.innerHTML = html;
  renderTPPaginationNav(totalRows, totalPages);
}

function renderTPPaginationNav(totalRows, totalPages) {
  let infoEl = document.getElementById("tpPaginationInfo");
  let navEl = document.getElementById("tpPaginationNav");

  if (infoEl) {
    infoEl.innerText = totalRows > 0 
      ? `Menampilkan Halaman ${currentTPPage} dari ${totalPages} (${totalRows} TP)` 
      : `Halaman 1 dari 1 (0 TP)`;
  }
  
  if (!navEl) return;
  let html = "";

  html += `<li class="page-item ${currentTPPage <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="gantiHalamanTP(${currentTPPage - 1})">Previous</button>
           </li>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentTPPage ? 'active' : ''}">
              <button class="page-link" onclick="gantiHalamanTP(${i})">${i}</button>
             </li>`;
  }

  html += `<li class="page-item ${currentTPPage >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="gantiHalamanTP(${currentTPPage + 1})">Next</button>
           </li>`;

  navEl.innerHTML = html;
}

function gantiHalamanTP(page) {
  if (page < 1) return;
  currentTPPage = page;
  renderTabelTPRows();
}

function populateFilterMapelTP() {
  let select = document.getElementById("tpFilterMapel");
  if (!select) return;
  let html = '<option value="">-- Semua Mapel --</option>';
  listMapelData.forEach(m => {
    html += `<option value="${m.id_mapel}">${m.nama_mapel}</option>`;
  });
  select.innerHTML = html;
}
