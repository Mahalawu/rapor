function renderDashboard() {
  let semAktif = String(infoSekolah.semester || "1").trim();
  let totalSiswa = listSiswaData.length || 0;
  
  // 1. Update Stats Cards
  document.getElementById("dash_totSiswa").innerText = totalSiswa;
  document.getElementById("dash_totTP").innerText = listTPData.length || 0;
  
  // Hitung jumlah siswa yang sudah diisi Kokurikuler di semester aktif
  let siswaKokuUnik = new Set(
    listKokurikulerData
      .filter(k => String(k.semester || semAktif).trim() === semAktif)
      .map(k => String(k.id_siswa).trim())
  ).size;
  
  document.getElementById("dash_totKoku").innerText = `${siswaKokuUnik} / ${totalSiswa}`;

  // 2. Render Tabel Status Kelengkapan Siswa
  renderTabelStatusSiswa(semAktif);
}

function renderTabelStatusSiswa(semAktif) {
  let container = document.getElementById("dash_tabelStatusSiswa");
  if (!container) return;

  if (listSiswaData.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Belum ada data siswa. Silakan tambah data siswa terlebih dahulu.</td></tr>';
    return;
  }

  let totalLengkap = 0;
  let html = "";

  listSiswaData.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();

    // Cek status Nilai
    let adaNilai = listNilaiData.some(n => String(n.id_siswa).trim() === idS && String(n.semester || semAktif).trim() === semAktif);
    
    // Cek status Presensi & Catatan
    let adaAbs = listAbsensiData.some(a => String(a.id_siswa).trim() === idS && String(a.catatan_walikelas || "").trim() !== "");

    // Cek status Kokurikuler
    let adaKoku = listKokurikulerData.some(k => String(k.id_siswa).trim() === idS);

    // Hitung status kelengkapan total siswa
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

  // 3. Update Progress Bar Keseluruhan Rapor Kelas
  let overallPct = listSiswaData.length > 0 ? Math.round((totalLengkap / listSiswaData.length) * 100) : 0;
  let barProgress = document.getElementById("dash_overallProgressBar");
  if (barProgress) {
    barProgress.style.width = `${overallPct}%`;
    barProgress.innerText = `${overallPct}% Selesai (${totalLengkap} dari ${listSiswaData.length} Siswa Siap Cetak)`;
  }
}
