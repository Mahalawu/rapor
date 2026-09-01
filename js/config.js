const API_URL = "https://script.google.com/macros/s/AKfycby-z59TN4hfzX4E9QKmjEH333vCQq-CDv-N3oDViKW74abBCu5smZ9HQmI8CNfjSvUI/exec";

let listSiswaData = [];
let listTPData = [];
let listMapelData = [];
let listNilaiData = [];
let listAbsensiData = [];
let listPresensiHarianData = [];
let listKokurikulerData = [];
let infoSekolah = {};
let siswaAktifId = null;
let ekskulCountAktif = 1;
let listRiwayatSesiIni = [];

async function muatDataAwal() {
  try {
    let resPengaturan = await fetch(`${API_URL}?action=getPengaturan`);
    let dataPengaturan = await resPengaturan.json();
    if (dataPengaturan.status === "success" && dataPengaturan.data.length > 0) {
      infoSekolah = dataPengaturan.data[0];
      updateHeaderTampilan();
    }

    let resMapel = await fetch(`${API_URL}?action=getMapel`);
    let dataMapel = await resMapel.json();
    if (dataMapel.status === "success") {
      listMapelData = dataMapel.data;
      
      let selectHtml = '<option value="">-- Pilih Mata Pelajaran --</option>';
      listMapelData.forEach(m => { selectHtml += `<option value="${m.id_mapel}">${m.nama_mapel}</option>`; });
      
      document.getElementById("selectMapel").innerHTML = selectHtml;
      document.getElementById("tp_single_mapel").innerHTML = selectHtml;
      document.getElementById("tp_bulk_mapel").innerHTML = selectHtml;
    }

    let resSiswa = await fetch(`${API_URL}?action=getSiswa`);
    let dataSiswa = await resSiswa.json();
    if (dataSiswa.status === "success") {
      listSiswaData = dataSiswa.data;
      renderTabelSiswaInput();
      renderTabelSiswaMaster();

      let selectAbsHtml = '<option value="">-- Pilih Siswa --</option>';
      listSiswaData.forEach(s => {
        selectAbsHtml += `<option value="${s.id_siswa}">${s.nama_lengkap} (Kelas ${s.kelas})</option>`;
      });
      document.getElementById("selectSiswaAbsensi").innerHTML = selectAbsHtml;
      document.getElementById("selectSiswaKokurikuler").innerHTML = selectAbsHtml;
    }

    let resTP = await fetch(`${API_URL}?action=getTP`);
    let dataTP = await resTP.json();
    if (dataTP.status === "success") { listTPData = dataTP.data; }

    let resAbs = await fetch(`${API_URL}?action=getAbsensi`);
    let dataAbs = await resAbs.json();
    if (dataAbs.status === "success") { listAbsensiData = dataAbs.data; }

    let resPresHarian = await fetch(`${API_URL}?action=getPresensiHarian`);
    let dataPresHarian = await resPresHarian.json();
    if (dataPresHarian.status === "success") { listPresensiHarianData = dataPresHarian.data; }

    let resKoku = await fetch(`${API_URL}?action=getKokurikuler`);
    let dataKoku = await resKoku.json();
    if (dataKoku.status === "success") { listKokurikulerData = dataKoku.data; }

    let today = new Date().toISOString().split('T')[0];
    document.getElementById("tglPresensiHarian").value = today;

    // Muat Dashboard begitu data selesai dimuat
    renderDashboard();

  } catch (error) { alert("Gagal memuat data awal!"); }
}

function updateHeaderTampilan() {
  document.getElementById("namaSekolah").innerText = infoSekolah.nama_sekolah || "Nama Sekolah Belum Diatur";
  document.getElementById("tahunAjaran").innerText = infoSekolah.tahun_ajaran || "-";
  document.getElementById("semester").innerText = infoSekolah.semester || "-";
  document.getElementById("labelKelasFase").innerText = `Kelas ${infoSekolah.kelas || '5'} (Fase ${infoSekolah.fase || 'C'})`;
}
