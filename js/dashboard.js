function renderDashboard() {
  let semAktif = String(infoSekolah.semester || "1").trim();
  let siswaAktifList = getSiswaKelasAktif();
  let totalSiswa = siswaAktifList.length || 0;
  
  // 1. Update Stats Cards
  document.getElementById("dash_totSiswa").innerText = totalSiswa;
  
  // Hitung TP sesuai Kelas Aktif
  let kAktif = String(infoSekolah.kelas || 5).trim();
  let tpKelasAktif = listTPData.filter(tp => String(tp.kelas || 5).trim() === kAktif);
  document.getElementById("dash_totTP").innerText = tpKelasAktif.length || 0;
  
  // Hitung siswa kokurikuler di semester aktif
  let setSiswaKoku = new Set();
  siswaAktifList.forEach(s => {
    let idS = String(s.id_siswa).trim();
    let adaKoku = listKokurikulerData.some(k => {
      let kSem = (k.semester !== undefined && k.semester !== "") ? String(k.semester).trim() : "1";
      return String(k.id_siswa).trim() === idS && kSem === semAktif;
    });
    if (adaKoku) setSiswaKoku.add(idS);
  });
  
  document.getElementById("dash_totKoku").innerText = `${setSiswaKoku.size} / ${totalSiswa}`;

  // 2. Render Tabel Status & Progress Bar
  renderTabelStatusSiswa(semAktif);
}

function renderTabelStatusSiswa(semAktif) {
  let container = document.getElementById("dash_tabelStatusSiswa");
  if (!container) return;

  let siswaAktifList = getSiswaKelasAktif();

  if (siswaAktifList.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Belum ada data siswa untuk Kelas ${infoSekolah.kelas || 5}.</td></tr>`;
    return;
  }

  let totalLengkap = 0;
  let html = "";

  siswaAktifList.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();

    let adaNilai = listNilaiData.some(n => {
      let nSem = (n.semester !== undefined && n.semester !== "") ? String(n.semester).trim() : "1";
      return String(n.id_siswa).trim() === idS && nSem === semAktif;
    });
    
    let adaAbs = listAbsensiData.some(a => {
      let aSem = (a.semester !== undefined && a.semester !== "") ? String(a.semester).trim() : "1";
      return String(a.id_siswa).trim() === idS && 
             aSem === semAktif && 
             String(a.catatan_walikelas || "").trim() !== "";
    });

    let adaKoku = listKokurikulerData.some(k => String(k.id_siswa).trim() === idS);

    let isFullyComplete = adaNilai && adaAbs && adaKoku;
    if (isFullyComplete) totalLengkap++;

    let badgeNilai = adaNilai ? '<span class="badge bg-success">🟢 Diisi</span>' : '<span class="badge bg-danger">🔴 Belum</span>';
    let badgeAbs = adaAbs ? '<span class="badge bg-success">🟢 Diisi</span>' : '<span class="badge bg-warning text-dark">⚠️ Belum</span>';
    let badgeKoku = adaKoku ? '<span class="badge bg-success">🟢 Diisi</span>' : '<span class="badge bg-danger">🔴 Belum</span>';
    
    let statusTotal = isFullyComplete 
      ? '<span class="badge bg-success px-2 py-1">Ready Cetak</span>' 
      : '<span class="badge bg-secondary px-2 py-1">Belum Lengkap</span>';

    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${siswa.nama_lengkap}</strong></td>
        <td class="text-center">${badgeNilai}</td>
        <td class="text-center">${badgeAbs}</td>
        <td class="text-center">${badgeKoku}</td>
        <td class="text-center">${statusTotal}</td>
      </tr>
    `;
  });

  container.innerHTML = html;

  let totalSiswaCount = siswaAktifList.length;
  let overallPct = totalSiswaCount > 0 ? Math.round((totalLengkap / totalSiswaCount) * 100) : 0;
  let barProgress = document.getElementById("dash_overallProgressBar");
  
  if (barProgress) {
    barProgress.style.width = `${overallPct}%`;
    
    if (overallPct === 0) {
      barProgress.classList.remove("bg-success");
      barProgress.classList.add("bg-secondary");
      barProgress.innerText = `0% Selesai (0 dari ${totalSiswaCount} Siswa Siap Cetak)`;
    } else {
      barProgress.classList.remove("bg-secondary");
      barProgress.classList.add("bg-success");
      barProgress.innerText = `${overallPct}% Selesai (${totalLengkap} dari ${totalSiswaCount} Siswa Siap Cetak)`;
    }
  }
}
