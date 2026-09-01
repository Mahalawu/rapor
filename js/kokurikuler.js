function pilihSiswaKokurikuler() {
  let idSiswa = document.getElementById("selectSiswaKokurikuler").value;
  let formBody = document.getElementById("formKokurikulerBody");
  if (!idSiswa) { formBody.style.display = "none"; return; }

  formBody.style.display = "block";

  let koku = listKokurikulerData.find(x => String(x.id_siswa).trim() === String(idSiswa).trim());
  if (koku) {
    document.getElementById("koku_wadah").value = koku.wadah_kokurikuler || "7 KAIH";
    document.getElementById("koku_judul").value = koku.judul_tema || "";
    document.getElementById("koku_dimensi_tertinggi").value = koku.dimensi_tertinggi || "Keimanan dan Ketakwaan terhadap Tuhan YME";
    document.getElementById("koku_dimensi_terendah").value = koku.dimensi_terendah || "Kemandirian";
  } else {
    document.getElementById("koku_dimensi_tertinggi").value = "Keimanan dan Ketakwaan terhadap Tuhan YME";
    document.getElementById("koku_dimensi_terendah").value = "Kemandirian";
  }
  updateLivePreviewKoku();
}

function updateLivePreviewKoku() {
  let idSiswa = document.getElementById("selectSiswaKokurikuler").value;
  let s = listSiswaData.find(x => String(x.id_siswa).trim() === String(idSiswa).trim());
  let namaSiswa = s ? s.nama_lengkap : "SISWA";

  let dimTinggi = document.getElementById("koku_dimensi_tertinggi").value;
  let dimRendah = document.getElementById("koku_dimensi_terendah").value;
  let tema = document.getElementById("koku_judul").value.trim() || "Kegiatan Kokurikuler";

  let narasiUtuh = `Ananda ${namaSiswa} sudah baik dalam penerapan dimensi ${dimTinggi} dan perlu berlatih dalam penerapan dimensi ${dimRendah} dalam tema "${tema}".`;

  document.getElementById("prev_desc_tertinggi").innerText = narasiUtuh;
  // Sembunyikan container deskripsi terendah jika masih ada di UI
  if (document.getElementById("prev_desc_terendah")) {
    document.getElementById("prev_desc_terendah").parentElement.style.display = "none";
  }
}

async function simpanKokurikulerSiswa() {
  let idSiswa = document.getElementById("selectSiswaKokurikuler").value;
  if (!idSiswa) { alert("Pilih siswa terlebih dahulu!"); return; }

  let s = listSiswaData.find(x => String(x.id_siswa).trim() === String(idSiswa).trim());
  let namaSiswa = s ? s.nama_lengkap : "SISWA";

  let dimTinggi = document.getElementById("koku_dimensi_tertinggi").value;
  let dimRendah = document.getElementById("koku_dimensi_terendah").value;
  let tema = document.getElementById("koku_judul").value.trim() || "Kegiatan Kokurikuler";

  let narasiUtuh = `Ananda ${namaSiswa} sudah baik dalam penerapan dimensi ${dimTinggi} dan perlu berlatih dalam penerapan dimensi ${dimRendah} dalam tema "${tema}".`;

  let payload = {
    id_siswa: idSiswa,
    wadah_kokurikuler: document.getElementById("koku_wadah").value,
    judul_tema: tema,
    dimensi_tertinggi: dimTinggi,
    dimensi_terendah: dimRendah,
    deskripsi_tertinggi: narasiUtuh,
    deskripsi_terendah: "-"
  };

  let btn = document.getElementById("btnSimpanKokurikuler");
  btn.disabled = true; btn.innerHTML = "⏳ Menyimpan Kokurikuler...";

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanKokurikuler", data: payload })
    });

    let result = await response.json();
    if (result.status === "success") {
      alert("🎉 Data Kokurikuler berhasil disimpan!");
      let idx = listKokurikulerData.findIndex(x => String(x.id_siswa).trim() === String(idSiswa).trim());
      if (idx >= 0) { listKokurikulerData[idx] = payload; } else { listKokurikulerData.push(payload); }
      renderDashboard();
    } else { alert("Gagal menyimpan: " + result.message); }
  } catch (err) { alert("Terjadi kesalahan koneksi!"); }
  finally { btn.disabled = false; btn.innerHTML = "💾 Simpan Penilaian Kokurikuler Siswa"; }
}
