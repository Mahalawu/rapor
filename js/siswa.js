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
        <td>
          <strong>${siswa.nama_lengkap}</strong>
          ${siswa.tempat_lahir ? `<br><small class="text-muted">TTL: ${siswa.tempat_lahir}, ${siswa.tanggal_lahir || '-'}</small>` : ''}
        </td>
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
  document.getElementById("edit_sis_kelas").value = siswa.kelas || (typeof getKelasAktifUser === "function" ? getKelasAktifUser() : infoSekolah.kelas || "5");
  
  // Data Identitas Rapor Tambahan
  document.getElementById("edit_sis_tempat_lahir").value = siswa.tempat_lahir || "";
  document.getElementById("edit_sis_tanggal_lahir").value = siswa.tanggal_lahir || "";
  document.getElementById("edit_sis_agama").value = siswa.agama || "Islam";
  document.getElementById("edit_sis_alamat").value = siswa.alamat || "";
  document.getElementById("edit_sis_nama_ayah").value = siswa.nama_ayah || "";
  document.getElementById("edit_sis_nama_ibu").value = siswa.nama_ibu || "";
  document.getElementById("edit_sis_pekerjaan_ortu").value = siswa.pekerjaan_ortu || "";
  document.getElementById("edit_sis_nama_wali").value = siswa.nama_wali || "";

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
    kelas: kelas,
    tempat_lahir: document.getElementById("edit_sis_tempat_lahir")?.value.trim() || "",
    tanggal_lahir: document.getElementById("edit_sis_tanggal_lahir")?.value || "",
    agama: document.getElementById("edit_sis_agama")?.value || "Islam",
    alamat: document.getElementById("edit_sis_alamat")?.value.trim() || "",
    nama_ayah: document.getElementById("edit_sis_nama_ayah")?.value.trim() || "",
    nama_ibu: document.getElementById("edit_sis_nama_ibu")?.value.trim() || "",
    pekerjaan_ortu: document.getElementById("edit_sis_pekerjaan_ortu")?.value.trim() || "",
    nama_wali: document.getElementById("edit_sis_nama_wali")?.value.trim() || ""
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
      
      let idx = listSiswaData.findIndex(x => String(x.id_siswa).trim() === String(idSiswa).trim());
      if (idx >= 0) {
        listSiswaData[idx] = { ...listSiswaData[idx], ...payload };
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
  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : (infoSekolah.kelas || "5");

  if (!nama) { alert("Nama lengkap siswa wajib diisi!"); return; }

  let payload = [{
    nis: nis,
    nisn: nisn,
    nama_lengkap: nama,
    jenis_kelamin: jk,
    kelas: kAktif,
    tempat_lahir: document.getElementById("sis_tempat_lahir")?.value.trim() || "",
    tanggal_lahir: document.getElementById("sis_tanggal_lahir")?.value || "",
    agama: document.getElementById("sis_agama")?.value || "Islam",
    alamat: document.getElementById("sis_alamat")?.value.trim() || "",
    nama_ayah: document.getElementById("sis_nama_ayah")?.value.trim() || "",
    nama_ibu: document.getElementById("sis_nama_ibu")?.value.trim() || "",
    pekerjaan_ortu: document.getElementById("sis_pekerjaan_ortu")?.value.trim() || "",
    nama_wali: document.getElementById("sis_nama_wali")?.value.trim() || ""
  }];

  await kirimDataSiswa(payload);
  
  // Clear input
  document.getElementById("sis_nis").value = "";
  document.getElementById("sis_nisn").value = "";
  document.getElementById("sis_nama").value = "";
  if(document.getElementById("sis_tempat_lahir")) document.getElementById("sis_tempat_lahir").value = "";
  if(document.getElementById("sis_tanggal_lahir")) document.getElementById("sis_tanggal_lahir").value = "";
  if(document.getElementById("sis_alamat")) document.getElementById("sis_alamat").value = "";
  if(document.getElementById("sis_nama_ayah")) document.getElementById("sis_nama_ayah").value = "";
  if(document.getElementById("sis_nama_ibu")) document.getElementById("sis_nama_ibu").value = "";
  if(document.getElementById("sis_pekerjaan_ortu")) document.getElementById("sis_pekerjaan_ortu").value = "";
  if(document.getElementById("sis_nama_wali")) document.getElementById("sis_nama_wali").value = "";
}

// 🎯 IMPORT EXCEL MENDUKUNG HINGGA 14 KOLOM URUT SPREADSHEET
async function simpanSiswaBulk() {
  let textRaw = document.getElementById("sis_bulk_text").value.trim();
  if (!textRaw) { alert("Tempelkan data siswa dari Excel terlebih dahulu!"); return; }

  let kAktif = typeof getKelasAktifUser === "function" ? getKelasAktifUser() : (infoSekolah.kelas || "5");
  let lines = textRaw.split("\n");
  let payload = [];

  lines.forEach(line => {
    let cols = line.split("\t");
    if (cols.length >= 2) {
      let nis = cols[0] ? cols[0].trim() : "";
      let rawNisn = cols.length >= 2 ? cols[1].trim() : "-";
      let nama = cols.length >= 3 ? cols[2].trim() : cols[0].trim();
      let jk = cols.length >= 4 && cols[3].trim() ? cols[3].trim().toUpperCase() : "L";

      let nisn = rawNisn;
      if (rawNisn !== "-" && !isNaN(rawNisn)) {
        nisn = rawNisn.padStart(10, "0");
      }

      if (nama) {
        payload.push({
          nis: nis,
          nisn: nisn,
          nama_lengkap: nama,
          jenis_kelamin: jk,
          kelas: kAktif,
          tempat_lahir: cols[4] ? cols[4].trim() : "",
          tanggal_lahir: cols[5] ? cols[5].trim() : "",
          agama: cols[6] ? cols[6].trim() : "Islam",
          alamat: cols[7] ? cols[7].trim() : "",
          nama_ayah: cols[8] ? cols[8].trim() : "",
          nama_ibu: cols[9] ? cols[9].trim() : "",
          pekerjaan_ortu: cols[10] ? cols[10].trim() : "",
          nama_wali: cols[11] ? cols[11].trim() : ""
        });
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
