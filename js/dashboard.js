function renderDashboard() {
  let semAktif = String(infoSekolah.semester || "1").trim();
  let totalSiswa = listSiswaData.length || 0;
  
  // 1. Update Stats Cards
  document.getElementById("dash_totSiswa").innerText = totalSiswa;
  document.getElementById("dash_totTP").innerText = listTPData.length || 0;
  
  // Hitung siswa kokurikuler di semester aktif
  let siswaKokuUnik = new Set(
    listKokurikulerData
      .filter(k => {
        let kSem = (k.semester !== undefined && k.semester !== "") ? String(k.semester).trim() : "1";
        return kSem === semAktif;
      })
      .map(k => String(k.id_siswa).trim())
  ).size;
  
  document.getElementById("dash_totKoku").innerText = `${siswaKokuUnik} / ${totalSiswa}`;

  // 2. Render Tabel Status & Progress Bar
  renderTabelStatusSiswa(semAktif);
}

function renderTabelStatusSiswa(semAktif) {
  let container = document.getElementById("dash_tabelStatusSiswa");
  if (!container) return;

  if (listSiswaData.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Belum ada data siswa.</td></tr>';
    return;
  }

  let totalLengkap = 0;
  let html = "";

  listSiswaData.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();

    // Cek apakah siswa ini sudah punya minimal 1 nilai di semester aktif
    let adaNilai = listNilaiData.some(n => {
      let nSem = (n.semester !== undefined && n.semester !== "") ? String(n.semester).trim() : "1";
      return String(n.id_siswa).trim() === idS && nSem === semAktif;
    });
    
    // Cek Presensi & Catatan Wali Kelas
    let adaAbs = listAbsensiData.some(a => {
      let aSem = (a.semester !== undefined && a.semester !== "") ? String(a.semester).trim() : "1";
      return String(a.id_siswa).trim() === idS && 
             aSem === semAktif && 
             String(a.catatan_walikelas || "").trim() !== "";
    });

    // Cek Kokurikuler
    let adaKoku = listKokurikulerData.some(k => String(k.id_siswa).trim() === idS);

    // Hitung status kelengkapan
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

  // Update Progress Bar Keseluruhan
  let totalSiswaCount = listSiswaData.length;
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
