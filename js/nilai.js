function gantiModeAsesmen() {
  let jenis = document.getElementById("selectJenisAsesmen").value;
  let boxTP = document.getElementById("boxInputTP");
  if (jenis === "LM") {
    boxTP.style.display = "block";
  } else {
    boxTP.style.display = "none";
  }
}

// 1. RENDER TABEL INPUT NILAI (FILTER BY KELAS AKTIF)
function renderTabelSiswaInput() {
  let kAktif = String(infoSekolah.kelas || 5).trim();

  // Filter siswa yang kelasnya cocok dengan kelas aktif
  let listSiswaAktif = listSiswaData.filter(siswa => {
    let kSiswa = String(siswa.kelas || (infoSekolah.kelas || 5)).trim();
    return kSiswa === kAktif;
  });

  if (listSiswaAktif.length === 0) {
    document.getElementById("tabelSiswaInput").innerHTML = 
      `<tr><td colspan="4" class="text-center text-muted py-3">Belum ada data siswa untuk Kelas ${kAktif}. Silakan tambah siswa di tab Data Siswa.</td></tr>`;
    return;
  }

  let html = "";
  listSiswaAktif.forEach((siswa, index) => {
    html += `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><small class="text-muted">${siswa.nis || '-'} / ${siswa.nisn || '-'}</small></td>
        <td><strong>${siswa.nama_lengkap}</strong></td>
        <td><input type="number" min="0" max="100" class="form-control input-nilai-siswa" data-idsiswa="${siswa.id_siswa}" placeholder="0-100"></td>
      </tr>
    `;
  });
  document.getElementById("tabelSiswaInput").innerHTML = html;
}

// 2. UPDATE DROPDOWN TP (FILTER BY MAPEL, SEMESTER, DAN KELAS AKTIF)
function updateDropdownTP() {
  let selectedMapel = document.getElementById("selectMapel").value;
  let selectTP = document.getElementById("selectTPInput");
  let semAktif = String(infoSekolah.semester || "1").trim();
  let kAktif = String(infoSekolah.kelas || "5").trim();

  if (!selectedMapel) {
    selectTP.innerHTML = '<option value="">-- Pilih Mapel Terlebih Dahulu --</option>';
    return;
  }

  // Filter TP berdasarkan Mapel, Semester, DAN Kelas Aktif
  let tpFiltered = listTPData.filter(tp => 
    String(tp.id_mapel).trim().toUpperCase() === String(selectedMapel).trim().toUpperCase() &&
    String(tp.semester || "1").trim() === semAktif &&
    String(tp.kelas || "5").trim() === kAktif
  );

  if (tpFiltered.length === 0) {
    selectTP.innerHTML = `<option value="">-- Belum Ada TP untuk Kelas ${kAktif} Semester ${semAktif} --</option>`;
    return;
  }

  let html = '<option value="">-- Pilih TP --</option>';
  tpFiltered.forEach(tp => {
    html += `<option value="${tp.id_tp}">${tp.id_tp} - ${tp.narasi_tp}</option>`;
  });
  selectTP.innerHTML = html;
}

async function simpanSemuaNilai() {
  let jenis = document.getElementById("selectJenisAsesmen").value;
  let mapel = document.getElementById("selectMapel").value;
  let tp = document.getElementById("selectTPInput").value;

  if (!mapel) { alert("Pilih Mata Pelajaran!"); return; }
  if (jenis === "LM" && !tp) { alert("Untuk Sumatif Materi (LM), Kode TP wajib diisi!"); return; }

  let inputElements = document.querySelectorAll(".input-nilai-siswa");
  let payloadNilai = [];
  inputElements.forEach(input => {
    let val = input.value;
    if (val !== "") {
      let idSiswa = input.getAttribute("data-idsiswa");
      payloadNilai.push({
        id_siswa: idSiswa,
        id_mapel: mapel,
        jenis_asesmen: jenis,
        id_tp: jenis === "LM" ? tp : "-",
        nilai_angka: parseFloat(val),
        semester: infoSekolah.semester || 1
      });
    }
  });

  if (payloadNilai.length === 0) { alert("Isi minimal satu nilai!"); return; }

  let btn = document.getElementById("btnSimpan");
  btn.disabled = true; btn.innerHTML = "⏳ Menyimpan...";

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanNilai", data: payloadNilai })
    });
    let result = await response.json();
    if (result.status === "success") {
      alert(`🎉 Berhasil menyimpan ${payloadNilai.length} data nilai ${jenis}!`);
      payloadNilai.forEach(p => listRiwayatSesiIni.unshift(p));
      renderTabelRiwayatInput();
      inputElements.forEach(i => i.value = "");
    } else { alert("Gagal: " + result.message); }
  } catch (error) { alert("Kesalahan koneksi!"); } 
  finally { btn.disabled = false; btn.innerHTML = "💾 Simpan Data Nilai"; }
}

function renderTabelRiwayatInput() {
  if (listRiwayatSesiIni.length === 0) {
    document.getElementById("tabelRiwayatInput").innerHTML = '<tr><td colspan="7" class="text-center text-muted">Belum ada nilai yang diinput pada sesi ini.</td></tr>';
    return;
  }
  let html = "";
  listRiwayatSesiIni.forEach((n, idx) => {
    let s = listSiswaData.find(x => String(x.id_siswa).trim() === String(n.id_siswa).trim());
    let namaSiswa = s ? s.nama_lengkap : `ID: ${n.id_siswa}`;

    let m = listMapelData.find(x => String(x.id_mapel).trim().toUpperCase() === String(n.id_mapel).trim().toUpperCase());
    let namaMapel = m ? m.nama_mapel : n.id_mapel;

    let statusBadge = n.nilai_angka >= 75 ? '<span class="badge bg-success">Tuntas</span>' : '<span class="badge bg-warning text-dark">Bimbingan</span>';
    let badgeJenis = n.jenis_asesmen === "LM" ? "bg-primary" : (n.jenis_asesmen === "STS" ? "bg-warning text-dark" : "bg-danger");

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${namaSiswa}</strong></td>
        <td><span class="badge bg-secondary">${namaMapel}</span></td>
        <td><span class="badge ${badgeJenis}">${n.jenis_asesmen}</span></td>
        <td><span class="badge bg-info text-dark">${n.id_tp}</span></td>
        <td class="text-center fw-bold fs-6">${n.nilai_angka}</td>
        <td class="text-center">${statusBadge}</td>
      </tr>
    `;
  });
  document.getElementById("tabelRiwayatInput").innerHTML = html;
}
