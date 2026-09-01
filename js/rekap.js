let currentRekapMode = "detail";
let filteredRekapData = [];
let currentRekapPage = 1;
const rekapRowsPerPage = 10;

async function muatRekapNilai() {
  document.getElementById("tabelRekap").innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">Mengambil rekap nilai...</td></tr>';
  try {
    let res = await fetch(`${API_URL}?action=getNilai`);
    let result = await res.json();
    let semAktif = String(infoSekolah.semester || "1").trim();

    if (result.status === "success" && result.data.length > 0) {
      listNilaiData = result.data.filter(n => {
        let nSem = (n.semester !== undefined && n.semester !== "") ? String(n.semester).trim() : "1";
        return nSem === semAktif;
      });
      
      populateFilterMapel();
      filterDanRenderRekap();
    } else {
      document.getElementById("tabelRekap").innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">Belum ada data nilai tersimpan.</td></tr>';
    }
  } catch (err) {
    document.getElementById("tabelRekap").innerHTML = '<tr><td colspan="7" class="text-center text-danger py-3">Gagal memuat rekap data.</td></tr>';
  }
}

function populateFilterMapel() {
  let select = document.getElementById("rekapFilterMapel");
  if (!select) return;
  let html = '<option value="">-- Semua Mapel --</option>';
  listMapelData.forEach(m => {
    html += `<option value="${m.id_mapel}">${m.nama_mapel}</option>`;
  });
  select.innerHTML = html;
}

function gantiModeRekap(mode) {
  currentRekapMode = mode;
  let btnDetail = document.getElementById("btnModeDetail");
  let btnLeger = document.getElementById("btnModeLeger");
  let boxDetail = document.getElementById("containerRekapDetail");
  let boxLeger = document.getElementById("containerRekapLeger");

  if (mode === "detail") {
    btnDetail.className = "btn btn-primary btn-sm fw-bold active";
    btnLeger.className = "btn btn-outline-primary btn-sm fw-bold";
    boxDetail.style.display = "block";
    boxLeger.style.display = "none";
  } else {
    btnLeger.className = "btn btn-primary btn-sm fw-bold active";
    btnDetail.className = "btn btn-outline-primary btn-sm fw-bold";
    boxDetail.style.display = "none";
    boxLeger.style.display = "block";
  }
  filterDanRenderRekap();
}

function filterDanRenderRekap() {
  let search = (document.getElementById("rekapSearch")?.value || "").toLowerCase().trim();
  let filterMapel = (document.getElementById("rekapFilterMapel")?.value || "").toUpperCase().trim();
  let filterAsesmen = (document.getElementById("rekapFilterAsesmen")?.value || "").toUpperCase().trim();

  // Filter Data Utama
  filteredRekapData = listNilaiData.filter(n => {
    let s = listSiswaData.find(x => String(x.id_siswa).trim() === String(n.id_siswa).trim());
    let namaSiswa = s ? s.nama_lengkap.toLowerCase() : "";
    
    let matchSearch = search === "" || namaSiswa.includes(search);
    let matchMapel = filterMapel === "" || String(n.id_mapel).trim().toUpperCase() === filterMapel;
    let matchAsesmen = filterAsesmen === "" || String(n.jenis_asesmen || "LM").trim().toUpperCase() === filterAsesmen;

    return matchSearch && matchMapel && matchAsesmen;
  });

  document.getElementById("rekapInfoTotal").innerText = `Total: ${filteredRekapData.length} Data`;

  if (currentRekapMode === "detail") {
    renderTabelDetail();
  } else {
    renderTabelLeger();
  }
}

