function renderAdminPanel() {
  const usersTbody = document.getElementById("admin-users-tbody");
  if (usersTbody) {
    usersTbody.innerHTML = getUsers().map(u => `
      <tr><td class="py-2 px-3">${u.username}</td><td class="py-2 px-3">${u.email}</td><td class="py-2 px-3">${getGradeInfo(u).grade}</td><td class="py-2 px-3">${u.points}</td><td class="py-2 px-3"><button onclick="adminToggleRole('${u.username}')" class="px-2 py-1 bg-amber-600 text-white rounded text-xs">สลับ Admin</button></td></tr>
    `).join("");
  }
  const questsList = document.getElementById("admin-quests-list");
  if (questsList) {
    questsList.innerHTML = getQuests().map(q => `
      <div class="flex justify-between p-2 bg-slate-900 rounded text-xs"><span>${q.title}</span><button onclick="adminDeleteQuest('${q.id}')" class="text-rose-400 font-bold">ลบ</button></div>
    `).join("");
  }
}

function adminToggleRole(uname) {
  if (uname === "admin") return;
  const users = getUsers();
  const u = users.find(x => x.username === uname);
  if (u) {
    u.isAdmin = !u.isAdmin;
    saveUsers(users);
    refreshAllUI();
  }
}

function adminDeleteQuest(id) {
  saveQuests(getQuests().filter(q => q.id !== id));
  refreshAllUI();
}

function adminResetRanking() {
  if (!confirm("รีเซ็ตคะแนนทั้งหมด?")) return;
  saveUsers(getUsers().map(u => u.isAdmin ? u : { ...u, points: 0 }));
  refreshAllUI();
}

