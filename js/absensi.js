let currentPresensiMode = "harian";

function renderPresensiHarianForm() {
  renderTabelPresensiHarian();
  populateDropdownSiswaAbsensi();
}

function muatPresensiHarianTanggal() {
  renderTabelPresensiHarian();
}

function gantiModePresensi(mode) {
  currentPresensiMode = mode;
  let btnHarian = document.getElementById("btnModeHarian");
  let btnRapor = document.getElementById("btnModeRapor");
  let boxHarian = document.getElementById("containerPresensiHarian");
  let boxRapor = document.getElementById("containerPresensiRapor");

  if (mode === "harian") {
    if (btnHarian) btnHarian.className = "btn btn-primary btn-sm fw-bold active";
    if (btnRapor) btnRapor.className = "btn btn-outline-primary btn-sm fw-bold";
    if (boxHarian) boxHarian.style.display = "block";
    if (boxRapor) boxRapor.style.display = "none";
    renderTabelPresensiHarian();
  } else {
    if (btnRapor) btnRapor.className = "btn btn-primary btn-sm fw-bold active";
    if (btnHarian) btnHarian.className = "btn btn-outline-primary btn-sm fw-bold";
    if (boxHarian) boxHarian.style.display = "none";
    if (boxRapor) boxRapor.style.display = "block";
    populateDropdownSiswaAbsensi();
  }
}

// 🎯 POPULATE DROPDOWN SISWA (HANYA KELAS AKTIF)
function populateDropdownSiswaAbsensi() {
  let select = document.getElementById("selectSiswaAbsensi");
  if (!select) return;

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  let siswaAktifList = listSiswaData.filter(s => String(s.kelas || "5").trim() === kAktif);

  let html = '<option value="">-- Pilih Siswa --</option>';
  siswaAktifList.forEach(s => {
    html += `<option value="${s.id_siswa}">${s.nama_lengkap} (Kelas ${kAktif})</option>`;
  });
  select.innerHTML = html;
}

// 🎯 EVENT SAAT SISWA DIPILIH DARI DROPDOWN
function pilihSiswaAbsensi() {
  let idSiswa = document.getElementById("selectSiswaAbsensi")?.value;
  let formBody = document.getElementById("formAbsensiBody");
  if (!formBody) return;

  if (!idSiswa) {
    formBody.style.display = "none";
    return;
  }

  formBody.style.display = "block";

  // Hitung otomatis dari presensi harian
  let logsSiswa = listPresensiHarianData.filter(x => String(x.id_siswa).trim() === String(idSiswa).trim());
  let autoSakit = logsSiswa.filter(x => x.status_kehadiran === "S").length;
  let autoIzin = logsSiswa.filter(x => x.status_kehadiran === "I").length;
  let autoAlpa = logsSiswa.filter(x => x.status_kehadiran === "A").length;

  // Cek jika sudah ada data tersimpan di database
  let abs = listAbsensiData.find(x => String(x.id_siswa).trim() === String(idSiswa).trim());

  document.getElementById("abs_sakit").value = abs && abs.sakit !== undefined ? abs.sakit : autoSakit;
  document.getElementById("abs_izin").value = abs && abs.izin !== undefined ? abs.izin : autoIzin;
  document.getElementById("abs_alpa").value = abs && abs.tanpa_keterangan !== undefined ? abs.tanpa_keterangan : autoAlpa;
  document.getElementById("abs_catatan").value = abs ? (abs.catatan_walikelas || "") : "";

  // Set Ekskul
  document.getElementById("abs_ekskul1").value = abs?.ekskul_1 || "Pramuka";
  document.getElementById("abs_nilaiEkskul1").value = abs?.nilai_ekskul_1 || "Baik";
  document.getElementById("abs_ketEkskul1").value = abs?.keterangan_ekskul_1 || "";

  if (abs?.ekskul_2) {
    document.getElementById("box_ekskul_2").style.display = "flex";
    document.getElementById("abs_ekskul2").value = abs.ekskul_2;
    document.getElementById("abs_nilaiEkskul2").value = abs.nilai_ekskul_2 || "Baik";
    document.getElementById("abs_ketEkskul2").value = abs.keterangan_ekskul_2 || "";
  } else {
    document.getElementById("box_ekskul_2").style.display = "none";
  }

  if (abs?.ekskul_3) {
    document.getElementById("box_ekskul_3").style.display = "flex";
    document.getElementById("abs_ekskul3").value = abs.ekskul_3;
    document.getElementById("abs_nilaiEkskul3").value = abs.nilai_ekskul_3 || "Baik";
    document.getElementById("abs_ketEkskul3").value = abs.keterangan_ekskul_3 || "";
  } else {
    document.getElementById("box_ekskul_3").style.display = "none";
  }
}

