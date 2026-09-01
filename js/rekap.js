async function muatRekapNilai() {
  document.getElementById("tabelRekap").innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Mengambil rekap nilai...</td></tr>';
  try {
    let res = await fetch(`${API_URL}?action=getNilai`);
    let result = await res.json();

    if (result.status === "success" && result.data.length > 0) {
      listNilaiData = result.data;
      let html = "";
      listNilaiData.forEach((n, idx) => {
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
            <td>${idx + 1}</td>
            <td><strong>${namaSiswa}</strong></td>
            <td><span class="badge bg-secondary px-2 py-1">${namaMapel}</span></td>
            <td><span class="badge ${badgeJenis} px-2 py-1">${jenisLabel}</span></td>
            <td><span class="badge bg-info text-dark">${n.id_tp || '-'}</span></td>
            <td><span class="fw-bold fs-6">${n.nilai_angka}</span></td>
            <td><small class="text-dark">${deskripsi}</small></td>
            <td class="text-center">
              <button onclick="bukaPreviewRapor('${String(n.id_siswa).trim()}')" class="btn btn-sm btn-outline-primary fw-bold">🖨️ Cetak</button>
            </td>
          </tr>
        `;
      });
      document.getElementById("tabelRekap").innerHTML = html;
    } else {
      document.getElementById("tabelRekap").innerHTML = '<tr><td colspan="8" class="text-center text-muted py-3">Belum ada data nilai tersimpan.</td></tr>';
    }
  } catch (err) {
    document.getElementById("tabelRekap").innerHTML = '<tr><td colspan="8" class="text-center text-danger py-3">Gagal memuat rekap data.</td></tr>';
  }
}

function bukaPreviewRapor(idSiswa) {
  siswaAktifId = String(idSiswa).trim();
  renderLembarRapor();
  var myModal = new bootstrap.Modal(document.getElementById('modalCetak'));
  myModal.show();
}

function gantiJenisRapor() { if (siswaAktifId) renderLembarRapor(); }

function renderLembarRapor() {
  let jenis = document.getElementById("selectJenisRapor").value;
  let siswa = listSiswaData.find(x => String(x.id_siswa).trim() === String(siswaAktifId).trim());
  if (!siswa) return;

  document.getElementById("c_judulRapor").innerText = jenis === "STS" 
    ? "LAPORAN HASIL BELAJAR TENGAH SEMESTER" 
    : "LAPORAN HASIL BELAJAR (RAPOR)";

  document.getElementById("c_namaSiswa").innerText = siswa.nama_lengkap;
  document.getElementById("c_nisn").innerText = `${siswa.nis} / ${siswa.nisn}`;
  document.getElementById("c_sekolah").innerText = infoSekolah.nama_sekolah || "SDN";
  document.getElementById("c_kelas").innerText = siswa.kelas || infoSekolah.kelas || "5";
  document.getElementById("c_fase").innerText = infoSekolah.fase || "C";
  document.getElementById("c_thnSem").innerText = `${infoSekolah.tahun_ajaran || "-"} / Semester ${infoSekolah.semester || "-"}`;

  document.getElementById("c_namaKepsek").innerText = infoSekolah.nama_kepsek || "(....................)";
  document.getElementById("c_nipKepsek").innerText = infoSekolah.nip_kepsek ? `NIP. ${infoSekolah.nip_kepsek}` : "-";

  document.getElementById("c_waliKelas").innerText = infoSekolah.nama_walikelas || "(....................)";
  document.getElementById("c_nipWaliKelas").innerText = infoSekolah.nip_walikelas ? `NIP. ${infoSekolah.nip_walikelas}` : "-";

  let tempat = infoSekolah.tempat_cetak || "Sine";
  let tglIndo = "-";
  if (infoSekolah.tanggal_rapor) {
    let tglRaw = new Date(infoSekolah.tanggal_rapor);
    tglIndo = tglRaw.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
  }
  document.getElementById("c_tglRapor").innerText = `${tempat}, ${tglIndo}`;

  let koku = listKokurikulerData.find(x => String(x.id_siswa).trim() === String(siswaAktifId).trim());
  if (koku) {
    document.getElementById("c_koku_tertinggi").innerText = koku.deskripsi_tertinggi || `Sudah baik dalam penerapan dimensi ${koku.dimensi_tertinggi}.`;
    document.getElementById("c_koku_terendah").innerText = koku.deskripsi_terendah || `Dan perlu berlatih dalam penerapan dimensi ${koku.dimensi_terendah}.`;
  } else {
    document.getElementById("c_koku_tertinggi").innerText = "Sudah baik dalam penerapan dimensi Keimanan dan Ketakwaan terhadap Tuhan YME.";
    document.getElementById("c_koku_terendah").innerText = "Dan perlu berlatih dalam penerapan dimensi Kemandirian.";
  }

  let secAkhir = document.getElementById("sectionAkhirSemester");
  if (jenis === "STS") {
    secAkhir.style.display = "none";
  } else {
    secAkhir.style.display = "block";
    let abs = listAbsensiData.find(x => String(x.id_siswa).trim() === String(siswaAktifId).trim());
    
    let logsSiswaIni = listPresensiHarianData.filter(x => String(x.id_siswa).trim() === String(siswaAktifId).trim());
    let autoSakit = logsSiswaIni.filter(x => x.status_kehadiran === "S").length;
    let autoIzin = logsSiswaIni.filter(x => x.status_kehadiran === "I").length;
    let autoAlpa = logsSiswaIni.filter(x => x.status_kehadiran === "A").length;

    let htmlEkskul = "";
    if (abs) {
      document.getElementById("c_sakit").innerText = abs.sakit !== undefined ? abs.sakit : autoSakit;
      document.getElementById("c_izin").innerText = abs.izin !== undefined ? abs.izin : autoIzin;
      document.getElementById("c_alpa").innerText = abs.tanpa_keterangan !== undefined ? abs.tanpa_keterangan : autoAlpa;
      document.getElementById("c_catatanWali").innerText = abs.catatan_walikelas || "-";

      let eksList = [];
      if (abs.ekskul_1) eksList.push({ nama: abs.ekskul_1, nilai: abs.nilai_ekskul_1, ket: abs.keterangan_ekskul_1 });
      if (abs.ekskul_2) eksList.push({ nama: abs.ekskul_2, nilai: abs.nilai_ekskul_2, ket: abs.keterangan_ekskul_2 });
      if (abs.ekskul_3) eksList.push({ nama: abs.ekskul_3, nilai: abs.nilai_ekskul_3, ket: abs.keterangan_ekskul_3 });

      if (eksList.length > 0) {
        eksList.forEach((eItem, eIdx) => {
          let descE = eItem.ket ? `${eItem.nilai || 'Baik'} (${eItem.ket})` : (eItem.nilai || "Baik");
          htmlEkskul += `<tr><td class="text-center">${eIdx + 1}</td><td>${eItem.nama}</td><td>${descE}</td></tr>`;
        });
      } else {
        htmlEkskul = '<tr><td class="text-center">1</td><td>Pramuka</td><td>Baik</td></tr>';
      }
    } else {
      document.getElementById("c_sakit").innerText = autoSakit;
      document.getElementById("c_izin").innerText = autoIzin;
      document.getElementById("c_alpa").innerText = autoAlpa;
      document.getElementById("c_catatanWali").innerText = "-";
      htmlEkskul = '<tr><td class="text-center">1</td><td>Pramuka</td><td>Baik</td></tr>';
    }
    document.getElementById("c_tabelEkskul").innerHTML = htmlEkskul;
  }

  let nilaiSiswaIni = listNilaiData.filter(x => String(x.id_siswa).trim() === String(siswaAktifId).trim());
  
  let mapelGrouped = {};
  nilaiSiswaIni.forEach(n => {
    let mKey = String(n.id_mapel).trim().toUpperCase();
    if (!mapelGrouped[mKey]) mapelGrouped[mKey] = [];
    mapelGrouped[mKey].push(n);
  });

  let htmlRows = "";
  let mapelKeys = Object.keys(mapelGrouped);

  if (mapelKeys.length === 0) {
    htmlRows = '<tr><td colspan="4" class="text-center text-muted py-3">Belum ada nilai terinput.</td></tr>';
  } else {
    mapelKeys.forEach((mKey, index) => {
      let listNilaiMapel = mapelGrouped[mKey];

      let totalNilai = 0;
      listNilaiMapel.forEach(item => totalNilai += parseFloat(item.nilai_angka || 0));
      let nilaiRataRata = Math.round(totalNilai / listNilaiMapel.length);

      let m = listMapelData.find(x => String(x.id_mapel).trim().toUpperCase() === mKey);
      let namaMapel = m ? m.nama_mapel : mKey;

      let listLM = listNilaiMapel.filter(x => (x.jenis_asesmen || "LM") === "LM");
      let deskripsiHasil = "";

      if (listLM.length > 0) {
        let tpTinggi = listLM.filter(x => x.nilai_angka >= 75);
        let tpRendah = listLM.filter(x => x.nilai_angka < 75);

        let kalimatTinggi = "";
        if (tpTinggi.length > 0) {
          let narasiArr = tpTinggi.map(item => {
            let tpObj = listTPData.find(x => String(x.id_tp).trim().toUpperCase() === String(item.id_tp).trim().toUpperCase() && String(x.id_mapel).trim().toUpperCase() === mKey);
            return tpObj ? tpObj.narasi_tp : item.id_tp;
          });
          kalimatTinggi = `Menunjukkan penguasaan yang sangat baik dalam ${narasiArr.join(", ")}.`;
        }

        let kalimatRendah = "";
        if (tpRendah.length > 0) {
          let narasiArr = tpRendah.map(item => {
            let tpObj = listTPData.find(x => String(x.id_tp).trim().toUpperCase() === String(item.id_tp).trim().toUpperCase() && String(x.id_mapel).trim().toUpperCase() === mKey);
            return tpObj ? tpObj.narasi_tp : item.id_tp;
          });
          kalimatRendah = `Perlu bimbingan lebih lanjut dalam ${narasiArr.join(", ")}.`;
        }

        deskripsiHasil = [kalimatTinggi, kalimatRendah].filter(Boolean).join(" ");
      } else {
        deskripsiHasil = "Menunjukkan penguasaan materi sesuai capaian pembelajaran.";
      }

      htmlRows += `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td><strong>${namaMapel}</strong></td>
          <td class="text-center fw-bold fs-6">${nilaiRataRata}</td>
          <td style="font-size: 0.95rem;">${deskripsiHasil}</td>
        </tr>
      `;
    });
  }
  document.getElementById("c_tabelNilai").innerHTML = htmlRows;
}
