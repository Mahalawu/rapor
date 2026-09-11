/* ===================================================
   MODUL AUTHENTICATION & SESSION MANAGEMENT
   =================================================== */

// 1. Cek Sesi Login Saat Aplikasi Dibuka
function cekSesiLogin() {
  let userSession = getUserSession();
  
  if (!userSession) {
    tampilkanModalLogin();
  } else {
    terapkanHakAksesUser(userSession);
  }
}

// 2. Ambil Sesi Pengguna dari Storage
function getUserSession() {
  let sessionData = sessionStorage.getItem("user_session") || localStorage.getItem("user_session");
  return sessionData ? JSON.parse(sessionData) : null;
}

// 3. Tampilkan Modal Login (Anti-Close / Paksa Login)
function tampilkanModalLogin() {
  let modalEl = document.getElementById("modalLogin");
  if (!modalEl) return;
  
  let modalObj = new bootstrap.Modal(modalEl, {
    backdrop: 'static',
    keyboard: false
  });
  modalObj.show();
}

// 4. Eksekusi Login ke Apps Script
async function prosesLogin() {
  let usernameInput = document.getElementById("login_username")?.value.trim();
  let passwordInput = document.getElementById("login_password")?.value.trim();
  let rememberMe = document.getElementById("login_remember")?.checked;

  if (!usernameInput || !passwordInput) {
    alert("⚠️ Username dan Password wajib diisi!");
    return;
  }

  let btn = document.getElementById("btnLoginSubmit");
  if (btn) { btn.disabled = true; btn.innerHTML = "⏳ Memverifikasi..."; }

  try {
    let response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "login",
        username: usernameInput,
        password: passwordInput
      })
    });

    let result = await response.json();

    if (result.status === "success") {
      let userData = result.user;

      // Simpan Sesi
      let sessionData = JSON.stringify(userData);
      if (rememberMe) {
        localStorage.setItem("user_session", sessionData);
      } else {
        sessionStorage.setItem("user_session", sessionData);
      }

      // Kunci Kelas Aktif User
      if (userData.kelas && userData.kelas !== "all") {
        localStorage.setItem("kelasAktif_User", userData.kelas);
      }

      alert(`🎉 Selamat Datang, ${userData.nama_lengkap}!`);

      // Sembunyikan Modal
      let modalEl = document.getElementById("modalLogin");
      let modalObj = bootstrap.Modal.getInstance(modalEl);
      if (modalObj) modalObj.hide();

      // Muat ulang data aplikasi sesuai identitas user
      if (typeof muatDataAwal === "function") await muatDataAwal();

    } else {
      alert("❌ " + result.message);
    }
  } catch (err) {
    alert("❌ Kesalahan koneksi saat login!");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = "🔑 Masuk Aplikasi"; }
  }
}

// 5. Terapkan Hak Akses UI Berdasarkan Role & Kelas
function terapkanHakAksesUser(user) {
  let elUserBadge = document.getElementById("userLoginBadge");
  if (elUserBadge) {
    elUserBadge.innerHTML = `👤 <strong>${user.nama_lengkap}</strong> (${user.role.toUpperCase()})`;
  }

  let selectKelas = document.getElementById("selectKelasLokal");
  
  if (user.role === "guru" && user.kelas !== "all") {
    // Jika Guru Kelas -> Kunci Dropdown Switcher Hanya Pada Kelasnya
    if (selectKelas) {
      selectKelas.value = user.kelas;
      selectKelas.disabled = true; // Kunci agar guru tak bisa ganti ke kelas lain
    }
  } else if (user.role === "admin" || user.kelas === "all") {
    // Jika Admin / Kepsek -> Bebas Pindah Kelas
    if (selectKelas) {
      selectKelas.disabled = false;
    }
  }
}

// 6. Fungsi Logout
function prosesLogout() {
  if (confirm("Apakah Anda yakin ingin keluar dari aplikasi?")) {
    sessionStorage.removeItem("user_session");
    localStorage.removeItem("user_session");
    location.reload();
  }
}
