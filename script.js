// ==========================================
// THE NOXUZ SYSTEM - CORE SCRIPT
// ==========================================

const ROLES = {
    OWNER: { name: "Owner / Founder", limit: Infinity, color: "gold" },
    ADMIN: { name: "Administrator", limit: Infinity, color: "#ff3333" }, 
    PREMIUM: { name: "Premium Member", limit: 500, color: "#00ffff" }, 
    MEMBER: { name: "Member", limit: 25, color: "#aaa" }
};

let currentUser = "";
let currentRole = ROLES.MEMBER;
let chatLimit = 25;

// --- 1. LOGIN & REGISTER ---
function handleRegister() {
    let u = document.getElementById('userInp').value.trim();
    let p = document.getElementById('passInp').value;
    if(!u || !p) return alert("Username & Password wajib diisi!");
    if(u.toLowerCase() === "noxuz") return alert("Username 'Noxuz' sudah dikunci!");
    if(localStorage.getItem('pass_' + u)) return alert("Username sudah terpakai!");
    
    localStorage.setItem('pass_' + u, p);
    localStorage.setItem('role_' + u, "MEMBER");
    localStorage.setItem('limit_' + u, 25);
    alert("✅ Berhasil! Silakan Login.");
}

function handleLogin() {
    let u = document.getElementById('userInp').value.trim();
    let p = document.getElementById('passInp').value;
    let today = new Date().toDateString();

    // LOGIN KHUSUS OWNER
    if(u.toLowerCase() === "noxuz" && p === "admin123") { // GANTI PASS DISINI!
        currentUser = "Noxuz"; currentRole = ROLES.OWNER; chatLimit = Infinity;
        document.getElementById('login-screen').style.display = "none";
        return;
    }

    let savedPass = localStorage.getItem('pass_' + u);
    if(savedPass && savedPass === p) {
        currentUser = u;
        let savedRole = localStorage.getItem('role_' + u) || "MEMBER";
        currentRole = ROLES[savedRole];
        
        // Reset Limit Harian
        let lastDate = localStorage.getItem('lastDate_' + u);
        if(lastDate !== today) {
            chatLimit = currentRole.limit;
            localStorage.setItem('limit_' + u, chatLimit);
            localStorage.setItem('lastDate_' + u, today);
        } else {
            chatLimit = parseInt(localStorage.getItem('limit_' + u)) || currentRole.limit;
        }
        document.getElementById('login-screen').style.display = "none";
    } else { alert("Data tidak cocok!"); }
}

