function renderDashboard() {
  document.getElementById("dash_totSiswa").innerText = listSiswaData.length || 0;
  document.getElementById("dash_totTP").innerText = listTPData.length || 0;
  
  let siswaKokuUnik = new Set(listKokurikulerData.map(k => String(k.id_siswa).trim())).size;
  document.getElementById("dash_totKoku").innerText = `${siswaKokuUnik} / ${listSiswaData.length}`;

  let totalSiswa = listSiswaData.length || 1;
  let pctSiswa = listSiswaData.length > 0 ? 100 : 0;
  let pctTP = listTPData.length > 0 ? 100 : 0;
  let pctKoku = Math.round((siswaKokuUnik / totalSiswa) * 100);

  let overallPct = Math.round((pctSiswa + pctTP + pctKoku) / 3);

  let barProgress = document.getElementById("dash_overallProgressBar");
  barProgress.style.width = `${overallPct}%`;
  barProgress.innerText = `${overallPct}% Selesai`;
}
