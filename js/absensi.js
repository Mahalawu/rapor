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