// --- 2. CORE CHATBOT ENGINE ---
function sendMsg() {
    let inp = document.getElementById('chatInput');
    let val = inp.value.trim();
    let msg = val.toLowerCase();
    let box = document.getElementById('chatBox');
    if(!val) return;

    // --- PROTEKSI SYSTEM ---
    let isOffline = localStorage.getItem('system_power');
    let isMaint = localStorage.getItem('system_maint');

    if(isOffline === "off" && currentRole !== ROLES.OWNER) {
        box.innerHTML += `<div class="bot-bubble" style="border-color:#444; background:#000;">🌑 <b>SYSTEM OFFLINE</b></div>`;
        inp.value = ""; return;
    }
    if(isMaint === "on" && currentRole !== ROLES.OWNER) {
        box.innerHTML += `<div class="bot-bubble" style="border-color:orange;">🛠 <b>MAINTENANCE MODE</b></div>`;
        inp.value = ""; return;
    }

    // --- BAN CHECK ---
    let isBanned = localStorage.getItem('status_ban_' + currentUser);
    if(isBanned === "true" && currentRole !== ROLES.OWNER) {
        let reason = localStorage.getItem('reason_ban_' + currentUser);
        box.innerHTML += `<div class="bot-bubble" style="border-color:red; color:red;">🚫 <b>ACCESS DENIED</b><br>Alasan: ${reason}</div>`;
        inp.value = ""; return;
    }

    // --- LIMIT CHECK ---
    if((currentRole === ROLES.MEMBER || currentRole === ROLES.PREMIUM) && chatLimit <= 0) {
        box.innerHTML += `<div class="bot-bubble" style="border-color:red;">⚠️ Limit Habis! Silakan upgrade Premium.</div>`;
        inp.value = ""; return;
    }

    // Display Pesan User
    box.innerHTML += `<div class="user-msg">${currentUser}: ${val}</div>`;

    setTimeout(() => {
        let res = "";
        
        // LOGIKA PERINTAH
        if(msg === ".menu") {
            let adminMenu = (currentRole === ROLES.OWNER || currentRole === ROLES.ADMIN) ? "┃ ◼ .adminmenu<br>" : "";
            let ownerMenu = (currentRole === ROLES.OWNER) ? "┃ ◼ .ownermenu<br>" : "";
            res = `👤 User: <b>${currentUser}</b> | Role: <b style="color:${currentRole.color}">${currentRole.name}</b><br>
                   🔋 Limit: <b>${currentRole.limit === Infinity ? '∞' : chatLimit}</b><br>
                   <div class="menu-box">┏━━━━ [ MENU ] ━━━━┓<br>┃ ◼ .kata tajam<br>┃ ◼ .anime<br>${adminMenu}${ownerMenu}┗━━━━━━━━━━━━━━━━━┛</div>`;
        }

        // --- COMMAND KHUSUS OWNER ---
        else if(msg === ".ownermenu" && currentRole === ROLES.OWNER) {
            res = `<div class="menu-box" style="border-color:gold;"><b>⚡ OWNER CONTROL ⚡</b><br>┃ .promote [u] [role]<br>┃ .ban [u] [alasan]<br>┃ .cekpass [u]<br>┃ .shutdown / .powerup<br>┃ .maint on / off</div>`;
        }
        else if(msg.startsWith(".cekpass ") && currentRole === ROLES.OWNER) {
            let t = val.split(" ")[1];
            let p = localStorage.getItem('pass_' + t);
            res = p ? `🔑 Password <b>${t}</b>: <code>${p}</code>` : "User tidak ditemukan.";
        }
        else if(msg === ".shutdown" && currentRole === ROLES.OWNER) {
            localStorage.setItem('system_power', "off"); res = "🌑 System Shutdown.";
        }
        else if(msg === ".powerup" && currentRole === ROLES.OWNER) {
            localStorage.setItem('system_power', "on"); res = "🌕 System Online.";
        }
        else if(msg.startsWith(".maint ") && currentRole === ROLES.OWNER) {
            let s = val.split(" ")[1];
            localStorage.setItem('system_maint', s);
            res = `🛠 Maintenance: ${s.toUpperCase()}`;
        }
        else if(msg.startsWith(".promote ") && currentRole === ROLES.OWNER) {
            let parts = val.split(" "); let t = parts[1]; let l = parts[2].toUpperCase();
            if(ROLES[l]) {
                localStorage.setItem('role_' + t, l);
                localStorage.setItem('limit_' + t, ROLES[l].limit);
                res = `✅ Role <b>${t}</b> ditingkatkan menjadi <b>${l}</b>.`;
            } else { res = "Role tidak valid! (ADMIN/PREMIUM/MEMBER)"; }
        }
        
        // --- COMMAND ADMIN ---
        else if(msg.startsWith(".ban ") && (currentRole === ROLES.OWNER || currentRole === ROLES.ADMIN)) {
            let parts = val.split(" "); let t = parts[1]; let r = parts.slice(2).join(" ");
            localStorage.setItem('status_ban_' + t, "true");
            localStorage.setItem('reason_ban_' + t, r || "Melanggar aturan.");
            res = `🔨 User <b>${t}</b> telah di-ban.`;
        }

        // DEFAULT CHAT
        else {
            res = "Perintah tidak dikenal. Ketik <b>.menu</b> untuk bantuan Master.";
        }

        // KURANGI LIMIT
        if(currentRole === ROLES.MEMBER || currentRole === ROLES.PREMIUM) {
            chatLimit--;
            localStorage.setItem('limit_' + currentUser, chatLimit);
        }

        box.innerHTML += `<div class="bot-bubble"><b>Noxuz:</b><br>${res}</div>`;
        box.scrollTop = box.scrollHeight;
    }, 400);

    inp.value = "";
}

