function loadFormPengaturan() {
  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : (infoSekolah.kelas || "5");

  document.getElementById("cfg_nama_sekolah").value = infoSekolah.nama_sekolah || "";
  document.getElementById("cfg_npsn").value = infoSekolah.npsn || "";
  document.getElementById("cfg_kelas").value = kAktif;
  document.getElementById("cfg_fase").value = infoSekolah.fase || "C";
  document.getElementById("cfg_tahun_ajaran").value = infoSekolah.tahun_ajaran || "2025/2026";
  document.getElementById("cfg_semester").value = infoSekolah.semester || "1";
  document.getElementById("cfg_tempat_cetak").value = infoSekolah.tempat_cetak || "Sine";
  document.getElementById("cfg_bobot_lm").value = infoSekolah.bobot_lm !== undefined ? infoSekolah.bobot_lm : 100;
  document.getElementById("cfg_bobot_sts").value = infoSekolah.bobot_sts !== undefined ? infoSekolah.bobot_sts : 0;
  document.getElementById("cfg_bobot_sas").value = infoSekolah.bobot_sas !== undefined ? infoSekolah.bobot_sas : 0;
  
  if (infoSekolah.tanggal_rapor) {
    let tglRaw = new Date(infoSekolah.tanggal_rapor);
    document.getElementById("cfg_tanggal_rapor").value = tglRaw.toISOString().split('T')[0];
  }
  
  document.getElementById("cfg_nama_kepsek").value = infoSekolah.nama_kepsek || "";
  document.getElementById("cfg_nip_kepsek").value = infoSekolah.nip_kepsek || "";

  // 🎯 BACA LOKAL DULU, JIKA KOSONG GUNAKAN DATA PERMANEN DATABASE
  let namaWaliLokal = localStorage.getItem(`wali_kelas_${kAktif}`);
  let nipWaliLokal = localStorage.getItem(`nip_wali_kelas_${kAktif}`);

  document.getElementById("cfg_nama_walikelas").value = namaWaliLokal !== null ? namaWaliLokal : (infoSekolah.nama_walikelas || "");
  document.getElementById("cfg_nip_walikelas").value = nipWaliLokal !== null ? nipWaliLokal : (infoSekolah.nip_walikelas || "");
  autoSetFase();
}

function autoSetFase() {
  let k = document.getElementById("cfg_kelas").value;
  let faseOto = "C";
  if (k === "1" || k === "2") faseOto = "A";
  else if (k === "3" || k === "4") faseOto = "B";
  
  document.getElementById("cfg_fase").value = faseOto;
}

async function simpanPengaturanSekolah() {
  let bLM = parseFloat(document.getElementById("cfg_bobot_lm").value) || 0;
  let bSTS = parseFloat(document.getElementById("cfg_bobot_sts").value) || 0;
  let bSAS = parseFloat(document.getElementById("cfg_bobot_sas").value) || 0;

  // 🛑 VALIDASI KUNCI: TOTAL BOBOT HARUS TEPAT 100%
  let totalBobot = bLM + bSTS + bSAS;
  if (totalBobot !== 100) {
    alert(`⚠️ Pengaturan Bobot Ditolak!\n\nTotal bobot saat ini adalah ${totalBobot}%. Jumlah persentase ketiga komponen (LM + STS + SAS) WAJIB bernilai tepat 100%.\n\nContoh pembagian:\n- Murni TP: LM=100%, STS=0%, SAS=0%\n- Seimbang: LM=34%, STS=33%, SAS=33%`);
    return;
  }

  let kAktif = document.getElementById("cfg_kelas").value;
  let namaWaliInput = document.getElementById("cfg_nama_walikelas").value.trim();
  let nipWaliInput = document.getElementById("cfg_nip_walikelas").value.trim();

  let payload = {
    nama_sekolah: document.getElementById("cfg_nama_sekolah").value.trim(),
    npsn: document.getElementById("cfg_npsn").value.trim(),
    kelas: kAktif,
    fase: document.getElementById("cfg_fase").value,
    tahun_ajaran: document.getElementById("cfg_tahun_ajaran").value.trim(),
    semester: document.getElementById("cfg_semester").value,
    tempat_cetak: document.getElementById("cfg_tempat_cetak").value.trim(),
    tanggal_rapor: document.getElementById("cfg_tanggal_rapor").value,
    nama_kepsek: document.getElementById("cfg_nama_kepsek").value.trim(),
    nip_kepsek: document.getElementById("cfg_nip_kepsek").value.trim(),
    nama_walikelas: namaWaliInput,
    nip_walikelas: nipWaliInput,
    bobot_lm: bLM,
    bobot_sts: bSTS,
    bobot_sas: bSAS
  };

  if (!payload.nama_sekolah) { alert("Nama Sekolah wajib diisi!"); return; }

  let btn = document.getElementById("btnSimpanPengaturan");
  btn.disabled = true; btn.innerHTML = "⏳ Menyimpan Pengaturan...";

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanPengaturan", data: payload })
    });
    let result = await response.json();
    if (result.status === "success") {
      // 1. KUNCI MANDIRI DI LOCALSTORAGE PER KELAS
      localStorage.setItem("kelasAktif_User", kAktif);
      localStorage.setItem(`wali_kelas_${kAktif}`, namaWaliInput);
      localStorage.setItem(`nip_wali_kelas_${kAktif}`, nipWaliInput);

      infoSekolah = payload;
      updateHeaderTampilan();
      
      // 2. TRIGGER RE-RENDER SELURUH TAB BERDASARKAN KELAS BARU
      if (typeof populateDropdownSiswaGlobal === "function") populateDropdownSiswaGlobal();
      if (typeof renderTabelSiswaMaster === "function") renderTabelSiswaMaster();
      if (typeof renderTabelTP === "function") renderTabelTP();
      if (typeof renderTabelSiswaInput === "function") renderTabelSiswaInput();
      if (typeof renderTabCetakRapor === "function") renderTabCetakRapor();
      if (typeof renderDashboard === "function") renderDashboard();
      if (typeof filterDanRenderRekap === "function") filterDanRenderRekap();

      alert(`🎉 Pengaturan Identitas Sekolah & Guru Kelas ${kAktif} berhasil diperbarui!`);
    } else { alert("Gagal menyimpan: " + result.message); }
  } catch (err) { alert("Terjadi kesalahan koneksi!"); }
  finally { btn.disabled = false; btn.innerHTML = "💾 Simpan Pengaturan Identitas"; }
}