// 🎯 DYNAMIC ROW EKSKUL
function tambahRowEkskul() {
  let box2 = document.getElementById("box_ekskul_2");
  let box3 = document.getElementById("box_ekskul_3");

  if (box2.style.display === "none" || box2.style.display === "") {
    box2.style.display = "flex";
  } else if (box3.style.display === "none" || box3.style.display === "") {
    box3.style.display = "flex";
  } else {
    alert("Maksimal 3 Ekstrakurikuler!");
  }
}

function hapusRowEkskul(num) {
  let box = document.getElementById(`box_ekskul_${num}`);
  if (box) {
    box.style.display = "none";
    document.getElementById(`abs_ekskul${num}`).value = "";
    document.getElementById(`abs_ketEkskul${num}`).value = "";
  }
}

// 🎯 1. RENDER TABEL PRESENSI HARIAN
function renderTabelPresensiHarian() {
  let container = document.getElementById("tabelPresensiHarianBody") || document.getElementById("tabelPresensiHarian");
  if (!container) return;

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  let siswaAktifList = listSiswaData.filter(s => String(s.kelas || "5").trim() === kAktif);

  if (siswaAktifList.length === 0) {
    container.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Belum ada data siswa untuk Kelas ${kAktif}.</td></tr>`;
    return;
  }

  let tglEl = document.getElementById("tglPresensiHarian") || document.getElementById("inputTanggalPresensi");
  if (tglEl && !tglEl.value) {
    tglEl.value = new Date().toISOString().split("T")[0];
  }
  let tglInput = tglEl?.value || new Date().toISOString().split("T")[0];

  let html = "";
  siswaAktifList.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();
    
    let logEksis = listPresensiHarianData.filter(x => 
      String(x.id_siswa).trim() === idS && 
      String(x.tanggal).split("T")[0] === tglInput
    );

    let st = logEksis.length > 0 ? logEksis[0].status_kehadiran : "H";

    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${siswa.nama_lengkap}</strong></td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group" aria-label="Status ${idS}">
            <input type="radio" class="btn-check" name="pres_${idS}" id="h_${idS}" value="H" ${st === 'H' ? 'checked' : ''}>
            <label class="btn btn-outline-success" for="h_${idS}">Hadir</label>

            <input type="radio" class="btn-check" name="pres_${idS}" id="s_${idS}" value="S" ${st === 'S' ? 'checked' : ''}>
            <label class="btn btn-outline-warning" for="s_${idS}">Sakit</label>

            <input type="radio" class="btn-check" name="pres_${idS}" id="i_${idS}" value="I" ${st === 'I' ? 'checked' : ''}>
            <label class="btn btn-outline-info" for="i_${idS}">Izin</label>

            <input type="radio" class="btn-check" name="pres_${idS}" id="a_${idS}" value="A" ${st === 'A' ? 'checked' : ''}>
            <label class="btn btn-outline-danger" for="a_${idS}">Alpa</label>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

// 💾 SIMPAN PRESENSI HARIAN
async function simpanPresensiHarian() {
  let tglEl = document.getElementById("tglPresensiHarian") || document.getElementById("inputTanggalPresensi");
  let tglInput = tglEl?.value;
  if (!tglInput) { alert("Pilih tanggal presensi!"); return; }

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  let siswaAktifList = listSiswaData.filter(s => String(s.kelas || "5").trim() === kAktif);

  let payloadPresensi = [];
  siswaAktifList.forEach(siswa => {
    let idS = String(siswa.id_siswa).trim();
    let selectedRadio = document.querySelector(`input[name="pres_${idS}"]:checked`);
    let valSt = selectedRadio ? selectedRadio.value : "H";

    payloadPresensi.push({
      id_siswa: idS,
      status_kehadiran: valSt
    });
  });

  let btn = document.getElementById("btnSimpanHarian") || document.getElementById("btnSimpanPresensi");
  if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Menyimpan..."; }

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "simpanPresensiHarian",
        tanggal: tglInput,
        data: payloadPresensi
      })
    });

    let result = await response.json();
    if (result.status === "success") {
      alert("🎉 " + result.message);
      
      listPresensiHarianData = listPresensiHarianData.filter(x => String(x.tanggal).split("T")[0] !== tglInput);
      payloadPresensi.forEach(p => {
        if (p.status_kehadiran !== "H") {
          listPresensiHarianData.push({
            id_presensi: "PRES-TEMP",
            tanggal: tglInput,
            id_siswa: p.id_siswa,
            status_kehadiran: p.status_kehadiran
          });
        }
      });    
      if (typeof filterDanRenderPresensiHistori === "function") {
        filterDanRenderPresensiHistori();
      }
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (err) {
    alert("Kesalahan koneksi!");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = "💾 Simpan Presensi Tanggal Ini"; }
  }
}

// 💾 SIMPAN ABSENSI & CATATAN RAPOR DARI FORM UTAMA
async function simpanAbsensiSiswa() {
  let idSiswa = document.getElementById("selectSiswaAbsensi")?.value;
  if (!idSiswa) { alert("Pilih siswa terlebih dahulu!"); return; }

  let payload = {
    id_siswa: idSiswa,
    sakit: parseInt(document.getElementById("abs_sakit")?.value || 0),
    izin: parseInt(document.getElementById("abs_izin")?.value || 0),
    tanpa_keterangan: parseInt(document.getElementById("abs_alpa")?.value || 0),
    ekskul_1: document.getElementById("abs_ekskul1")?.value || "",
    nilai_ekskul_1: document.getElementById("abs_nilaiEkskul1")?.value || "",
    keterangan_ekskul_1: document.getElementById("abs_ketEkskul1")?.value || "",
    ekskul_2: document.getElementById("abs_ekskul2")?.value || "",
    nilai_ekskul_2: document.getElementById("abs_nilaiEkskul2")?.value || "",
    keterangan_ekskul_2: document.getElementById("abs_ketEkskul2")?.value || "",
    ekskul_3: document.getElementById("abs_ekskul3")?.value || "",
    nilai_ekskul_3: document.getElementById("abs_nilaiEkskul3")?.value || "",
    keterangan_ekskul_3: document.getElementById("abs_ketEkskul3")?.value || "",
    catatan_walikelas: document.getElementById("abs_catatan")?.value || ""
  };

  let btn = document.getElementById("btnSimpanAbsensi");
  if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Menyimpan..."; }

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "simpanAbsensi",
        data: payload
      })
    });

    let result = await response.json();
    if (result.status === "success") {
      alert("🎉 Data Absensi & Catatan Rapor berhasil disimpan!");
      
      let idx = listAbsensiData.findIndex(x => String(x.id_siswa).trim() === String(idSiswa).trim());
      if (idx >= 0) {
        listAbsensiData[idx] = { ...listAbsensiData[idx], ...payload };
      } else {
        listAbsensiData.push(payload);
      }
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (err) {
    alert("Kesalahan koneksi!");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = "💾 Simpan Data Absensi & Catatan Rapor"; }
  }
}

let currentPresensiPage = 1;
const presensiRowsPerPage = 10;
let filteredPresensiData = [];

// Fungsi memuat ulang data presensi harian dari server
async function muatPresensiHarianDariServer() {
  try {
    let res = await fetch(`${API_URL}?action=getPresensiHarian`);
    let result = await res.json();
    if (result.status === "success") {
      listPresensiHarianData = result.data || [];
      filterDanRenderPresensiHistori();
    }
  } catch (err) {
    console.error("Gagal memuat histori presensi:", err);
  }
}

// Fungsi filter dan pagination histori presensi
function filterDanRenderPresensiHistori() {
  let search = (document.getElementById("presensiSearch")?.value || "").toLowerCase().trim();
  let filterTgl = document.getElementById("presensiFilterTgl")?.value || "";
  let filterStatus = (document.getElementById("presensiFilterStatus")?.value || "").toUpperCase().trim();

  let siswaAktifList = typeof getSiswaKelasAktif === "function" ? getSiswaKelasAktif() : listSiswaData;
  let setIdsSiswaKelas = new Set(siswaAktifList.map(s => String(s.id_siswa).trim()));

  filteredPresensiData = listPresensiHarianData.filter(p => {
    let idS = String(p.id_siswa).trim();
    if (!setIdsSiswaKelas.has(idS)) return false;

    let s = siswaAktifList.find(x => String(x.id_siswa).trim() === idS);
    let nama = s ? s.nama_lengkap.toLowerCase() : "";

    let tglLog = String(p.tanggal || "").split("T")[0].trim();

    let matchSearch = search === "" || nama.includes(search);
    let matchTgl = filterTgl === "" || tglLog === filterTgl;
    let matchStatus = filterStatus === "" || String(p.status_kehadiran).toUpperCase() === filterStatus;

    return matchSearch && matchTgl && matchStatus;
  });

  let txtTotal = document.getElementById("txtTotalLogPresensi");
  if (txtTotal) txtTotal.innerText = `Total: ${filteredPresensiData.length} Log`;

  renderTabelHistoriPresensi();
}

function renderTabelHistoriPresensi() {
  let totalRows = filteredPresensiData.length;
  let totalPages = Math.ceil(totalRows / presensiRowsPerPage) || 1;
  if (currentPresensiPage > totalPages) currentPresensiPage = totalPages;

  let startIndex = (currentPresensiPage - 1) * presensiRowsPerPage;
  let pageData = filteredPresensiData.slice(startIndex, startIndex + presensiRowsPerPage);

  let container = document.getElementById("tabelRiwayatPresensiBody");
  if (!container) return;

  if (pageData.length === 0) {
    container.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Tidak ada data histori ketidakhadiran yang cocok.</td></tr>';
    renderPaginationPresensiNav(0, 1);
    return;
  }

  let siswaAktifList = typeof getSiswaKelasAktif === "function" ? getSiswaKelasAktif() : listSiswaData;
  let html = "";

  pageData.forEach((p, idx) => {
    let s = siswaAktifList.find(x => String(x.id_siswa).trim() === String(p.id_siswa).trim());
    let nama = s ? s.nama_lengkap : `ID: ${p.id_siswa}`;
    
    // 🎯 FIX FORMAT TANGGAL INDONESIA (DD/MM/YYYY)
    let tglRaw = String(p.tanggal || "").split("T")[0]; // "2026-09-10"
    let tglFormatted = tglRaw;
    
    if (tglRaw && tglRaw.includes("-")) {
      let parts = tglRaw.split("-"); // [2026, 09, 10]
      if (parts.length === 3) {
        tglFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`; // Hasil: "10/09/2026"
      }
    }

    let st = String(p.status_kehadiran).toUpperCase();
    let badgeSt = st === "S" ? '<span class="badge bg-warning text-dark">Sakit (S)</span>'
      : (st === "I" ? '<span class="badge bg-info text-dark">Izin (I)</span>' 
      : '<span class="badge bg-danger">Alpa (A)</span>');

    html += `
      <tr>
        <td class="text-center">${startIndex + idx + 1}</td>
        <!-- panggil tglRaw di fungsi edit, tapi tampilkan tglFormatted ke user -->
        <td class="text-center font-monospace">${tglFormatted}</td>
        <td><strong>${nama}</strong></td>
        <td class="text-center">${badgeSt}</td>
        <td class="text-center">
          <button onclick="pilihTanggalPresensiForm('${tglRaw}')" class="btn btn-sm btn-outline-primary fw-bold" title="Edit Presensi Tanggal Ini">
            ✏️ Edit
          </button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
  renderPaginationPresensiNav(totalRows, totalPages);
}

function renderPaginationPresensiNav(totalRows, totalPages) {
  let infoEl = document.getElementById("presensiPaginationInfo");
  let navEl = document.getElementById("presensiPaginationNav");

  if (infoEl) {
    infoEl.innerText = totalRows > 0 
      ? `Halaman ${currentPresensiPage} dari ${totalPages} (${totalRows} Log)`
      : "Halaman 1 dari 1 (0 Log)";
  }

  if (!navEl) return;
  let html = "";

  html += `<li class="page-item ${currentPresensiPage <= 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="gantiHalamanPresensi(${currentPresensiPage - 1})">Previous</button>
           </li>`;

  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === currentPresensiPage ? 'active' : ''}">
              <button class="page-link" onclick="gantiHalamanPresensi(${i})">${i}</button>
             </li>`;
  }

  html += `<li class="page-item ${currentPresensiPage >= totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="gantiHalamanPresensi(${currentPresensiPage + 1})">Next</button>
           </li>`;

  navEl.innerHTML = html;
}

function gantiHalamanPresensi(page) {
  if (page < 1) return;
  currentPresensiPage = page;
  renderTabelHistoriPresensi();
}

// Buka form input presensi untuk tanggal spesifik saat tombol Edit diklik
function pilihTanggalPresensiForm(tglStr) {
  let inputTgl = document.getElementById("tglPresensiHarian");
  if (inputTgl) {
    inputTgl.value = tglStr;
    muatPresensiHarianTanggal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
