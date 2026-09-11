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

/* ===================================================
   HELPER GLOBAL KELAS & FASE LOKAL
   =================================================== */

// 1. Dapatkan Kelas Aktif User dari localStorage atau Default Database
function getKelasAktifUser() {
  let kSimpanan = localStorage.getItem("kelasAktif_User");
  if (kSimpanan) {
    return String(kSimpanan).trim();
  }
  return String(infoSekolah.kelas || "5").trim();
}

// 2. Dapatkan Fase Otomatis Berdasarkan Kelas (1-2=A, 3-4=B, 5-6=C)
function getFaseKelasAktif() {
  let kAktif = getKelasAktifUser();
  let kNum = parseInt(kAktif) || 5;
  
  if (kNum === 1 || kNum === 2) return "A";
  if (kNum === 3 || kNum === 4) return "B";
  return "C";
}

// 3. Dapatkan Daftar Siswa Khusus KELAS AKTIF
function getSiswaKelasAktif() {
  let kAktif = getKelasAktifUser();
  return listSiswaData.filter(s => {
    let kSiswa = String(s.kelas || kAktif).trim();
    return kSiswa === kAktif;
  });
}

// 4. Update Tampilan Header Utama & Badge Kelas/Fase
function updateHeaderTampilan() {
  let kAktif = getKelasAktifUser();
  let faseAktif = getFaseKelasAktif();
  
  infoSekolah.kelas = kAktif; 
  infoSekolah.fase = faseAktif;

  if (document.getElementById("namaSekolah")) {
    document.getElementById("namaSekolah").innerText = infoSekolah.nama_sekolah || "Nama Sekolah Belum Diatur";
  }
  if (document.getElementById("tahunAjaran")) {
    document.getElementById("tahunAjaran").innerText = infoSekolah.tahun_ajaran || "-";
  }
  if (document.getElementById("semester")) {
    document.getElementById("semester").innerText = infoSekolah.semester || "-";
  }
  if (document.getElementById("labelKelasFase")) {
    document.getElementById("labelKelasFase").innerText = `Kelas ${kAktif} (Fase ${faseAktif})`;
  }
  
  let elSelect = document.getElementById("selectKelasLokal");
  if (elSelect) elSelect.value = kAktif;
}

// 5. Ubah Kelas dari Dropdown Switcher Header (ISOLASI DATA 100%)
async function gantiKelasLokal(kelasBaru) {
  localStorage.setItem("kelasAktif_User", kelasBaru);
  
  // Ambil ulang pengaturan spesifik kelas baru dari server
  try {
    let resPengaturan = await fetch(`${API_URL}?action=getPengaturan&kelas=${kelasBaru}`);
    let dataPengaturan = await resPengaturan.json();
    if (dataPengaturan.status === "success" && dataPengaturan.data) {
      infoSekolah = dataPengaturan.data;
    }
  } catch (err) {
    console.error("Gagal memuat pengaturan kelas baru:", err);
  }

  updateHeaderTampilan();
  
  // Re-render seluruh tampilan aplikasi secara otomatis
  if (typeof populateDropdownSiswaGlobal === "function") populateDropdownSiswaGlobal();
  if (typeof renderTabelSiswaMaster === "function") renderTabelSiswaMaster();
  if (typeof renderTabelTP === "function") renderTabelTP();
  if (typeof renderTabelSiswaInput === "function") renderTabelSiswaInput();
  if (typeof renderTabCetakRapor === "function") renderTabCetakRapor();
  if (typeof renderDashboard === "function") renderDashboard();
  if (typeof filterDanRenderRekap === "function") filterDanRenderRekap();
  if (typeof loadFormPengaturan === "function") loadFormPengaturan();
  
  alert(`🔄 Tampilan berhasil disesuaikan untuk Kelas ${kelasBaru} (Fase ${infoSekolah.fase})!`);
}

