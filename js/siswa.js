function renderTabelSiswaMaster() {
  let container = document.getElementById("tabelListSiswaMaster");
  if (!container) return;

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : String(infoSekolah.kelas || "5").trim();
  
  let listSiswaAktif = listSiswaData.filter(s => String(s.kelas || "5").trim() === kAktif);

  if (listSiswaAktif.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Belum ada data siswa tersimpan untuk Kelas ${kAktif}.</td></tr>`;
    return;
  }

  let html = "";
  listSiswaAktif.forEach((siswa, idx) => {
    let idS = String(siswa.id_siswa).trim();
    html += `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><small class="text-muted font-monospace">${siswa.nis || '-'} / ${siswa.nisn || '-'}</small></td>
        <td><strong>${siswa.nama_lengkap}</strong></td>
        <td class="text-center">${siswa.jenis_kelamin || 'L'}</td>
        <td class="text-center"><span class="badge bg-info text-dark">Kelas ${siswa.kelas || 5}</span></td>
        <td class="text-center">
          <button onclick="bukaModalEditSiswa('${idS}')" class="btn btn-sm btn-outline-warning me-1" title="Edit Siswa">✏️</button>
          <button onclick="hapusSiswa('${idS}', '${siswa.nama_lengkap}')" class="btn btn-sm btn-outline-danger" title="Hapus Siswa">🗑️</button>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
}

function bukaModalEditSiswa(idSiswa) {
  let siswa = listSiswaData.find(x => String(x.id_siswa).trim() === String(idSiswa).trim());
  if (!siswa) return;

  document.getElementById("edit_sis_id").value = siswa.id_siswa;
  document.getElementById("edit_sis_nis").value = siswa.nis || "";
  document.getElementById("edit_sis_nisn").value = siswa.nisn || "";
  document.getElementById("edit_sis_nama").value = siswa.nama_lengkap || "";
  document.getElementById("edit_sis_jk").value = siswa.jenis_kelamin || "L";
  document.getElementById("edit_sis_kelas").value = siswa.kelas || infoSekolah.kelas || "5";

  let modal = new bootstrap.Modal(document.getElementById('modalEditSiswa'));
  modal.show();
}

async function simpanEditSiswa() {
  let idSiswa = document.getElementById("edit_sis_id").value;
  let nis = document.getElementById("edit_sis_nis").value.trim();
  let nisn = document.getElementById("edit_sis_nisn").value.trim();
  let nama = document.getElementById("edit_sis_nama").value.trim();
  let jk = document.getElementById("edit_sis_jk").value;
  let kelas = document.getElementById("edit_sis_kelas").value;

  if (!nama) { alert("Nama Siswa tidak boleh kosong!"); return; }

  let payload = {
    id_siswa: idSiswa,
    nis: nis,
    nisn: nisn,
    nama_lengkap: nama,
    jenis_kelamin: jk,
    kelas: kelas
  };

  let btn = document.getElementById("btnSimpanEditSiswa");
  btn.disabled = true; btn.innerHTML = "⏳ Menyimpan...";

  try {
    let res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "editSiswa", data: payload })
    });
    let result = await res.json();

    if (result.status === "success") {
      alert("🎉 " + result.message);
      
      // Update memori lokal
      let idx = listSiswaData.findIndex(x => String(x.id_siswa).trim() === String(idSiswa).trim());
      if (idx >= 0) {
        listSiswaData[idx] = payload;
      }

      renderTabelSiswaMaster();
      
      let modalEl = document.getElementById('modalEditSiswa');
      let modalObj = bootstrap.Modal.getInstance(modalEl);
      if (modalObj) modalObj.hide();
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (err) {
    alert("Kesalahan koneksi!");
  } finally {
    btn.disabled = false; btn.innerHTML = "💾 Simpan Perubahan";
  }
}

async function hapusSiswa(idSiswa, namaSiswa) {
  if (!confirm(`Apakah Anda yakin ingin menghapus siswa "${namaSiswa}"?\n\nSemua data nilai dan presensi siswa ini juga perlu diperhatikan.`)) {
    return;
  }

  try {
    let res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "hapusSiswa", id_siswa: idSiswa })
    });
    let result = await res.json();

    if (result.status === "success") {
      alert("🗑️ " + result.message);
      
      // Hapus dari memori lokal
      listSiswaData = listSiswaData.filter(x => String(x.id_siswa).trim() !== String(idSiswa).trim());
      renderTabelSiswaMaster();
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (err) {
    alert("Kesalahan koneksi!");
  }
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
