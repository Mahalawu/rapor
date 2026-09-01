function renderPresensiHarianForm() {
  if (listSiswaData.length === 0) {
    document.getElementById("tabelPresensiHarianBody").innerHTML = '<tr><td colspan="3" class="text-center text-muted">Belum ada data siswa.</td></tr>';
    return;
  }

  let selectedTgl = document.getElementById("tglPresensiHarian").value;
  let logsTglIni = listPresensiHarianData.filter(x => String(x.tanggal).split("T")[0] === String(selectedTgl));

  let html = "";
  listSiswaData.forEach((s, idx) => {
    let logSiswa = logsTglIni.find(x => String(x.id_siswa).trim() === String(s.id_siswa).trim());
    let st = logSiswa ? logSiswa.status_kehadiran : "H";

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.nama_lengkap}</strong></td>
        <td class="text-center">
          <div class="btn-group" role="group">
            <input type="radio" class="btn-check" name="pres_${s.id_siswa}" id="h_${s.id_siswa}" value="H" ${st === 'H' ? 'checked' : ''}>
            <label class="btn btn-outline-success btn-sm" for="h_${s.id_siswa}">Hadir</label>

            <input type="radio" class="btn-check" name="pres_${s.id_siswa}" id="s_${s.id_siswa}" value="S" ${st === 'S' ? 'checked' : ''}>
            <label class="btn btn-outline-warning btn-sm" for="s_${s.id_siswa}">Sakit</label>

            <input type="radio" class="btn-check" name="pres_${s.id_siswa}" id="i_${s.id_siswa}" value="I" ${st === 'I' ? 'checked' : ''}>
            <label class="btn btn-outline-info btn-sm" for="i_${s.id_siswa}">Izin</label>

            <input type="radio" class="btn-check" name="pres_${s.id_siswa}" id="a_${s.id_siswa}" value="A" ${st === 'A' ? 'checked' : ''}>
            <label class="btn btn-outline-danger btn-sm" for="a_${s.id_siswa}">Alpa</label>
          </div>
        </td>
      </tr>
    `;
  });
  document.getElementById("tabelPresensiHarianBody").innerHTML = html;
}

function muatPresensiHarianTanggal() { renderPresensiHarianForm(); }

async function simpanPresensiHarian() {
  let selectedTgl = document.getElementById("tglPresensiHarian").value;
  if (!selectedTgl) { alert("Pilih tanggal presensi!"); return; }

  let payload = [];
  listSiswaData.forEach(s => {
    let radioChecked = document.querySelector(`input[name="pres_${s.id_siswa}"]:checked`);
    let val = radioChecked ? radioChecked.value : "H";
    payload.push({ id_siswa: s.id_siswa, status_kehadiran: val });
  });

  let btn = document.getElementById("btnSimpanHarian");
  btn.disabled = true; btn.innerHTML = "⏳ Menyimpan Presensi...";

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanPresensiHarian", tanggal: selectedTgl, data: payload })
    });
    let result = await response.json();
    if (result.status === "success") {
      alert(`🎉 Presensi tanggal ${selectedTgl} berhasil disimpan!`);
      let resPresHarian = await fetch(`${API_URL}?action=getPresensiHarian`);
      let dataPresHarian = await resPresHarian.json();
      if (dataPresHarian.status === "success") { listPresensiHarianData = dataPresHarian.data; }
    } else { alert("Gagal: " + result.message); }
  } catch (err) { alert("Terjadi kesalahan koneksi!"); }
  finally { btn.disabled = false; btn.innerHTML = "💾 Simpan Presensi Tanggal Ini"; }
}

function tambahRowEkskul() {
  if (ekskulCountAktif < 3) {
    ekskulCountAktif++;
    document.getElementById(`box_ekskul_${ekskulCountAktif}`).style.display = "flex";
  } else {
    alert("Maksimal 3 kegiatan ekstrakurikuler per siswa.");
  }
}

function hapusRowEkskul(no) {
  document.getElementById(`box_ekskul_${no}`).style.display = "none";
  document.getElementById(`abs_ekskul${no}`).value = "";
  document.getElementById(`abs_ketEkskul${no}`).value = "";
}

function pilihSiswaAbsensi() {
  let idSiswa = document.getElementById("selectSiswaAbsensi").value;
  let formBody = document.getElementById("formAbsensiBody");
  if (!idSiswa) { formBody.style.display = "none"; return; }

  formBody.style.display = "block";
  let semAktif = String(infoSekolah.semester || "1").trim();
  
  // Filter jurnal harian berdasarkan semester (jika ada flag semester) atau tanggal semester
  let logsSiswaIni = listPresensiHarianData.filter(x => String(x.id_siswa).trim() === String(idSiswa).trim());
  let autoSakit = logsSiswaIni.filter(x => x.status_kehadiran === "S").length;
  let autoIzin = logsSiswaIni.filter(x => x.status_kehadiran === "I").length;
  let autoAlpa = logsSiswaIni.filter(x => x.status_kehadiran === "A").length;

  // Filter data absensi khusus semester aktif
  let abs = listAbsensiData.find(x => 
    String(x.id_siswa).trim() === String(idSiswa).trim() &&
    String(x.semester || semAktif).trim() === semAktif
  );

  if (abs) {
    document.getElementById("abs_sakit").value = abs.sakit !== undefined ? abs.sakit : autoSakit;
    document.getElementById("abs_izin").value = abs.izin !== undefined ? abs.izin : autoIzin;
    document.getElementById("abs_alpa").value = abs.tanpa_keterangan !== undefined ? abs.tanpa_keterangan : autoAlpa;

    document.getElementById("abs_ekskul1").value = abs.ekskul_1 || "Pramuka";
    document.getElementById("abs_nilaiEkskul1").value = abs.nilai_ekskul_1 || "Baik";
    document.getElementById("abs_ketEkskul1").value = abs.keterangan_ekskul_1 || "";

    document.getElementById("abs_ekskul2").value = abs.ekskul_2 || "";
    document.getElementById("abs_nilaiEkskul2").value = abs.nilai_ekskul_2 || "Baik";
    document.getElementById("abs_ketEkskul2").value = abs.keterangan_ekskul_2 || "";
    document.getElementById("box_ekskul_2").style.display = abs.ekskul_2 ? "flex" : "none";

    document.getElementById("abs_ekskul3").value = abs.ekskul_3 || "";
    document.getElementById("abs_nilaiEkskul3").value = abs.nilai_ekskul_3 || "Baik";
    document.getElementById("abs_ketEkskul3").value = abs.keterangan_ekskul_3 || "";
    document.getElementById("box_ekskul_3").style.display = abs.ekskul_3 ? "flex" : "none";

    ekskulCountAktif = abs.ekskul_3 ? 3 : (abs.ekskul_2 ? 2 : 1);
    document.getElementById("abs_catatan").value = abs.catatan_walikelas || "";
  } else {
    // Jika belum ada data di semester 2, reset ke 0 / default
    document.getElementById("abs_sakit").value = autoSakit;
    document.getElementById("abs_izin").value = autoIzin;
    document.getElementById("abs_alpa").value = autoAlpa;

    document.getElementById("abs_ekskul1").value = "Pramuka";
    document.getElementById("abs_nilaiEkskul1").value = "Baik";
    document.getElementById("abs_ketEkskul1").value = "";

    document.getElementById("abs_ekskul2").value = "";
    document.getElementById("abs_ketEkskul2").value = "";
    document.getElementById("box_ekskul_2").style.display = "none";

    document.getElementById("abs_ekskul3").value = "";
    document.getElementById("abs_ketEkskul3").value = "";
    document.getElementById("box_ekskul_3").style.display = "none";

    ekskulCountAktif = 1;
    document.getElementById("abs_catatan").value = "";
  }
}
async function simpanAbsensiSiswa() {
  let idSiswa = document.getElementById("selectSiswaAbsensi").value;
  if (!idSiswa) { alert("Pilih siswa terlebih dahulu!"); return; }

  let payload = {
    id_siswa: idSiswa,
    sakit: parseInt(document.getElementById("abs_sakit").value) || 0,
    izin: parseInt(document.getElementById("abs_izin").value) || 0,
    tanpa_keterangan: parseInt(document.getElementById("abs_alpa").value) || 0,
    
    ekskul_1: document.getElementById("abs_ekskul1").value.trim(),
    nilai_ekskul_1: document.getElementById("abs_nilaiEkskul1").value,
    keterangan_ekskul_1: document.getElementById("abs_ketEkskul1").value.trim(),

    ekskul_2: document.getElementById("abs_ekskul2").value.trim(),
    nilai_ekskul_2: document.getElementById("abs_nilaiEkskul2").value,
    keterangan_ekskul_2: document.getElementById("abs_ketEkskul2").value.trim(),

    ekskul_3: document.getElementById("abs_ekskul3").value.trim(),
    nilai_ekskul_3: document.getElementById("abs_nilaiEkskul3").value,
    keterangan_ekskul_3: document.getElementById("abs_ketEkskul3").value.trim(),

    catatan_walikelas: document.getElementById("abs_catatan").value.trim()
  };

  let btn = document.getElementById("btnSimpanAbsensi");
  btn.disabled = true; btn.innerHTML = "⏳ Menyimpan ke Google Sheets...";

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanAbsensi", data: payload })
    });

    let result = await response.json();
    if (result.status === "success") {
      alert("🎉 Data absensi & Multi-Ekskul berhasil disimpan!");
      let idx = listAbsensiData.findIndex(x => String(x.id_siswa).trim() === String(idSiswa).trim());
      if (idx >= 0) { listAbsensiData[idx] = payload; } else { listAbsensiData.push(payload); }
    } else { alert("Gagal menyimpan: " + result.message); }
  } catch (err) { alert("Terjadi kesalahan koneksi!"); }
  finally { btn.disabled = false; btn.innerHTML = "💾 Simpan Data Absensi & Catatan Rapor"; }
}
