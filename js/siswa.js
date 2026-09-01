function renderTabelSiswaMaster() {
  if (listSiswaData.length === 0) {
    document.getElementById("tabelListSiswaMaster").innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada data siswa.</td></tr>';
    return;
  }
  let html = "";
  listSiswaData.forEach((item, idx) => {
    let jk = item.jenis_kelamin || 'L';
    let kelas = item.kelas || (infoSekolah.kelas || 5);
    html += `
      <tr>
        <td>${idx + 1}</td>
        <td><small class="text-muted">${item.nis || '-'} / ${item.nisn || '-'}</small></td>
        <td><strong>${item.nama_lengkap}</strong></td>
        <td class="text-center"><span class="badge bg-secondary">${jk}</span></td>
        <td class="text-center"><span class="badge bg-primary">Kelas ${kelas}</span></td>
      </tr>
    `;
  });
  document.getElementById("tabelListSiswaMaster").innerHTML = html;
}

async function simpanSiswaSingle() {
  let nis = document.getElementById("sis_nis").value.trim();
  let nisn = document.getElementById("sis_nisn").value.trim();
  let nama = document.getElementById("sis_nama").value.trim();
  let jk = document.getElementById("sis_jk").value;

  if (!nama) { alert("Nama lengkap siswa wajib diisi!"); return; }

  let payload = [{ nis: nis, nisn: nisn, nama_lengkap: nama, jenis_kelamin: jk, kelas: infoSekolah.kelas || 5 }];
  await kirimDataSiswa(payload);
  
  document.getElementById("sis_nis").value = "";
  document.getElementById("sis_nisn").value = "";
  document.getElementById("sis_nama").value = "";
}

async function simpanSiswaBulk() {
  let textRaw = document.getElementById("sis_bulk_text").value.trim();
  if (!textRaw) { alert("Tempelkan data siswa dari Excel terlebih dahulu!"); return; }

  let lines = textRaw.split("\n");
  let payload = [];

  lines.forEach(line => {
    let cols = line.split("\t");
    if (cols.length >= 2) {
      let nis = cols[0].trim();
      let rawNisn = cols.length >= 3 ? cols[1].trim() : "-";
      let nama = cols.length >= 3 ? cols[2].trim() : cols[1].trim();
      let jk = cols.length >= 4 ? cols[3].trim().toUpperCase() : "L";

      let nisn = rawNisn;
      if (rawNisn !== "-" && !isNaN(rawNisn)) {
        nisn = rawNisn.padStart(10, "0");
      }

      if (nama) {
        payload.push({ nis: nis, nisn: nisn, nama_lengkap: nama, jenis_kelamin: jk, kelas: infoSekolah.kelas || 5 });
      }
    }
  });

  if (payload.length === 0) { alert("Format data siswa tidak terbaca!"); return; }

  await kirimDataSiswa(payload);
  document.getElementById("sis_bulk_text").value = "";
}

async function kirimDataSiswa(payload) {
  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "simpanSiswa", data: payload })
    });
    let result = await response.json();
    if (result.status === "success") {
      alert("🎉 Berhasil menyimpan Data Siswa ke Google Sheets!");
      let resSiswa = await fetch(`${API_URL}?action=getSiswa`);
      let dataSiswa = await resSiswa.json();
      if (dataSiswa.status === "success") {
        listSiswaData = dataSiswa.data;
        renderTabelSiswaMaster();
        renderTabelSiswaInput();
        renderDashboard();
      }
    } else { alert("Gagal menyimpan: " + result.message); }
  } catch (err) { alert("Terjadi kesalahan koneksi!"); }
}
