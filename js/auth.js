/* ===================================================
   MODUL AUTHENTICATION & SESSION MANAGEMENT
   =================================================== */

// 1. Cek Sesi Login Saat Aplikasi Dibuka
// 1. Cek Sesi Login Saat Aplikasi Dibuka
function cekSesiLogin() {
  let userSession = getUserSession();
  let overlayEl = document.getElementById("loginOverlay");
  let mainAppEl = document.getElementById("appMainContainer");
  
  if (!userSession) {
    if (overlayEl) overlayEl.style.setProperty("display", "flex", "important");
    if (mainAppEl) mainAppEl.style.display = "none";
  } else {
    if (overlayEl) overlayEl.style.setProperty("display", "none", "important");
    if (mainAppEl) mainAppEl.style.display = "block";
    terapkanHakAksesUser(userSession);
  }
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

      // Sembunyikan Overlay & Tampilkan Main App
      let overlayEl = document.getElementById("loginOverlay");
      let mainAppEl = document.getElementById("appMainContainer");
      if (overlayEl) overlayEl.style.setProperty("display", "none", "important");
      if (mainAppEl) mainAppEl.style.display = "block";

      alert(`🎉 Selamat Datang, ${userData.nama_lengkap}!`);

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

// 5. Terapkan Hak Akses UI Berdasarkan Role & Kelas (REVISED STRICT UI)
function terapkanHakAksesUser(user) {
  let elUserBadge = document.getElementById("userLoginBadge");
  if (elUserBadge) {
    elUserBadge.innerHTML = `👤 <strong>${user.nama_lengkap}</strong> (${user.role.toUpperCase()})`;
  }

  let selectKelas = document.getElementById("selectKelasLokal");
  let badgeKelasFase = document.getElementById("labelKelasFase");

  if (user.role === "guru" && user.kelas !== "all") {
    // 1. GURU KELAS: Sembunyikan total dropdown switcher kelas
    if (selectKelas) {
      selectKelas.style.setProperty("display", "none", "important");
    }
    // Update badge kuning header khusus guru
    if (badgeKelasFase) {
      let fase = typeof getFaseKelasAktif === "function" ? getFaseKelasAktif() : "C";
      badgeKelasFase.innerText = `Kelas ${user.kelas} (Fase ${fase})`;
    }
  } else if (user.role === "admin" || user.kelas === "all") {
    // 2. ADMIN / KEPSEK: Tampilkan dropdown switcher kelas
    if (selectKelas) {
      selectKelas.style.setProperty("display", "inline-block", "important");
      selectKelas.disabled = false;
      // Jika belum ada pilihan kelas di dropdown, default-kan ke Kelas 1
      if (!selectKelas.value || selectKelas.value === "all") {
        selectKelas.value = "1";
        localStorage.setItem("kelasAktif_User", "1");
      }
    }
    // Update badge kuning header khusus Admin/Kepsek
    if (badgeKelasFase) {
      badgeKelasFase.innerText = `Akses Admin / Kepala Sekolah`;
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
