function renderTabelTP() {
  if (listTPData.length === 0) {
    document.getElementById("tabelListTP").innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada data TP.</td></tr>';
    return;
  }
  let html = "";
  listTPData.forEach((item, idx) => {
    let m = listMapelData.find(x => String(x.id_mapel).trim().toUpperCase() === String(item.id_mapel).trim().toUpperCase());
    let namaMapel = m ? m.nama_mapel : item.id_mapel;

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><span class="badge bg-secondary">${namaMapel}</span></td>
        <td><span class="badge bg-info text-dark">${item.id_tp}</span></td>
        <td>${item.narasi_tp}</td>
      </tr>
    `;
  });
  document.getElementById("tabelListTP").innerHTML = html;
}

async function simpanTPSingle() {
  let mapel = document.getElementById("tp_single_mapel").value;
  let kode = document.getElementById("tp_single_kode").value.trim();
  let narasi = document.getElementById("tp_single_narasi").value.trim();

  if (!mapel || !kode || !narasi) { alert("Lengkapi semua kolom TP!"); return; }

  let payload = [{ id_tp: kode, id_mapel: mapel, kelas: infoSekolah.kelas || 5, semester: infoSekolah.semester || 1, narasi_tp: narasi }];
  await kirimDataTP(payload);
  
  document.getElementById("tp_single_kode").value = "";
  document.getElementById("tp_single_narasi").value = "";
}

async function simpanTPBulk() {
  let targetMapel = document.getElementById("tp_bulk_mapel").value;
  let textRaw = document.getElementById("tp_bulk_text").value.trim();

  if (!targetMapel) { alert("Pilih Target Mata Pelajaran terlebih dahulu!"); return; }
  if (!textRaw) { alert("Tempelkan teks data TP dari Excel terlebih dahulu!"); return; }

  let lines = textRaw.split("\n");
  let payload = [];

  lines.forEach(line => {
    let cols = line.split("\t");
    if (cols.length >= 2) {
      let kode = cols[0].trim();
      let narasi = cols.slice(1).join(" ").trim(); 

      if (kode && narasi) {
        payload.push({ 
          id_tp: kode, 
          id_mapel: targetMapel, 
          kelas: infoSekolah.kelas || 5, 
          semester: infoSekolah.semester || 1, 
          narasi_tp: narasi 
        });
      }
    }
  });

  if (payload.length === 0) { alert("Format data TP tidak terbaca!"); return; }

  await kirimDataTP(payload);
  document.getElementById("tp_bulk_text").value = "";
}

async function kirimDataTP(payload) {
  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanTP", data: payload })
    });

    let result = await response.json();
    if (result.status === "success") {
      alert("🎉 Berhasil menyimpan data TP ke Google Sheets!");
      payload.forEach(p => listTPData.push(p));
      renderTabelTP();
      renderDashboard();
    } else {
      alert("Gagal menyimpan dari server: " + result.message);
    }
  } catch (err) { alert("Gagal terhubung ke GAS!"); }
}
