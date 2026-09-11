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
  let autoSakit = logsSiswa.filter(x => String(x.status || x.status_kehadiran).toUpperCase() === "S").length;
  let autoIzin = logsSiswa.filter(x => String(x.status || x.status_kehadiran).toUpperCase() === "I").length;
  let autoAlpa = logsSiswa.filter(x => String(x.status || x.status_kehadiran).toUpperCase() === "A").length;

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
      String(x.tanggal || x.tgl_presensi || "").split("T")[0] === tglInput
    );

    let st = logEksis.length > 0 ? String(logEksis[0].status || logEksis[0].status_kehadiran).toUpperCase() : "H";

    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${siswa.nama_lengkap}</strong></td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group" aria-label="Status ${idS}">
            <input type="radio" class="btn-check" name="pres_status_${idS}" id="h_${idS}" value="H" ${st === 'H' ? 'checked' : ''}>
            <label class="btn btn-outline-success" for="h_${idS}">Hadir</label>

            <input type="radio" class="btn-check" name="pres_status_${idS}" id="s_${idS}" value="S" ${st === 'S' ? 'checked' : ''}>
            <label class="btn btn-outline-warning" for="s_${idS}">Sakit</label>

            <input type="radio" class="btn-check" name="pres_status_${idS}" id="i_${idS}" value="I" ${st === 'I' ? 'checked' : ''}>
            <label class="btn btn-outline-info" for="i_${idS}">Izin</label>

            <input type="radio" class="btn-check" name="pres_status_${idS}" id="a_${idS}" value="A" ${st === 'A' ? 'checked' : ''}>
            <label class="btn btn-outline-danger" for="a_${idS}">Alpa</label>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
  filterDanRenderPresensiHistori();
}