// 6. Populasi Dropdown Siswa (Absensi & Kokurikuler)
function populateDropdownSiswaGlobal() {
  let siswaAktif = getSiswaKelasAktif();
  let kAktif = getKelasAktifUser();
  let selectAbsHtml = '<option value="">-- Pilih Siswa --</option>';
  
  siswaAktif.forEach(s => {
    selectAbsHtml += `<option value="${s.id_siswa}">${s.nama_lengkap} (Kelas ${s.kelas || kAktif})</option>`;
  });

  let elAbs = document.getElementById("selectSiswaAbsensi");
  let elKoku = document.getElementById("selectSiswaKokurikuler");
  if (elAbs) elAbs.innerHTML = selectAbsHtml;
  if (elKoku) elKoku.innerHTML = selectAbsHtml;
}

/* ===================================================
   LOAD DATA AWAL APLIKASI
   =================================================== */

async function muatDataAwal() {
  // 🎯 CEK SESI LOGIN DULU
  let userSession = getUserSession();
  if (!userSession) {
    tampilkanModalLogin();
    return; // Hentikan muat data jika belum login
  }

  terapkanHakAksesUser(userSession);
  let kAktifAwal = getKelasAktifUser();
  let reqSekolah = userSession.id_sekolah || "SCH-SINE1";

    // 🎯 AMBIL PENGATURAN SPESIFIK KELAS AKTIF (PREVENT BERANTAKAN DI FIRST LOAD)
    let resPengaturan = await fetch(`${API_URL}?action=getPengaturan&kelas=${kAktifAwal}`);
    let dataPengaturan = await resPengaturan.json();
    if (dataPengaturan.status === "success" && dataPengaturan.data) {
      infoSekolah = dataPengaturan.data;
      updateHeaderTampilan();
    }

    let resMapel = await fetch(`${API_URL}?action=getMapel`);
    let dataMapel = await resMapel.json();
    if (dataMapel.status === "success") {
      listMapelData = dataMapel.data;
      if (typeof populateFilterMapelTP === "function") populateFilterMapelTP();
      
      let selectHtml = '<option value="">-- Pilih Mata Pelajaran --</option>';
      listMapelData.forEach(m => { selectHtml += `<option value="${m.id_mapel}">${m.nama_mapel}</option>`; });
      
      if (document.getElementById("selectMapel")) document.getElementById("selectMapel").innerHTML = selectHtml;
      if (document.getElementById("tp_single_mapel")) document.getElementById("tp_single_mapel").innerHTML = selectHtml;
      if (document.getElementById("tp_bulk_mapel")) document.getElementById("tp_bulk_mapel").innerHTML = selectHtml;
    }

    let resSiswa = await fetch(`${API_URL}?action=getSiswa`);
    let dataSiswa = await resSiswa.json();
    if (dataSiswa.status === "success") {
      listSiswaData = dataSiswa.data;
      if (typeof renderTabelSiswaInput === "function") renderTabelSiswaInput();
      if (typeof renderTabelSiswaMaster === "function") renderTabelSiswaMaster();
      populateDropdownSiswaGlobal();
    }

    let resTP = await fetch(`${API_URL}?action=getTP`);
    let dataTP = await resTP.json();
    if (dataTP.status === "success") { 
      let semAktif = String(infoSekolah.semester || "1").trim();
      listTPData = dataTP.data.filter(tp => String(tp.semester || "1").trim() === semAktif); 
    }

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
    if (document.getElementById("tglPresensiHarian")) {
      document.getElementById("tglPresensiHarian").value = today;
    }

    try {
      let resNilai = await fetch(`${API_URL}?action=getNilai`);
      let dataNilai = await resNilai.json();
      if (dataNilai.status === "success") {
        listNilaiData = dataNilai.data || [];
      }
    } catch (e) { console.log("Gagal memuat data nilai awal:", e); }

    if (typeof renderDashboard === "function") renderDashboard();

  } catch (error) { alert("Gagal memuat data awal!"); }
}
