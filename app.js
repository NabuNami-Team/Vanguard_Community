const THAI_REGIONS = {
  "ภาคกลาง": ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "พระนครศรีอยุธยา"],
  "ภาคเหนือ": ["เชียงใหม่", "เชียงราย", "ลำปาง", "แพร่"],
  "ภาคตะวันออกเฉียงเหนือ": ["ขอนแก่น", "นครราชสีมา", "อุดรธานี", "อุบลราชธานี"],
  "ภาคตะวันออก": ["ชลบุรี", "ระยอง", "จันทบุรี"],
  "ภาคตะวันตก": ["กาญจนบุรี", "ราชบุรี"],
  "ภาคใต้": ["สงขลา", "ภูเก็ต", "สุราษฎร์ธานี"]
};
const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

function getGradeInfo(user) {
  if (user.isAdmin) return { grade: "Grade Admin", title: "ผู้ดูแลระบบ", quota: Infinity };
  const pt = user.points || 0;
  if (pt >= 25000) return { grade: "Grade Champion", title: "แชมเปี้ยน", quota: 1500 };
  if (pt >= 10000) return { grade: "Grade 4", title: "มือโปร", quota: 750 };
  if (pt >= 7500)  return { grade: "Grade 3", title: "ผู้เล่นระดับสูง", quota: 600 };
  if (pt >= 3500)  return { grade: "Grade 2", title: "ผู้เล่นระดับปกติ", quota: 450 };
  if (pt >= 1000)  return { grade: "Grade 1", title: "ผู้เล่นฝึกหัด", quota: 300 };
  return { grade: "Grade 0", title: "เกรดเริ่มต้น", quota: 250 };
}

function initStorage() {
  if (!localStorage.getItem("vg_users")) {
    localStorage.setItem("vg_users", JSON.stringify([
      { username: "admin", email: "admin@gmail.com", password: "admin123", points: 99999, isAdmin: true, dailyUsed: 0, lastQuotaDate: new Date().toDateString() },
      { username: "Aichi_Sendou", email: "aichi@gmail.com", password: "1234", points: 12500, isAdmin: false, dailyUsed: 0, lastQuotaDate: new Date().toDateString() }
    ]));
  }
  if (!localStorage.getItem("vg_quests")) {
    localStorage.setItem("vg_quests", JSON.stringify([
      { id: "Q101", title: "นัดเทสเด็ค Format D", tag: "Format D", reward: 150, region: "ภาคกลาง", province: "กรุงเทพมหานคร", desc: "เจอกันร้านการ์ด MBK", creator: "Aichi_Sendou", completedBy: null }
    ]));
  }
  if (!localStorage.getItem("vg_chat_groups")) {
    localStorage.setItem("vg_chat_groups", JSON.stringify([
      { id: "general", name: "🌐 ห้องรวมทั่วไป", creator: "Admin" },
      { id: "format-d", name: "⚔️ พูดคุย Format D", creator: "Aichi_Sendou" }
    ]));
  }
  if (!localStorage.getItem("vg_chat_messages")) {
    localStorage.setItem("vg_chat_messages", JSON.stringify([
      { groupId: "general", sender: "Admin", text: "ยินดีต้อนรับสู่ Vanguard Online ครับ!", time: "12:00" }
    ]));
  }
}

function getUsers() { return JSON.parse(localStorage.getItem("vg_users") || "[]"); }
function saveUsers(u) { localStorage.setItem("vg_users", JSON.stringify(u)); }
function getQuests() { return JSON.parse(localStorage.getItem("vg_quests") || "[]"); }
function saveQuests(q) { localStorage.setItem("vg_quests", JSON.stringify(q)); }
function getCurrentUser() {
  const uname = sessionStorage.getItem("vg_current_user");
  return uname ? getUsers().find(u => u.username === uname) || null : null;
}

function switchAuthTab(tab) {
  document.getElementById("login-form").classList.toggle("hidden", tab !== "login");
  document.getElementById("register-form").classList.toggle("hidden", tab !== "register");
}

function handleRegister(e) {
  e.preventDefault();
  if (!document.getElementById("reg-captcha").checked) { alert("กรุณากดยืนยันตัวตน"); return; }
  const username = document.getElementById("reg-user").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-pass").value;
  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) { alert("ชื่อซ้ำ!"); return; }
  users.push({ username, email, password, points: 0, isAdmin: false, dailyUsed: 0, lastQuotaDate: new Date().toDateString() });
  saveUsers(users);
  sessionStorage.setItem("vg_current_user", username);
  enterApp();
}

function handleLogin(e) {
  e.preventDefault();
  if (!document.getElementById("login-captcha").checked) { alert("กรุณากดยืนยันตัวตน"); return; }
  const id = document.getElementById("login-id").value.trim();
  const pass = document.getElementById("login-pass").value;
  const user = getUsers().find(u => (u.username.toLowerCase() === id.toLowerCase() || u.email.toLowerCase() === id.toLowerCase()) && u.password === pass);
  if (!user) { alert("ข้อมูลไม่ถูกต้อง!"); return; }
  sessionStorage.setItem("vg_current_user", user.username);
  enterApp();
}