function renderTabelDetail() {
  let totalRows = filteredRekapData.length;
  let totalPages = Math.ceil(totalRows / rekapRowsPerPage) || 1;
  if (currentRekapPage > totalPages) currentRekapPage = totalPages;

  let startIndex = (currentRekapPage - 1) * rekapRowsPerPage;
  let endIndex = startIndex + rekapRowsPerPage;
  let pageData = filteredRekapData.slice(startIndex, endIndex);

  let container = document.getElementById("tabelRekap");
  if (pageData.length === 0) {
    container.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">Tidak ada data nilai yang cocok.</td></tr>';
    renderPaginationNav(0, 1);
    return;
  }

  let html = "";
  pageData.forEach((n, idx) => {
    let s = listSiswaData.find(x => String(x.id_siswa).trim() === String(n.id_siswa).trim());
    let namaSiswa = s ? s.nama_lengkap : `ID: ${n.id_siswa}`;

    let m = listMapelData.find(x => String(x.id_mapel).trim().toUpperCase() === String(n.id_mapel).trim().toUpperCase());
    let namaMapel = m ? m.nama_mapel : n.id_mapel;

    let jenisLabel = n.jenis_asesmen || "LM";
    let badgeJenis = jenisLabel === "LM" ? "bg-primary" : (jenisLabel === "STS" ? "bg-warning text-dark" : "bg-danger");

    let narasi = "-";
    if (jenisLabel === "LM") {
      let tpObj = listTPData.find(x => 
        String(x.id_tp).trim().toUpperCase() === String(n.id_tp).trim().toUpperCase() && 
        String(x.id_mapel).trim().toUpperCase() === String(n.id_mapel).trim().toUpperCase()
      );
      narasi = tpObj ? tpObj.narasi_tp : "Deskripsi TP belum diatur";
    } else {
      narasi = `Nilai Evaluasi Tes ${jenisLabel}`;
    }

    let deskripsi = n.nilai_angka >= 75 
      ? `Menunjukkan penguasaan yang sangat baik dalam ${narasi}.`
      : `Perlu bimbingan lebih lanjut dalam ${narasi}.`;

    html += `
      <tr>
        <td class="text-center">${startIndex + idx + 1}</td>
        <td><strong>${namaSiswa}</strong></td>
        <td><span class="badge bg-secondary px-2 py-1">${namaMapel}</span></td>
        <td class="text-center"><span class="badge ${badgeJenis} px-2 py-1">${jenisLabel}</span></td>
        <td class="text-center"><span class="badge bg-info text-dark">${n.id_tp || '-'}</span></td>
        <td class="text-center fw-bold fs-6">${n.nilai_angka}</td>
        <td><small class="text-dark">${deskripsi}</small></td>
      </tr>
    `;
  });

  container.innerHTML = html;
  renderPaginationNav(totalRows, totalPages);
}

function renderPaginationNav(totalRows, totalPages) {
  document.getElementById("rekapPaginationInfo").innerText = `Menampilkan Halaman ${currentRekapPage} dari ${totalPages} (${totalRows} Data)`;
  
  let nav = document.getElementById("rekapPaginationNav");
  let html = "";

  html += `<li class="page-item ${currentRekapPage === 1 ? 'disabled' : ''}">
            <button class="page-item page-link" onclick="gantiHalamanRekap(${currentRekapPage - 1})">Previous</button>
           </li>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentRekapPage ? 'active' : ''}">
              <button class="page-item page-link" onclick="gantiHalamanRekap(${i})">${i}</button>
             </li>`;
  }

  html += `<li class="page-item ${currentRekapPage === totalPages ? 'disabled' : ''}">
            <button class="page-item page-link" onclick="gantiHalamanRekap(${currentRekapPage + 1})">Next</button>
           </li>`;

  nav.innerHTML = html;
}

function gantiHalamanRekap(page) {
  currentRekapPage = page;
  renderTabelDetail();
}

