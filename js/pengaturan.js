// 🎯 LOAD FORM PENGATURAN (MURNI DARI BARIS KELAS AKTIF DATABASE)
function loadFormPengaturan() {
  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();

  if (document.getElementById("cfg_nama_sekolah")) document.getElementById("cfg_nama_sekolah").value = infoSekolah.nama_sekolah || "";
  if (document.getElementById("cfg_npsn")) document.getElementById("cfg_npsn").value = infoSekolah.npsn || "";
  if (document.getElementById("cfg_kelas")) document.getElementById("cfg_kelas").value = kAktif;
  if (document.getElementById("cfg_fase")) document.getElementById("cfg_fase").value = infoSekolah.fase || getFaseKelasAktif();
  if (document.getElementById("cfg_tahun_ajaran")) document.getElementById("cfg_tahun_ajaran").value = infoSekolah.tahun_ajaran || "2026/2027";
  if (document.getElementById("cfg_semester")) document.getElementById("cfg_semester").value = infoSekolah.semester || "1";
  if (document.getElementById("cfg_tempat_cetak")) document.getElementById("cfg_tempat_cetak").value = infoSekolah.tempat_cetak || "Sine";
  if (document.getElementById("cfg_bobot_lm")) document.getElementById("cfg_bobot_lm").value = infoSekolah.bobot_lm !== undefined ? infoSekolah.bobot_lm : 100;
  if (document.getElementById("cfg_bobot_sts")) document.getElementById("cfg_bobot_sts").value = infoSekolah.bobot_sts !== undefined ? infoSekolah.bobot_sts : 0;
  if (document.getElementById("cfg_bobot_sas")) document.getElementById("cfg_bobot_sas").value = infoSekolah.bobot_sas !== undefined ? infoSekolah.bobot_sas : 0;
  
  // Format Tanggal Rapor
  if (infoSekolah.tanggal_rapor && document.getElementById("cfg_tanggal_rapor")) {
    try {
      let tglRaw = new Date(infoSekolah.tanggal_rapor);
      if (!isNaN(tglRaw.getTime())) {
        document.getElementById("cfg_tanggal_rapor").value = tglRaw.toISOString().split('T')[0];
      } else {
        document.getElementById("cfg_tanggal_rapor").value = infoSekolah.tanggal_rapor;
      }
    } catch (e) {
      document.getElementById("cfg_tanggal_rapor").value = infoSekolah.tanggal_rapor;
    }
  }
  
  if (document.getElementById("cfg_nama_kepsek")) document.getElementById("cfg_nama_kepsek").value = infoSekolah.nama_kepsek || "";
  if (document.getElementById("cfg_nip_kepsek")) document.getElementById("cfg_nip_kepsek").value = infoSekolah.nip_kepsek || "";

  // 🎯 BACA NAMA & NIP WALI KELAS MURNI DARI DATABASE BARIS KELAS TERSEBUT
  if (document.getElementById("cfg_nama_walikelas")) document.getElementById("cfg_nama_walikelas").value = infoSekolah.nama_walikelas || "";
  if (document.getElementById("cfg_nip_walikelas")) document.getElementById("cfg_nip_walikelas").value = infoSekolah.nip_walikelas || "";

  autoSetFase();
}

function autoSetFase() {
  let elK = document.getElementById("cfg_kelas");
  if (!elK) return;
  let k = elK.value;
  let faseOto = "C";
  if (k === "1" || k === "2") faseOto = "A";
  else if (k === "3" || k === "4") faseOto = "B";
  
  if (document.getElementById("cfg_fase")) {
    document.getElementById("cfg_fase").value = faseOto;
  }
}

// 🎯 SIMPAN PENGATURAN SEKOLAH & GURU KELAS (MULTI-ROW ISOLATION)
async function simpanPengaturanSekolah() {
  let bLM = parseFloat(document.getElementById("cfg_bobot_lm")?.value) || 0;
  let bSTS = parseFloat(document.getElementById("cfg_bobot_sts")?.value) || 0;
  let bSAS = parseFloat(document.getElementById("cfg_bobot_sas")?.value) || 0;

  let totalBobot = bLM + bSTS + bSAS;
  if (totalBobot !== 100) {
    alert(`⚠️ Pengaturan Bobot Ditolak!\n\nTotal bobot saat ini adalah ${totalBobot}%. Jumlah persentase ketiga komponen (LM + STS + SAS) WAJIB bernilai tepat 100%.`);
    return;
  }

  let kAktif = document.getElementById("cfg_kelas")?.value || "5";
  let namaWaliInput = document.getElementById("cfg_nama_walikelas")?.value.trim() || "";
  let nipWaliInput = document.getElementById("cfg_nip_walikelas")?.value.trim() || "";

  let payload = {
    nama_sekolah: document.getElementById("cfg_nama_sekolah")?.value.trim() || "",
    npsn: document.getElementById("cfg_npsn")?.value.trim() || "",
    kelas: kAktif,
    fase: document.getElementById("cfg_fase")?.value || getFaseKelasAktif(),
    tahun_ajaran: document.getElementById("cfg_tahun_ajaran")?.value.trim() || "",
    semester: document.getElementById("cfg_semester")?.value || "1",
    tempat_cetak: document.getElementById("cfg_tempat_cetak")?.value.trim() || "",
    tanggal_rapor: document.getElementById("cfg_tanggal_rapor")?.value || "",
    nama_kepsek: document.getElementById("cfg_nama_kepsek")?.value.trim() || "",
    nip_kepsek: document.getElementById("cfg_nip_kepsek")?.value.trim() || "",
    nama_walikelas: namaWaliInput,
    nip_walikelas: nipWaliInput,
    bobot_lm: bLM,
    bobot_sts: bSTS,
    bobot_sas: bSAS
  };

  if (!payload.nama_sekolah) { alert("Nama Sekolah wajib diisi!"); return; }

  let btn = document.getElementById("btnSimpanPengaturan");
  if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Menyimpan Pengaturan..."; }

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanPengaturan", data: payload })
    });
    let result = await response.json();
    if (result.status === "success") {
      // Simpan kunci kelas aktif ke localStorage
      localStorage.setItem("kelasAktif_User", kAktif);

      // Update memori global
      infoSekolah = { ...infoSekolah, ...payload };

      if (typeof updateHeaderTampilan === "function") updateHeaderTampilan();
      
      // Trigger re-render seluruh tab
      if (typeof populateDropdownSiswaGlobal === "function") populateDropdownSiswaGlobal();
      if (typeof renderTabelSiswaMaster === "function") renderTabelSiswaMaster();
      if (typeof renderTabelTP === "function") renderTabelTP();
      if (typeof renderTabelSiswaInput === "function") renderTabelSiswaInput();
      if (typeof renderTabCetakRapor === "function") renderTabCetakRapor();
      if (typeof renderDashboard === "function") renderDashboard();
      if (typeof filterDanRenderRekap === "function") filterDanRenderRekap();

      alert(`🎉 Pengaturan Baris Kelas ${kAktif} berhasil diperbarui di Database!`);
    } else { alert("Gagal menyimpan: " + result.message); }
  } catch (err) { alert("Terjadi kesalahan koneksi!"); }
  finally { 
    if (btn) { btn.disabled = false; btn.innerHTML = "💾 Simpan Pengaturan Identitas"; }
  }
}
