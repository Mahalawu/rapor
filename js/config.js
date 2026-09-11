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

// 4. Update Header Tampilan (FIXED KOTAK KOSONG ADMIN)
function updateHeaderTampilan() {
  let userSession = typeof getUserSession === "function" ? getUserSession() : null;
  let kAktif = getKelasAktifUser();
  let faseAktif = getFaseKelasAktif();
  
  infoSekolah.kelas = kAktif; 
  infoSekolah.fase = faseAktif;

  let elGreeting = document.getElementById("headerGreetingText");
  if (!elGreeting) return;

  let namaUser = userSession ? userSession.nama_lengkap : "Pengguna";
  let roleUser = userSession ? userSession.role : "guru";
  let nmSekolah = infoSekolah.nama_sekolah || "SDN Sine 1";
  let sem = infoSekolah.semester || "1";
  let thn = infoSekolah.tahun_ajaran || "2026/2027";

  if (roleUser === "admin" || kAktif === "all") {
    elGreeting.innerHTML = `👋 Halo, <strong>${namaUser}</strong>! Selamat datang di Panel Pengawasan Rapor <strong>${nmSekolah}</strong>. Semester ${sem} TH ${thn}.`;
  } else {
    elGreeting.innerHTML = `👋 Halo, <strong>${namaUser}</strong>! Selamat datang di Dashboard Rapor <strong>Kelas ${kAktif} (Fase ${faseAktif}) ${nmSekolah}</strong>. Semester ${sem} TH ${thn}.`;
  }

  // 🎯 PERBAIKAN DI SINI:
  let elSelect = document.getElementById("selectKelasLokal");
  if (elSelect) {
    // Jika kAktif adalah angka 1-6, set ke kAktif. Jika "all" atau kosong, set ke "" (-- Pilih Kelas --)
    if (["1", "2", "3", "4", "5", "6"].includes(String(kAktif))) {
      elSelect.value = String(kAktif);
    } else {
      elSelect.value = ""; // Menampilkan placeholder "-- Pilih Kelas --"
    }
  }
}

// 5. Ubah Kelas dari Dropdown Switcher Header (ISOLASI DATA 100%)
async function gantiKelasLokal(kelasBaru) {
  if (!kelasBaru) return; // Mencegah fungsi berjalan jika "-- Pilih Kelas --" diklik ulang
  
  localStorage.setItem("kelasAktif_User", kelasBaru);
  
  let userSession = typeof getUserSession === "function" ? getUserSession() : null;
  let reqSekolah = userSession ? (userSession.id_sekolah || "SCH-SINE1") : "SCH-SINE1";

  try {
    let resPengaturan = await fetch(`${API_URL}?action=getPengaturan&id_sekolah=${reqSekolah}&kelas=${kelasBaru}`);
    let dataPengaturan = await resPengaturan.json();
    if (dataPengaturan.status === "success" && dataPengaturan.data) {
      infoSekolah = dataPengaturan.data;
    }
  } catch (err) {
    console.error("Gagal memuat pengaturan kelas baru:", err);
  }

  updateHeaderTampilan();
  await muatDataAwal();
  
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
  try {
    // 🎯 1. CEK SESI LOGIN DULU
    let userSession = typeof getUserSession === "function" ? getUserSession() : null;
    if (!userSession) {
      if (typeof tampilkanModalLogin === "function") tampilkanModalLogin();
      return; // Hentikan muat data jika belum login
    }

    if (typeof terapkanHakAksesUser === "function") terapkanHakAksesUser(userSession);
    
    let kAktifAwal = getKelasAktifUser();
    let reqSekolah = userSession.id_sekolah || "SCH-SINE1";

    // 🎯 2. AMBIL PENGATURAN SPESIFIK KELAS AKTIF
    let resPengaturan = await fetch(`${API_URL}?action=getPengaturan&id_sekolah=${reqSekolah}&kelas=${kAktifAwal}`);
    let dataPengaturan = await resPengaturan.json();
    if (dataPengaturan.status === "success" && dataPengaturan.data) {
      infoSekolah = dataPengaturan.data;
      updateHeaderTampilan();
    }

    // 🎯 3. FETCH MAPEL (UNIVERSAL)
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

    // 🎯 4. FETCH SISWA (TERFILTRASI ID_SEKOLAH & KELAS)
    let resSiswa = await fetch(`${API_URL}?action=getSiswa&id_sekolah=${reqSekolah}&kelas=${kAktifAwal}`);
    let dataSiswa = await resSiswa.json();
    if (dataSiswa.status === "success") {
      listSiswaData = dataSiswa.data;
      if (typeof renderTabelSiswaInput === "function") renderTabelSiswaInput();
      if (typeof renderTabelSiswaMaster === "function") renderTabelSiswaMaster();
      populateDropdownSiswaGlobal();
    }

    // 🎯 5. FETCH TP (TERFILTRASI ID_SEKOLAH & KELAS)
    let resTP = await fetch(`${API_URL}?action=getTP&id_sekolah=${reqSekolah}&kelas=${kAktifAwal}`);
    let dataTP = await resTP.json();
    if (dataTP.status === "success") { 
      let semAktif = String(infoSekolah.semester || "1").trim();
      listTPData = dataTP.data.filter(tp => String(tp.semester || "1").trim() === semAktif); 
    }

    // 🎯 6. FETCH ABSENSI, PRESENSI & KOKURIKULER (TERFILTRASI ID_SEKOLAH)
    let resAbs = await fetch(`${API_URL}?action=getAbsensi&id_sekolah=${reqSekolah}`);
    let dataAbs = await resAbs.json();
    if (dataAbs.status === "success") { listAbsensiData = dataAbs.data; }

    let resPresHarian = await fetch(`${API_URL}?action=getPresensiHarian&id_sekolah=${reqSekolah}`);
    let dataPresHarian = await resPresHarian.json();
    if (dataPresHarian.status === "success") { listPresensiHarianData = dataPresHarian.data; }

    let resKoku = await fetch(`${API_URL}?action=getKokurikuler&id_sekolah=${reqSekolah}`);
    let dataKoku = await resKoku.json();
    if (dataKoku.status === "success") { listKokurikulerData = dataKoku.data; }

    let today = new Date().toISOString().split('T')[0];
    if (document.getElementById("tglPresensiHarian")) {
      document.getElementById("tglPresensiHarian").value = today;
    }

    // 🎯 7. FETCH NILAI (TERFILTRASI ID_SEKOLAH)
    try {
      let resNilai = await fetch(`${API_URL}?action=getNilai&id_sekolah=${reqSekolah}`);
      let dataNilai = await resNilai.json();
      if (dataNilai.status === "success") {
        listNilaiData = dataNilai.data || [];
      }
    } catch (e) { console.log("Gagal memuat data nilai awal:", e); }

    if (typeof renderDashboard === "function") renderDashboard();

  } catch (error) { 
    console.error("Error muat data awal:", error);
    alert("Gagal memuat data awal!"); 
  }
}