// 💾 SIMPAN PRESENSI HARIAN
// 💾 SIMPAN PRESENSI HARIAN
async function simpanPresensiHarian() {
  let tglInput = document.getElementById("tglPresensiHarian")?.value || document.getElementById("inputTanggalPresensi")?.value;
  if (!tglInput) {
    alert("⚠️ Pilih tanggal presensi terlebih dahulu!");
    return;
  }

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  let siswaAktif = listSiswaData.filter(s => String(s.kelas || "5").trim() === kAktif);
  let payload = [];

  siswaAktif.forEach(s => {
    let idS = String(s.id_siswa).trim();
    let elStatus = document.querySelector(`input[name="pres_status_${idS}"]:checked`);
    let status = elStatus ? elStatus.value : "H";

    payload.push({
      tanggal: tglInput,
      id_siswa: idS,
      nama_lengkap: s.nama_lengkap || "",
      status: status
    });
  });

  let btn = document.getElementById("btnSimpanHarian");
  if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Menyimpan..."; }

  try {
    let result = await kirimDataKeServer("simpanPresensiHarian", payload);
    if (result.status === "success") {
      alert("🎉 Presensi tanggal " + tglInput + " berhasil disimpan!");
      
      payload.forEach(p => {
        let idx = listPresensiHarianData.findIndex(x => 
          String(x.tanggal || x.tgl_presensi).split("T")[0] === String(p.tanggal) && 
          String(x.id_siswa).trim() === String(p.id_siswa).trim()
        );
        if (idx >= 0) {
          listPresensiHarianData[idx].status = p.status;
          listPresensiHarianData[idx].status_kehadiran = p.status;
          listPresensiHarianData[idx].nama_lengkap = p.nama_lengkap;
        } else {
          listPresensiHarianData.push(p);
        }
      });

      filterDanRenderPresensiHistori();
    } else {
      alert("❌ Gagal: " + result.message);
    }
  } catch (err) {
    alert("❌ Kesalahan koneksi!");
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
    let result = await kirimDataKeServer("simpanAbsensi", payload);
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

// HELPER FORMAT TANGGAL YYYY-MM-DD
function formatKeYYYYMMDD(tglInput) {
  if (!tglInput) return "";
  let str = String(tglInput).trim();
  if (str.includes("T")) str = str.split("T")[0];
  
  let parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    let y = parsed.getFullYear();
    let m = String(parsed.getMonth() + 1).padStart(2, '0');
    let d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
}

// 🎯 FILTER DAN RENDER HISTORI KETIDAKHADIRAN
function filterDanRenderPresensiHistori() {
  let container = document.getElementById("tabelRiwayatPresensiBody");
  if (!container) return;

  let search = (document.getElementById("presensiSearch")?.value || "").toLowerCase().trim();
  let filterTgl = document.getElementById("presensiFilterTgl")?.value || "";
  let filterStatus = document.getElementById("presensiFilterStatus")?.value || "";

  let listFiltered = listPresensiHarianData.filter(p => {
    let st = String(p.status || p.status_kehadiran || "").toUpperCase().trim();
    let isNonHadir = (st === "S" || st === "I" || st === "A");
    
    if (!isNonHadir) return false;

    let tglPres = formatKeYYYYMMDD(p.tanggal || p.tgl_presensi || p.tgl);
    let matchTgl = !filterTgl || tglPres === filterTgl;
    let matchStatus = !filterStatus || st === filterStatus;

    // Pencarian nama siswa dari properti p.nama_lengkap atau dari listSiswaData
    let sObj = listSiswaData.find(s => String(s.id_siswa || "").trim() === String(p.id_siswa || "").trim());
    let namaStr = p.nama_lengkap || (sObj ? sObj.nama_lengkap : "");
    let matchSearch = !search || namaStr.toLowerCase().includes(search);

    return matchTgl && matchStatus && matchSearch;
  });

  let totalLogEl = document.getElementById("txtTotalLogPresensi");
  if (totalLogEl) totalLogEl.innerText = `Total: ${listFiltered.length} Log`;

  if (listFiltered.length === 0) {
    container.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Belum ada histori catatan ketidakhadiran (Sakit/Izin/Alpa).</td></tr>';
    return;
  }

  let html = "";
  listFiltered.forEach((p, idx) => {
    let sObj = listSiswaData.find(s => String(s.id_siswa || "").trim() === String(p.id_siswa || "").trim());
    let namaSiswa = p.nama_lengkap || (sObj ? sObj.nama_lengkap : `ID: ${p.id_siswa}`);
    let tglPres = formatKeYYYYMMDD(p.tanggal || p.tgl_presensi || p.tgl || "-");

    let badgeStatus = "";
    let st = String(p.status || p.status_kehadiran || "").toUpperCase().trim();
    if (st === "S") badgeStatus = '<span class="badge bg-warning text-dark px-2 py-1">Sakit (S)</span>';
    else if (st === "I") badgeStatus = '<span class="badge bg-info text-dark px-2 py-1">Izin (I)</span>';
    else if (st === "A") badgeStatus = '<span class="badge bg-danger px-2 py-1">Alpa (A)</span>';

    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td class="text-center font-monospace">${tglPres}</td>
        <td><strong>${namaSiswa}</strong></td>
        <td class="text-center">${badgeStatus}</td>
        <td class="text-center">
          <button onclick="pilihTanggalPresensiForm('${tglPres}')" class="btn btn-sm btn-outline-primary fw-bold">✏️ Edit</button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

function pilihTanggalPresensiForm(tglStr) {
  let inputTgl = document.getElementById("tglPresensiHarian") || document.getElementById("inputTanggalPresensi");
  if (inputTgl) {
    inputTgl.value = tglStr;
    muatPresensiHarianTanggal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function muatPresensiHarianDariServer() {
  try {
    let userSession = typeof getUserSession === "function" ? getUserSession() : null;
    let reqSekolah = userSession ? (userSession.id_sekolah || "SCH-SINE1") : "SCH-SINE1";
    let res = await fetch(`${API_URL}?action=getPresensiHarian&id_sekolah=${reqSekolah}`);
    let result = await res.json();
    if (result.status === "success") {
      listPresensiHarianData = result.data || [];
      filterDanRenderPresensiHistori();
      alert("🔄 Data presensi berhasil diperbarui dari server!");
    }
  } catch (err) {
    console.error("Gagal memuat histori presensi:", err);
  }
}
