let currentPresensiMode = "harian";

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
    renderTabelAkumulasiRapor();
  }
}

// 🎯 1. RENDER TABEL PRESENSI HARIAN (TERKUNCI KELAS AKTIF)
function renderTabelPresensiHarian() {
  // Cek ID elemen tabel (toleransi variasi nama ID di index.html)
  let container = document.getElementById("tabelPresensiHarian") || 
                  document.getElementById("tabelAbsensiHarian") || 
                  document.getElementById("tabelListPresensi");
  if (!container) return;

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  
  // 🎯 FILTER SISWA HANYA KELAS AKTIF
  let siswaAktifList = listSiswaData.filter(s => String(s.kelas || "5").trim() === kAktif);

  if (siswaAktifList.length === 0) {
    container.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Belum ada data siswa untuk Kelas ${kAktif}.</td></tr>`;
    return;
  }

  let tglEl = document.getElementById("inputTanggalPresensi") || document.getElementById("tglPresensiHarian");
  let tglInput = tglEl?.value || new Date().toISOString().split("T")[0];

  let html = "";
  siswaAktifList.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();
    
    // Cari log presensi untuk siswa dan tanggal ini
    let logEksis = listPresensiHarianData.filter(x => 
      String(x.id_siswa).trim() === idS && 
      String(x.tanggal).split("T")[0] === tglInput
    );

    let st = logEksis.length > 0 ? logEksis[0].status_kehadiran : "H"; // Default Hadir (H)

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

// 🎯 2. RENDER TABEL AKUMULASI & CATATAN RAPOR (TERKUNCI KELAS AKTIF)
function renderTabelAkumulasiRapor() {
  let container = document.getElementById("tabelAkumulasiRapor");
  if (!container) return;

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  
  // 🎯 FILTER SISWA HANYA KELAS AKTIF
  let siswaAktifList = listSiswaData.filter(s => String(s.kelas || "5").trim() === kAktif);

  if (siswaAktifList.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Belum ada data siswa untuk Kelas ${kAktif}.</td></tr>`;
    return;
  }

  let html = "";
  siswaAktifList.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();
    let abs = listAbsensiData.find(x => String(x.id_siswa).trim() === idS);

    // Hitung otomatis dari jurnal presensi harian
    let logsSiswa = listPresensiHarianData.filter(x => String(x.id_siswa).trim() === idS);
    let autoSakit = logsSiswa.filter(x => x.status_kehadiran === "S").length;
    let autoIzin = logsSiswa.filter(x => x.status_kehadiran === "I").length;
    let autoAlpa = logsSiswa.filter(x => x.status_kehadiran === "A").length;

    let valS = abs && abs.sakit !== undefined ? abs.sakit : autoSakit;
    let valI = abs && abs.izin !== undefined ? abs.izin : autoIzin;
    let valA = abs && abs.tanpa_keterangan !== undefined ? abs.tanpa_keterangan : autoAlpa;
    let valCatatan = abs ? (abs.catatan_walikelas || "") : "";

    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${siswa.nama_lengkap}</strong></td>
        <td style="width: 80px;"><input type="number" min="0" class="form-control form-control-sm text-center input-sakit" data-idsiswa="${idS}" value="${valS}"></td>
        <td style="width: 80px;"><input type="number" min="0" class="form-control form-control-sm text-center input-izin" data-idsiswa="${idS}" value="${valI}"></td>
        <td style="width: 80px;"><input type="number" min="0" class="form-control form-control-sm text-center input-alpa" data-idsiswa="${idS}" value="${valA}"></td>
        <td><input type="text" class="form-control form-control-sm input-catatan" data-idsiswa="${idS}" value="${valCatatan}" placeholder="Tulis catatan motivasi wali kelas..."></td>
        <td class="text-center">
          <button onclick="simpanCatatanSiswaBiji('${idS}')" class="btn btn-sm btn-outline-primary" title="Simpan Catatan Siswa Ini">💾 Simpan</button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

// 💾 SIMPAN PRESENSI HARIAN
async function simpanPresensiHarian() {
  let tglInput = document.getElementById("inputTanggalPresensi").value;
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

  let btn = document.getElementById("btnSimpanPresensi");
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
      
      // Update memori lokal
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
    if (btn) { btn.disabled = false; btn.innerHTML = "💾 Simpan Presensi Harian"; }
  }
}

// 💾 SIMPAN CATATAN RAPOR INDIVIDUAL
async function simpanCatatanSiswaBiji(idSiswa) {
  let elS = document.querySelector(`.input-sakit[data-idsiswa="${idSiswa}"]`);
  let elI = document.querySelector(`.input-izin[data-idsiswa="${idSiswa}"]`);
  let elA = document.querySelector(`.input-alpa[data-idsiswa="${idSiswa}"]`);
  let elCat = document.querySelector(`.input-catatan[data-idsiswa="${idSiswa}"]`);

  let payload = {
    id_siswa: idSiswa,
    sakit: parseInt(elS?.value || 0),
    izin: parseInt(elI?.value || 0),
    tanpa_keterangan: parseInt(elA?.value || 0),
    catatan_walikelas: elCat?.value || ""
  };

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
      alert("🎉 Catatan siswa berhasil disimpan!");
      
      // Update memori lokal
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
  }
}