function renderTabelLeger() {
  let headerContainer = document.getElementById("headerLegerMatriks");
  let bodyContainer = document.getElementById("tabelLegerMatriks");

  if (listSiswaData.length === 0 || listMapelData.length === 0) {
    bodyContainer.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Data siswa / mapel belum tersedia.</td></tr>';
    return;
  }

  // Build Header
  let headerHtml = `<tr>
    <th style="width: 40px;">No</th>
    <th style="width: 220px;">Nama Siswa</th>`;
  
  listMapelData.forEach(m => {
    headerHtml += `<th>${m.nama_mapel}</th>`;
  });

  headerHtml += `<th style="width: 90px;" class="bg-primary text-white">Rata-Rata</th></tr>`;
  headerContainer.innerHTML = headerHtml;

  // Build Body (Rows per Siswa)
  let bodyHtml = "";
  let search = (document.getElementById("rekapSearch")?.value || "").toLowerCase().trim();

  let listSiswaFiltered = listSiswaData.filter(s => search === "" || s.nama_lengkap.toLowerCase().includes(search));

  listSiswaFiltered.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();
    let totalRataMapel = 0;
    let countMapelAdaNilai = 0;

    bodyHtml += `<tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${siswa.nama_lengkap}</strong></td>`;

    listMapelData.forEach(m => {
      let mKey = String(m.id_mapel).trim().toUpperCase();
      let nilaiSiswaMapel = listNilaiData.filter(n => 
        String(n.id_siswa).trim() === idS && 
        String(n.id_mapel).trim().toUpperCase() === mKey
      );

      if (nilaiSiswaMapel.length > 0) {
        let sum = 0;
        nilaiSiswaMapel.forEach(n => sum += parseFloat(n.nilai_angka || 0));
        let avg = Math.round(sum / nilaiSiswaMapel.length);
        
        totalRataMapel += avg;
        countMapelAdaNilai++;
        
        bodyHtml += `<td class="text-center fw-bold">${avg}</td>`;
      } else {
        bodyHtml += `<td class="text-center text-muted">-</td>`;
      }
    });

    let overallAvg = countMapelAdaNilai > 0 ? Math.round(totalRataMapel / countMapelAdaNilai) : "-";
    bodyHtml += `<td class="text-center fw-bold bg-primary bg-opacity-10 text-primary">${overallAvg}</td></tr>`;
  });

  bodyContainer.innerHTML = bodyHtml;
}

function renderTabCetakRapor() {
  let semAktif = String(infoSekolah.semester || "1").trim();
  let container = document.getElementById("tabelDaftarCetakSiswa");
  if (!container) return;

  if (listSiswaData.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Belum ada data siswa.</td></tr>';
    return;
  }

  let html = "";
  listSiswaData.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();

    let adaNilai = listNilaiData.some(n => {
      let nSem = (n.semester !== undefined && n.semester !== "") ? String(n.semester).trim() : "1";
      return String(n.id_siswa).trim() === idS && nSem === semAktif;
    });
    let adaAbs = listAbsensiData.some(a => String(a.id_siswa).trim() === idS && String(a.catatan_walikelas || "").trim() !== "");
    let adaKoku = listKokurikulerData.some(k => String(k.id_siswa).trim() === idS);

    let isFullyComplete = adaNilai && adaAbs && adaKoku;
    let badgeStatus = isFullyComplete 
      ? '<span class="badge bg-success px-2 py-1">🟢 Siap Cetak</span>' 
      : '<span class="badge bg-warning text-dark px-2 py-1">⚠️ Belum Lengkap</span>';

    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><small class="text-muted font-monospace">${siswa.nis} / ${siswa.nisn}</small></td>
        <td><strong>${siswa.nama_lengkap}</strong></td>
        <td class="text-center">${siswa.jenis_kelamin || 'L'}</td>
        <td class="text-center">${badgeStatus}</td>
        <td class="text-center">
          <button onclick="bukaPreviewRapor('${idS}')" class="btn btn-sm btn-outline-primary fw-bold px-3">
            🔍 Preview & Cetak
          </button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

function bukaPreviewRapor(idSiswa) {
  siswaAktifId = String(idSiswa).trim();
  renderLembarRapor();
  var myModal = new bootstrap.Modal(document.getElementById('modalCetak'));
  myModal.show();
}

function gantiJenisRapor() { if (siswaAktifId) renderLembarRapor(); }

function cetakSemuaRaporSeKelas() {
  if (listSiswaData.length === 0) { alert("Belum ada data siswa!"); return; }
  if (confirm(`Apakah Anda yakin ingin mencetak Rapor untuk seluruh siswa (${listSiswaData.length} Anak)?`)) {
    bukaPreviewRapor(listSiswaData[0].id_siswa);
    setTimeout(() => { window.print(); }, 500);
  }
}