function logout() { sessionStorage.removeItem("vg_current_user"); location.reload(); }

function enterApp() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("app-section").classList.remove("hidden");
  if (user.isAdmin) document.getElementById("nav-admin").classList.remove("hidden");
  populateRegionDropdowns();
  refreshAllUI();
  switchPage("status");
}

function switchPage(pId) {
  ["status", "quests", "create-quest", "battle", "chat", "ranking", "admin"].forEach(p => {
    const el = document.getElementById("page-" + p);
    if (el) el.classList.add("hidden");
    const btn = document.getElementById("nav-" + p);
    if (btn) btn.classList.remove("active");
  });
  const target = document.getElementById("page-" + pId);
  if (target) target.classList.remove("hidden");
  const activeBtn = document.getElementById("nav-" + pId);
  if (activeBtn) activeBtn.classList.add("active");
  refreshAllUI();
}

function refreshAllUI() {
  const user = getCurrentUser();
  if (!user) return;
  const gradeInfo = getGradeInfo(user);
  const ranked = getUsers().filter(u => !u.isAdmin).sort((a, b) => b.points - a.points);
  const myRank = ranked.findIndex(u => u.username === user.username);

  if (document.getElementById("header-username")) {
    document.getElementById("header-username").textContent = user.username;
    document.getElementById("header-points").textContent = user.points.toLocaleString();
    document.getElementById("header-grade-badge").textContent = gradeInfo.grade;
    document.getElementById("stat-username").textContent = user.username;
    document.getElementById("stat-grade-pill").textContent = gradeInfo.grade;
    document.getElementById("stat-grade-title").textContent = gradeInfo.title;
    document.getElementById("stat-points").textContent = `${user.points.toLocaleString()} PT`;
    document.getElementById("stat-rank").textContent = user.isAdmin ? "Admin" : `#${myRank + 1}`;
    document.getElementById("stat-quota").textContent = user.isAdmin ? "ไม่จำกัด" : `${Math.max(0, gradeInfo.quota - user.dailyUsed)} / ${gradeInfo.quota} PT`;
  }

  renderQuests();
  renderRanking();
  renderChatGroups();
  renderChatMessages();
  if (user.isAdmin && typeof renderAdminPanel === "function") renderAdminPanel();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Chat System Functions
let activeGroupId = "general";
function renderChatGroups() {
  const groups = JSON.parse(localStorage.getItem("vg_chat_groups") || "[]");
  const el = document.getElementById("chat-group-list");
  if (!el) return;
  el.innerHTML = groups.map(g => `
    <button onclick="selectChatGroup('${g.id}', '${g.name}')" class="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition ${activeGroupId === g.id ? 'bg-cyan-600/30 border border-cyan-400 text-white' : 'text-slate-300 hover:bg-slate-800'}">
      ${g.name}
    </button>
  `).join("");
}
function selectChatGroup(id, name) {
  activeGroupId = id;
  const el = document.getElementById("current-chat-room-name");
  if (el) el.textContent = name;
  renderChatGroups();
  renderChatMessages();
}
function renderChatMessages() {
  const msgs = JSON.parse(localStorage.getItem("vg_chat_messages") || "[]").filter(m => m.groupId === activeGroupId);
  const container = document.getElementById("chat-messages-container");
  if (!container) return;
  if (msgs.length === 0) { container.innerHTML = `<div class="text-center text-slate-500 py-10">ยังไม่มีข้อความ เริ่มสนทนาเลย!</div>`; return; }
  container.innerHTML = msgs.map(m => `
    <div class="p-2 rounded bg-slate-950/60 border border-slate-800">
      <div class="flex justify-between items-center mb-1"><span class="font-bold text-sky-400">${m.sender}</span><span class="text-[10px] text-slate-500">${m.time}</span></div>
      <p class="text-slate-200">${m.text}</p>
    </div>
  `).join("");
  container.scrollTop = container.scrollHeight;
}
function sendChatMessage(e) {
  e.preventDefault();
  const user = getCurrentUser();
  const input = document.getElementById("chat-input-msg");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const msgs = JSON.parse(localStorage.getItem("vg_chat_messages") || "[]");
  msgs.push({ groupId: activeGroupId, sender: user.username, text, time: timeStr });
  localStorage.setItem("vg_chat_messages", JSON.stringify(msgs));
  input.value = "";
  renderChatMessages();
}
function openCreateGroupModal() {
  const name = prompt("ตั้งชื่อกลุ่มพูดคุยใหม่:");
  if (!name) return;
  const groups = JSON.parse(localStorage.getItem("vg_chat_groups") || "[]");
  const id = "group_" + Date.now();
  groups.push({ id, name, creator: getCurrentUser().username });
  localStorage.setItem("vg_chat_groups", JSON.stringify(groups));
  selectChatGroup(id, name);
}

// Quests
function populateRegionDropdowns() {
  const fReg = document.getElementById("filter-region");
  const cReg = document.getElementById("q-region");
  if (!fReg || !cReg || cReg.options.length > 0) return;
  Object.keys(THAI_REGIONS).forEach(r => { fReg.add(new Option(r, r)); cReg.add(new Option(r, r)); });
  updateProvinceDropdown("filter-region", "filter-province");
  updateProvinceDropdown("q-region", "q-province");
}
function updateProvinceDropdown(rId, pId) {
  const regEl = document.getElementById(rId);
  const pSel = document.getElementById(pId);
  if (!regEl || !pSel) return;
  const reg = regEl.value;
  pSel.innerHTML = "";
  if (rId === "filter-region") pSel.add(new Option("ทุกจังหวัด", "ALL"));
  (reg === "ALL" ? Object.values(THAI_REGIONS).flat() : THAI_REGIONS[reg] || []).forEach(p => pSel.add(new Option(p, p)));
}
function handleCreateQuest(e) {
  e.preventDefault();
  const user = getCurrentUser();
  const gradeInfo = getGradeInfo(user);
  const reward = parseInt(document.getElementById("q-reward").value, 10);
  if (!user.isAdmin && (user.dailyUsed + reward > gradeInfo.quota)) { alert("เกินโควตาประจำวัน!"); return; }
  const newQ = {
    id: "Q" + Date.now(),
    title: document.getElementById("q-title").value.trim(),
    tag: document.getElementById("q-tag").value,
    reward, region: document.getElementById("q-region").value,
    province: document.getElementById("q-province").value,
    desc: document.getElementById("q-desc").value.trim(),
    creator: user.username, completedBy: null
  };
  const qs = getQuests();
  qs.unshift(newQ);
  saveQuests(qs);
  if (!user.isAdmin) {
    const users = getUsers();
    users.find(u => u.username === user.username).dailyUsed += reward;
    saveUsers(users);
  }
  e.target.reset();
  alert("ประกาศเควสสำเร็จ!");
  switchPage("quests");
}
function renderQuests() {
  const regF = document.getElementById("filter-region")?.value || "ALL";
  const provF = document.getElementById("filter-province")?.value || "ALL";
  const tagF = document.getElementById("filter-tag")?.value || "ALL";
  const filtered = getQuests().filter(q => (regF === "ALL" || q.region === regF) && (provF === "ALL" || q.province === provF) && (tagF === "ALL" || q.tag === tagF));
  const container = document.getElementById("quest-list");
  if (!container) return;
  if (filtered.length === 0) { container.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500">ไม่พบเควส</div>`; return; }
  container.innerHTML = filtered.map(q => `
    <div class="vg-card rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-2"><span class="px-2 py-0.5 rounded text-xs bg-sky-500/20 text-sky-300">${q.tag}</span><span class="font-cyber text-sm font-bold text-amber-400">+${q.reward} PT</span></div>
        <h3 class="text-base font-bold text-white mb-2">${q.title}</h3>
        <p class="text-xs text-slate-300 mb-4">${q.desc}</p>
      </div>
      <div class="border-t border-slate-800 pt-3 text-xs">
        <div class="flex justify-between text-slate-400 mb-2"><span>${q.province}</span><span>โดย ${q.creator}</span></div>
        ${q.completedBy ? `<div class="text-center py-1 rounded bg-slate-800 text-emerald-400">สำเร็จแล้วโดย ${q.completedBy}</div>` : `<button onclick="completeQuest('${q.id}')" class="w-full py-2 rounded bg-amber-500 text-slate-950 font-bold">รับเควส (+${q.reward} PT)</button>`}
      </div>
    </div>
  `).join("");
}
function completeQuest(id) {
  const user = getCurrentUser();
  const qs = getQuests();
  const idx = qs.findIndex(q => q.id === id);
  qs[idx].completedBy = user.username;
  saveQuests(qs);
  const users = getUsers();
  users.find(u => u.username === user.username).points += qs[idx].reward;
  saveUsers(users);
  refreshAllUI();
}

// Ranking
function renderRanking() {
  const monthLbl = document.getElementById("ranking-month-label");
  if (monthLbl) {
    const now = new Date();
    monthLbl.textContent = `เดือน${THAI_MONTHS[now.getMonth()]} ${now.getFullYear() + 543}`;
  }
  const regular = getUsers().filter(u => !u.isAdmin).sort((a, b) => b.points - a.points);
  const tbody = document.getElementById("ranking-tbody");
  if (tbody) {
    tbody.innerHTML = regular.map((u, i) => `
      <tr><td class="py-3 px-4 font-bold text-amber-400">#${i + 1}</td><td class="py-3 px-4 font-semibold">${u.username}</td><td class="py-3 px-4">${getGradeInfo(u).grade}</td><td class="py-3 px-4 text-right text-emerald-400 font-bold">${u.points.toLocaleString()} PT</td></tr>
    `).join("");
  }
  const adminBox = document.getElementById("admin-list-box");
  if (adminBox) {
    adminBox.innerHTML = getUsers().filter(u => u.isAdmin).map(a => `<span class="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500 text-xs text-rose-200">🛡️ ${a.username}</span>`).join("");
  }
}

initStorage();
if (typeof lucide !== 'undefined') lucide.createIcons();
if (getCurrentUser()) enterApp();
