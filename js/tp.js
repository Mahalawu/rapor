let filteredTPData = [];
let currentTPPage = 1;
const tpRowsPerPage = 10;

function renderTabelTP() {
  let semAktif = String(infoSekolah.semester || "1").trim();
  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  
  // 1. Ambil data TP KHUSUS KELAS AKTIF & SEMESTER AKTIF
  let rawData = listTPData.filter(tp => {
    let tpSem = String(tp.semester || "1").trim();
    let tpKelas = String(tp.kelas || kAktif).trim();
    return tpSem === semAktif && tpKelas === kAktif;
  });

  // 2. Baca Filter & Search
  let filterMapel = (document.getElementById("tpFilterMapel")?.value || "").toUpperCase().trim();
  let search = (document.getElementById("tpSearch")?.value || "").toLowerCase().trim();

  filteredTPData = rawData.filter(tp => {
    let matchMapel = filterMapel === "" || String(tp.id_mapel || "").trim().toUpperCase() === filterMapel;
    let matchSearch = search === "" || 
                        String(tp.id_tp || "").toLowerCase().includes(search) || 
                        String(tp.narasi_tp || "").toLowerCase().includes(search);
    return matchMapel && matchSearch;
  });

  // 3. Render Baris Tabel Sesuai Halaman (Pagination)
  renderTabelTPRows();
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
    container.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Tidak ada data TP yang cocok.</td></tr>';
    renderTPPaginationNav(0, 1);
    return;
  }

  let html = "";
  pageData.forEach((tp, idx) => {
    let m = listMapelData.find(x => String(x.id_mapel).trim().toUpperCase() === String(tp.id_mapel).trim().toUpperCase());
    let namaMapel = m ? m.nama_mapel : tp.id_mapel;
    let idTpEsc = String(tp.id_tp).trim();
    let idMapelEsc = String(tp.id_mapel).trim();

    html += `
      <tr>
        <td class="text-center">${startIndex + idx + 1}</td>
        <td><span class="badge bg-secondary px-2 py-1">${namaMapel}</span></td>
        <td><span class="badge bg-info text-dark font-monospace px-2 py-1">${tp.id_tp}</span></td>
        <td>${tp.narasi_tp}</td>
        <td class="text-center">
          <button onclick="bukaModalEditTP('${idTpEsc}', '${idMapelEsc}')" class="btn btn-sm btn-outline-warning me-1" title="Edit TP">✏️</button>
          <button onclick="hapusTP('${idTpEsc}', '${idMapelEsc}')" class="btn btn-sm btn-outline-danger" title="Hapus TP">🗑️</button>
        </td>
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
  let selectSingle = document.getElementById("tp_single_mapel");
  let selectBulk = document.getElementById("tp_bulk_mapel");

  let html = '<option value="">-- Semua Mapel --</option>';
  let htmlSelect = '<option value="">-- Pilih Mapel --</option>';

  listMapelData.forEach(m => {
    html += `<option value="${m.id_mapel}">${m.nama_mapel}</option>`;
    htmlSelect += `<option value="${m.id_mapel}">${m.nama_mapel}</option>`;
  });

  if (select) select.innerHTML = html;
  if (selectSingle) selectSingle.innerHTML = htmlSelect;
  if (selectBulk) selectBulk.innerHTML = htmlSelect;
}

// 🎯 FUNGSI UTAMA 1: SIMPAN TP SINGLE / MANUAL
async function simpanTPSingle() {
  let idMapel = document.getElementById("tp_single_mapel")?.value;
  let kodeTP = document.getElementById("tp_single_kode")?.value?.trim().toUpperCase();
  let narasiTP = document.getElementById("tp_single_narasi")?.value?.trim();

  if (!idMapel) { alert("⚠️ Silakan pilih Mata Pelajaran terlebih dahulu!"); return; }
  if (!kodeTP) { alert("⚠️ Kode TP tidak boleh kosong! (Contoh: TP-01)"); return; }
  if (!narasiTP) { alert("⚠️ Narasi TP tidak boleh kosong!"); return; }

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  let semAktif = String(infoSekolah.semester || "1").trim();

  let payload = [{
    id_tp: kodeTP,
    id_mapel: idMapel,
    kelas: kAktif,
    semester: semAktif,
    narasi_tp: narasiTP
  }];

  let btn = document.querySelector("#tp-single button");
  if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Menyimpan..."; }

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanTP", data: payload })
    });

    let result = await response.json();
    if (result.status === "success") {
      alert("🎉 " + result.message);
      
      document.getElementById("tp_single_kode").value = "";
      document.getElementById("tp_single_narasi").value = "";

      listTPData.push(payload[0]);
      renderTabelTP();
    } else {
      alert("❌ Gagal: " + result.message);
    }
  } catch (err) {
    alert("❌ Kesalahan koneksi!");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = "💾 Tambahkan TP"; }
  }
}

// 🎯 FUNGSI UTAMA 2: SIMPAN TP BULK / IMPORT BANYAK
async function simpanTPBulk() {
  let idMapel = document.getElementById("tp_bulk_mapel")?.value;
  let bulkText = document.getElementById("tp_bulk_text")?.value?.trim();

  if (!idMapel) { alert("⚠️ Pilih Mata Pelajaran terlebih dahulu!"); return; }
  if (!bulkText) { alert("⚠️ Teks paste dari Excel tidak boleh kosong!"); return; }

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  let semAktif = String(infoSekolah.semester || "1").trim();

  let lines = bulkText.split("\n");
  let payloadList = [];

  lines.forEach(line => {
    let row = line.split("\t");
    if (row.length >= 2) {
      let kKode = row[0].trim().toUpperCase();
      let kNarasi = row[1].trim();
      if (kKode && kNarasi) {
        payloadList.push({
          id_tp: kKode,
          id_mapel: idMapel,
          kelas: kAktif,
          semester: semAktif,
          narasi_tp: kNarasi
        });
      }
    }
  });

  if (payloadList.length === 0) {
    alert("⚠️ Format Excel tidak sesuai! Pastikan minimal 2 kolom: [Kode TP] [Narasi TP]");
    return;
  }

  let btn = document.querySelector("#tp-bulk button");
  if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Memproses Import..."; }

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanTP", data: payloadList })
    });

    let result = await response.json();
    if (result.status === "success") {
      alert(`🎉 Berhasil mengimpor ${payloadList.length} TP!`);
      document.getElementById("tp_bulk_text").value = "";
      
      payloadList.forEach(item => listTPData.push(item));
      renderTabelTP();
    } else {
      alert("❌ Gagal: " + result.message);
    }
  } catch (err) {
    alert("❌ Kesalahan koneksi!");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = "🚀 Import Semua TP"; }
  }
}

// 🎯 FUNGSI EDIT MODAL TP
function bukaModalEditTP(idTp, idMapel) {
  let tpObj = listTPData.find(x => 
    String(x.id_tp).trim().toUpperCase() === String(idTp).trim().toUpperCase() &&
    String(x.id_mapel).trim().toUpperCase() === String(idMapel).trim().toUpperCase()
  );

  if (!tpObj) return;

  document.getElementById("edit_tp_kode_old").value = tpObj.id_tp;
  document.getElementById("edit_tp_mapel_old").value = tpObj.id_mapel;

  document.getElementById("edit_tp_kode").value = tpObj.id_tp;
  document.getElementById("edit_tp_narasi").value = tpObj.narasi_tp || "";
  document.getElementById("edit_tp_kelas").value = tpObj.kelas || infoSekolah.kelas || "5";
  document.getElementById("edit_tp_semester").value = tpObj.semester || infoSekolah.semester || "1";

  let selectMapel = document.getElementById("edit_tp_mapel");
  let htmlM = "";
  listMapelData.forEach(m => {
    let isSelected = String(m.id_mapel).trim().toUpperCase() === String(tpObj.id_mapel).trim().toUpperCase() ? "selected" : "";
    htmlM += `<option value="${m.id_mapel}" ${isSelected}>${m.nama_mapel}</option>`;
  });
  selectMapel.innerHTML = htmlM;

  let modal = new bootstrap.Modal(document.getElementById('modalEditTP'));
  modal.show();
}

// 🎯 FUNGSI SIMPAN EDIT TP
async function simpanEditTP() {
  let idTp = document.getElementById("edit_tp_kode").value.trim();
  let idMapel = document.getElementById("edit_tp_mapel").value.trim();
  let narasi = document.getElementById("edit_tp_narasi").value.trim();
  let kelas = document.getElementById("edit_tp_kelas").value.trim();
  let semester = document.getElementById("edit_tp_semester").value.trim();

  if (!narasi) { alert("Narasi TP tidak boleh kosong!"); return; }

  let payload = {
    id_tp: idTp,
    id_mapel: idMapel,
    kelas: kelas,
    semester: semester,
    narasi_tp: narasi
  };

  let btn = document.getElementById("btnSimpanEditTP");
  btn.disabled = true; btn.innerHTML = "⏳ Menyimpan...";

  try {
    let res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "editTP", data: payload })
    });
    let result = await res.json();

    if (result.status === "success") {
      alert("🎉 " + result.message);
      
      let idx = listTPData.findIndex(x => 
        String(x.id_tp).trim().toUpperCase() === idTp.toUpperCase() &&
        String(x.id_mapel).trim().toUpperCase() === idMapel.toUpperCase()
      );
      if (idx >= 0) {
        listTPData[idx].narasi_tp = narasi;
      }

      renderTabelTP();
      
      let modalEl = document.getElementById('modalEditTP');
      let modalObj = bootstrap.Modal.getInstance(modalEl);
      if (modalObj) modalObj.hide();
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (err) {
    alert("Kesalahan koneksi!");
  } finally {
    btn.disabled = false; btn.innerHTML = "💾 Simpan Perubahan";
  }
}

// 🎯 FUNGSI HAPUS TP DENGAN PROTEKSI INTEGRITAS DATA NILAI
async function hapusTP(idTp, idMapel) {
  let idTpClean = String(idTp).trim().toUpperCase();
  let idMapelClean = String(idMapel).trim().toUpperCase();

  let nilaiTerhubung = listNilaiData.filter(n => 
    String(n.id_tp || "").trim().toUpperCase() === idTpClean &&
    String(n.id_mapel || "").trim().toUpperCase() === idMapelClean
  );

  if (nilaiTerhubung.length > 0) {
    alert(
      `⚠️ TIDAK BISA DIHAPUS!\n\n` +
      `Tujuan Pembelajaran (Kode: ${idTp}) tidak dapat dihapus karena sudah terhubung dengan ${nilaiTerhubung.length} data nilai siswa.\n\n` +
      `Hapus terlebih dahulu nilai siswa terkait di tab "Input Nilai" atau "Rekap Nilai" jika Anda benar-benar ingin menghapus TP ini.`
    );
    return;
  }

  if (!confirm(`Apakah Anda yakin ingin menghapus TP (${idTp})?`)) {
    return;
  }

  try {
    let res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "hapusTP", id_tp: idTp, id_mapel: idMapel })
    });
    let result = await res.json();

    if (result.status === "success") {
      alert("🗑️ " + result.message);
      
      listTPData = listTPData.filter(x => !(
        String(x.id_tp).trim().toUpperCase() === idTpClean &&
        String(x.id_mapel).trim().toUpperCase() === idMapelClean
      ));

      renderTabelTP();
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (err) {
    alert("Kesalahan koneksi!");
  }
}
