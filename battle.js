let activeRoomId = null;
let html5QrScanner = null;

function createBattleRoom() {
  const user = getCurrentUser();
  if (!user) return;
  const code = "VG-" + Math.floor(100000 + Math.random() * 900000);
  localStorage.setItem("vg_room_" + code, JSON.stringify({ roomId: code, host: user.username, guest: null, hostVote: null, guestVote: null, status: "WAITING" }));
  activeRoomId = code;
  const box = document.getElementById("qr-display-box");
  const canvas = document.getElementById("qrcode-canvas");
  if (!box || !canvas) return;
  canvas.innerHTML = "";
  box.classList.remove("hidden"); box.classList.add("flex");
  new QRCode(canvas, { text: code, width: 160, height: 160 });
  document.getElementById("battle-room-code-text").textContent = `รหัสห้อง: ${code}`;
}

function startQrScanner() {
  html5QrScanner = new Html5Qrcode("qr-reader");
  html5QrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 200 }, (text) => {
    html5QrScanner.stop();
    const input = document.getElementById("manual-room-input");
    if (input) input.value = text;
    joinBattleByCode();
  }).catch(() => alert("ไม่สามารถเปิดกล้องได้"));
}

function joinBattleByCode() {
  const input = document.getElementById("manual-room-input");
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  const raw = localStorage.getItem("vg_room_" + code);
  if (!raw) { alert("ไม่พบห้อง!"); return; }
  const room = JSON.parse(raw);
  room.guest = getCurrentUser().username;
  room.status = "FIGHTING";
  localStorage.setItem("vg_room_" + code, JSON.stringify(room));
  activeRoomId = code;
  enterBattleScreen(room);
}

window.addEventListener("storage", (e) => {
  if (activeRoomId && e.key === "vg_room_" + activeRoomId && e.newValue) {
    const room = JSON.parse(e.newValue);
    if (room.status === "FIGHTING") enterBattleScreen(room);
    if (room.hostVote && room.guestVote) checkDualConfirmation(room);
  }
});

function enterBattleScreen(room) {
  const user = getCurrentUser();
  const lobby = document.getElementById("battle-lobby");
  const panel = document.getElementById("battle-active-panel");
  const label = document.getElementById("battle-opponent-label");
  if (lobby) lobby.classList.add("hidden");
  if (panel) panel.classList.remove("hidden");
  if (label) label.textContent = `คู่แข่ง: ${room.host === user.username ? room.guest : room.host}`;
}

function submitBattleResult(res) {
  if (!activeRoomId) return;
  const room = JSON.parse(localStorage.getItem("vg_room_" + activeRoomId));
  const user = getCurrentUser();
  if (room.host === user.username) room.hostVote = res; else room.guestVote = res;
  localStorage.setItem("vg_room_" + activeRoomId, JSON.stringify(room));
  const statusEl = document.getElementById("dual-confirm-status");
  if (statusEl) statusEl.textContent = "รอคู่แข่งกดยืนยัน...";
  if (room.hostVote && room.guestVote) checkDualConfirmation(room);
}

function checkDualConfirmation(room) {
  if (room.hostVote === room.guestVote) { alert("ผลขัดแย้ง! ยกเลิกแมตช์"); resetBattleUI(); return; }
  const winner = room.hostVote === "WIN" ? room.host : room.guest;
  const loser = room.hostVote === "LOSE" ? room.host : room.guest;
  const users = getUsers();
  const wUser = users.find(u => u.username === winner);
  const lUser = users.find(u => u.username === loser);
  if (wUser && lUser) {
    wUser.points += Math.round(wUser.points * 0.03);
    lUser.points = Math.max(0, lUser.points - Math.round(lUser.points * 0.025));
    saveUsers(users);
  }
  localStorage.removeItem("vg_room_" + room.roomId);
  alert(`ยืนยันผลสำเร็จ! ผู้ชนะ: ${winner}`);
  resetBattleUI();
  refreshAllUI();
}

function resetBattleUI() {
  activeRoomId = null;
  const lobby = document.getElementById("battle-lobby");
  const panel = document.getElementById("battle-active-panel");
  if (lobby) lobby.classList.remove("hidden");
  if (panel) panel.classList.add("hidden");
}
