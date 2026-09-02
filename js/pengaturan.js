function loadFormPengaturan() {
  document.getElementById("cfg_nama_sekolah").value = infoSekolah.nama_sekolah || "";
  document.getElementById("cfg_npsn").value = infoSekolah.npsn || "";
  document.getElementById("cfg_kelas").value = infoSekolah.kelas || "5";
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
  document.getElementById("cfg_nama_walikelas").value = infoSekolah.nama_walikelas || "";
  document.getElementById("cfg_nip_walikelas").value = infoSekolah.nip_walikelas || "";
}

function autoSetFase() {
  let k = document.getElementById("cfg_kelas").value;
  if (k === "1" || k === "2") document.getElementById("cfg_fase").value = "A";
  else if (k === "3" || k === "4") document.getElementById("cfg_fase").value = "B";
  else document.getElementById("cfg_fase").value = "C";
}

async function simpanPengaturanSekolah() {
  let payload = {
    nama_sekolah: document.getElementById("cfg_nama_sekolah").value.trim(),
    npsn: document.getElementById("cfg_npsn").value.trim(),
    kelas: document.getElementById("cfg_kelas").value,
    fase: document.getElementById("cfg_fase").value,
    tahun_ajaran: document.getElementById("cfg_tahun_ajaran").value.trim(),
    semester: document.getElementById("cfg_semester").value,
    tempat_cetak: document.getElementById("cfg_tempat_cetak").value.trim(),
    tanggal_rapor: document.getElementById("cfg_tanggal_rapor").value,
    nama_kepsek: document.getElementById("cfg_nama_kepsek").value.trim(),
    nip_kepsek: document.getElementById("cfg_nip_kepsek").value.trim(),
    nama_walikelas: document.getElementById("cfg_nama_walikelas").value.trim(),
    nip_walikelas: document.getElementById("cfg_nip_walikelas").value.trim(),
    bobot_lm: parseFloat(document.getElementById("cfg_bobot_lm").value) || 0,
    bobot_sts: parseFloat(document.getElementById("cfg_bobot_sts").value) || 0,
    bobot_sas: parseFloat(document.getElementById("cfg_bobot_sas").value) || 0
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
      alert("🎉 Pengaturan Identitas Sekolah & Wali Kelas berhasil diperbarui!");
      infoSekolah = payload;
      updateHeaderTampilan();
    } else { alert("Gagal menyimpan: " + result.message); }
  } catch (err) { alert("Terjadi kesalahan koneksi!"); }
  finally { btn.disabled = false; btn.innerHTML = "💾 Simpan Pengaturan Identitas"; }
}
