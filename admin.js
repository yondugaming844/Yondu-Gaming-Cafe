/* YONDU ADMIN PANEL */
var curR = "", bk = null;
var ALL_PERMS = ["floor","pay","requests","customers","menu","reports","settings"];
var PERM_LABELS = { floor: "Live Floor", pay: "Payments", requests: "Requests", customers: "Customers", menu: "Menu", reports: "Reports", settings: "Settings" };
var PWD_MAX_AGE = 90;
var PWD_HISTORY = 5;

function adminSession() { return DB.get("yondu_admin_session", null); }
function getMe() { var u = adminSession(); if (!u) return null; return ADMINS.find(function(x) { return x.username === u; }) || null; }
function isAdmin() { return !!getMe(); }
function can(p) { var m = getMe(); if (!m) return false; if (m.role === "owner") return true; return (m.perms || []).indexOf(p) >= 0; }
function isOwner() { var m = getMe(); return m && m.role === "owner"; }
function ageDays(a) { var c = a.password_changed_at || a.createdAt || 0; if (!c) return 0; return Math.floor((Date.now() - c) / 86400000); }
function isExpired(a) { return ageDays(a) >= PWD_MAX_AGE; }
function checkPwdHistory(newHash, historyJson) { var h = []; try { h = JSON.parse(historyJson || "[]"); } catch(e) {} return h.indexOf(newHash) >= 0; }
function pushPwdHistory(currentHash, historyJson) { var h = []; try { h = JSON.parse(historyJson || "[]"); } catch(e) {} h.unshift(currentHash); h = h.slice(0, PWD_HISTORY); return JSON.stringify(h); }

function toast(msg, type) {
  var colors = { success: "#4ade80", error: "#f87171", info: "#22d3ee", warn: "#fb923c" };
  var el = document.createElement("div");
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);background:" + (colors[type] || colors.info) + ";color:#1a1408;padding:14px 22px;border-radius:12px;font-weight:700;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,.6);font-size:14px;max-width:90%;text-align:center;transition:transform .3s";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(0)"; }, 20);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(-100px)"; }, 2400);
  setTimeout(function() { el.remove(); }, 2800);
}

function sheet(opts) {
  var m = document.createElement("div");
  m.className = "modal";
  var html = "";
  (opts.fields || []).forEach(function(f) {
    if (f.type === "info") html += '<div class="notice gold" style="margin-bottom:14px">' + f.value + '</div>';
    else if (f.type === "notice") html += '<div class="notice ' + (f.color || "") + '" style="margin-bottom:14px">' + f.value + '</div>';
    else if (f.type === "select") {
      html += '<label>' + f.label + '</label><select id="' + f.id + '">';
      f.options.forEach(function(o) { html += '<option value="' + o.value + '"' + (o.value === f.value ? " selected" : "") + '>' + o.label + '</option>'; });
      html += '</select>';
    } else {
      html += '<label>' + f.label + '</label><input id="' + f.id + '" type="' + (f.type || "text") + '" value="' + (f.value || "") + '" placeholder="' + (f.placeholder || "") + '">';
    }
  });
  m.innerHTML = '<div class="sheet"><h2>' + opts.title + '</h2>' + (opts.subtitle ? '<div class="s">' + opts.subtitle + '</div>' : "") + html + '<button class="btn" id="sheet-ok" style="margin-top:10px">' + (opts.confirmText || "Save") + '</button><button class="btn dark" id="sheet-cancel" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  document.getElementById("sheet-ok").onclick = function() {
    var vals = {};
    m.querySelectorAll("input,select,textarea").forEach(function(el) { if (el.id) vals[el.id] = el.value; });
    m.remove();
    if (opts.onConfirm) opts.onConfirm(vals);
  };
  document.getElementById("sheet-cancel").onclick = function() { m.remove(); };
}

function confirmBox(opts) {
  var m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = '<div class="sheet"><h2>' + opts.title + '</h2>' + (opts.message ? '<div class="s">' + opts.message + '</div>' : "") + '<button class="btn danger" id="ok" style="margin-top:10px">' + (opts.yesText || "Yes") + '</button><button class="btn dark" id="no" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  document.getElementById("ok").onclick = function() { m.remove(); if (opts.onYes) opts.onYes(); };
  document.getElementById("no").onclick = function() { m.remove(); };
}

function notifyAdmin(msg) {
  var el = document.createElement("div");
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);background:linear-gradient(180deg,#f5e2a8,#e8cf8b,#c9a961);color:#1a1408;padding:16px 26px;border-radius:14px;font-weight:700;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,.7);font-size:14px;max-width:90%;text-align:center;transition:transform .4s";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(0)"; }, 20);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(-100px)"; }, 4200);
  setTimeout(function() { el.remove(); }, 4700);
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach(function(freq, i) {
      var osc = ctx.createOscillator(); var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine";
      var t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.4);
    });
  } catch(e) {}
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification("Yondu Admin", { body: msg }); } catch(e) {}
  }
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

var R = {};
function go(r, p) { curR = r; window.scrollTo(0, 0); render(r, p || {}); }
window.go = go;

function render(r, p) {
  if (!isAdmin() && r !== "login" && r !== "claim_owner") { r = "login"; p = {}; }
  if (!ADMINS.length && r !== "claim_owner") { r = "claim_owner"; p = {}; }
  curR = r;
  var app = document.getElementById("app");
  if (!app) return;
  var fn = R[r] || R.floor;
  app.innerHTML = fn(p);
  renderNav(r);
  if (R[r] && R[r].after) R[r].after(p);
}

function renderNav(r) {
  var nav = document.getElementById("nav");
  if (!isAdmin() || r === "login" || r === "claim_owner") { nav.style.display = "none"; return; }
  nav.style.display = "flex";
  var pc = CUST.filter(function(c) { return !c.activated; }).length;
  var pr = REQ.filter(function(x) { return x.status === "pending"; }).length;
  var pay = SESS.filter(function(s) { return !s.paid && s.status !== "ended"; }).length;
  var h = "";
  if (can("floor")) h += '<a href="javascript:go(\'floor\')" class="' + (r === "floor" ? "on" : "") + '"><span class="ic">🏠</span>Floor</a>';
  if (can("pay")) h += '<a href="javascript:go(\'payments\')" class="' + (r === "payments" ? "on" : "") + '"><span class="ic">💳</span>Pay' + (pay ? '<span class="dot"></span>' : "") + '</a>';
  if (can("requests")) h += '<a href="javascript:go(\'requests\')" class="' + (r === "requests" ? "on" : "") + '"><span class="ic">🔔</span>Reqs' + ((pr + pc) ? '<span class="dot"></span>' : "") + '</a>';
  if (can("customers")) h += '<a href="javascript:go(\'customers\')" class="' + (r === "customers" ? "on" : "") + '"><span class="ic">👥</span>People</a>';
  h += '<a href="javascript:go(\'more\')" class="' + (r === "more" || r === "me" ? "on" : "") + '"><span class="ic">⚙️</span>More</a>';
  nav.innerHTML = h;
}

/* SETUP */
R.claim_owner = function() {
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto"><div class="hero-badge">Setup</div><h1 style="text-align:left">Claim Owner</h1><p class="sub">First-time setup. You become Owner.</p><label>Username</label><input id="oau" placeholder="owner" style="text-transform:lowercase"><label>Password (6+ chars)</label><input id="oap" type="password"><label>Confirm Password</label><input id="oap2" type="password"><button class="btn" style="margin-top:8px" onclick="doClaim()">Create Owner</button><button class="btn dark" style="margin-top:8px" onclick="location.href=\'index.html\'">← Back</button></div></div>';
};
window.doClaim = function() {
  var u = document.getElementById("oau").value.trim().toLowerCase();
  var p = document.getElementById("oap").value;
  var p2 = document.getElementById("oap2").value;
  if (!u || u.length < 3) return toast("Username 3+", "error");
  if (!/^[a-z0-9_]+$/.test(u)) return toast("Letters/numbers/underscore only", "error");
  if (!p || p.length < 6) return toast("Password 6+", "error");
  if (p !== p2) return toast("Passwords don't match", "error");
  loadAll().then(function() {
    if (ADMINS.length) return toast("Owner exists", "error");
    var a = { username: u, passHash: hashPin(p), role: "owner", perms: ALL_PERMS.slice(), createdAt: Date.now(), password_changed_at: Date.now(), password_history: "[]" };
    ADMINS = [a];
    saveAdmins(ADMINS).then(function() { DB.set("yondu_admin_session", u); toast("Owner created", "success"); go("floor"); });
  });
};

R.login = function() {
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto"><div class="hero-badge">Admin</div><h1 style="text-align:left">Welcome Back</h1><p class="sub">Yondu Gaming Café</p><label>Username</label><input id="au" placeholder="username" style="text-transform:lowercase"><label>Password</label><input id="ap" type="password" placeholder="••••••"><button class="btn" style="margin-top:8px" onclick="doLogin()">Sign In</button><button class="btn dark" style="margin-top:8px" onclick="location.href=\'index.html\'">← Back</button></div></div>';
};
window.doLogin = function() {
  var u = document.getElementById("au").value.trim().toLowerCase();
  var p = document.getElementById("ap").value;
  if (!u || !p) return toast("Enter credentials", "error");
  loadAll().then(function() {
    if (!ADMINS.length) { go("claim_owner"); return; }
    var a = ADMINS.find(function(x) { return x.username.toLowerCase() === u; });
    if (!a || hashPin(p) !== a.passHash) return toast("Wrong credentials", "error");
    DB.set("yondu_admin_session", a.username);
    if (isExpired(a)) { openPwdReset(a, true); return; }
    go("floor");
  });
};
window.doLogout = function() { confirmBox({ title: "Sign Out?", yesText: "Sign Out", onYes: function() { DB.del("yondu_admin_session"); go("login"); } }); };

/* PASSWORD RESET */
function openPwdReset(admin, isExpired) {
  var m = document.createElement("div");
  m.id = "pwdResetModal"; m.className = "modal";
  m.innerHTML = '<div class="sheet"><h2>' + (isExpired ? "Password Expired" : "Reset Password") + '</h2><div class="s">' + (isExpired ? "Set a new one to continue" : "New password for " + esc(admin.username)) + '</div><label>New password (6+)</label><input id="fp_new" type="password"><label>Confirm</label><input id="fp_conf" type="password"><div class="notice gold" style="margin-top:10px">Cannot reuse last ' + PWD_HISTORY + ' passwords</div><button class="btn" id="fp_save" style="margin-top:10px">Save</button>' + (isExpired ? '' : '<button class="btn dark" id="fp_cancel" style="margin-top:8px">Cancel</button>') + '</div>';
  document.body.appendChild(m);
  document.getElementById("fp_save").onclick = function() {
    var np = document.getElementById("fp_new").value;
    var cf = document.getElementById("fp_conf").value;
    if (np.length < 6) return toast("6+ chars", "error");
    if (np !== cf) return toast("Don't match", "error");
    var newHash = hashPin(np);
    if (newHash === admin.passHash) return toast("Can't reuse", "error");
    if (checkPwdHistory(newHash, admin.password_history)) return toast("Recently used", "error");
    var oldHistory = pushPwdHistory(admin.passHash, admin.password_history);
    var updated = Object.assign({}, admin, { passHash: newHash, password_history: oldHistory, password_changed_at: Date.now() });
    sb.from("admins").upsert(denormA(updated)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADMINS = ADMINS.map(function(x) { return x.username === admin.username ? updated : x; });
      m.remove(); toast("Updated", "success");
      if (isExpired) { go("floor"); } else { render(curR, {}); }
    });
  };
  var cx = document.getElementById("fp_cancel");
  if (cx) cx.onclick = function() { m.remove(); };
}

/* FLOOR */
R.floor = function() {
  if (!can("floor")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var now = Date.now();
  var playing = SESS.filter(function(s) { return s.status === "playing"; });
  var pend = CUST.filter(function(c) { return !c.activated; }).length;
  var pendReq = REQ.filter(function(r) { return r.status === "pending"; });
  var col = SESS.filter(function(s) { return !s.paid && s.status !== "ended"; }).length;
  var today = new Date().setHours(0, 0, 0, 0);
  var tSess = SESS.filter(function(s) { return s.createdAt >= today; });
  var tRev = tSess.reduce(function(t, s) { return t + (s.paid ? s.total : 0); }, 0);
  var busy = {};
  playing.forEach(function(s) { if (s.stationId) busy[s.stationId] = s; });

  var liveStrip = "";
  if (pendReq.length) {
    liveStrip = '<div class="card" style="border-color:rgba(251,146,60,.5);background:linear-gradient(180deg,rgba(251,146,60,.08),var(--card))"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><div style="width:8px;height:8px;border-radius:50%;background:var(--orange);box-shadow:0 0 12px var(--orange);animation:pulse 1.5s infinite"></div><div style="font-weight:700;color:var(--orange);font-size:13px">' + pendReq.length + ' INCOMING ORDER' + (pendReq.length > 1 ? "S" : "") + '</div></div>' + pendReq.slice(0, 3).map(function(r) {
      return '<div style="padding:10px 0;border-top:1px solid var(--line)"><div style="font-weight:600">' + (r.customerName || "?") + ' · ₹' + r.total + '</div><div style="color:var(--txt3);font-size:12px;margin-top:2px">' + (r.items || []).join(", ") + '</div></div>';
    }).join("") + '<button class="btn orange" style="margin-top:12px;width:100%" onclick="go(\'requests\')">View All →</button></div>';
  }

  var stations = STA.map(function(st) {
    var s = busy[st.id];
    if (s) {
      var l = s.end ? (s.end - now) : 0;
      var m = Math.max(0, Math.floor(l / 60000));
      var sec = Math.max(0, Math.floor((l % 60000) / 1000));
      var cls = s.isMembership ? "" : (l < 5 * 60000 ? "over" : l < 15 * 60000 ? "warn" : "");
      var elapsed = s.isMembership && s.start ? Date.now() - s.start : 0;
      var display = s.isMembership ? String(Math.floor(elapsed / 60000)).padStart(2, "0") + ":" + String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0") : String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
      return '<div class="station playing" onclick="go(\'station\',{id:\'' + st.id + '\'})"><div class="st-h"><div class="st-nm">' + st.name + '</div><span class="pill busy">' + (s.isMembership ? "MEMBERSHIP" : "PLAYING") + '</span></div><div class="status">' + s.name + '</div><div class="time ' + cls + '" data-s="' + s.id + '">' + display + '</div></div>';
    }
    return '<div class="station free" onclick="startAt(\'' + st.id + '\')"><div class="st-h"><div class="st-nm">' + st.name + '</div><span class="pill free">FREE</span></div><div class="status">Ready to start</div></div>';
  }).join("");

  return '<div class="screen"><div class="wrap">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px"><div><h1 style="margin:0;font-size:28px">Live Floor</h1><p class="sub" style="margin:6px 0 0">' + playing.length + ' playing · ' + tSess.length + ' today</p></div><button class="btn sm" onclick="go(\'newsale\')">+ Sale</button></div>' +
    liveStrip +
    '<div class="grid4" style="margin-bottom:16px"><div class="stat"><div class="v">₹' + tRev + '</div><div class="l">Today</div></div><div class="stat"><div class="v" style="color:var(--cyan)">' + playing.length + '</div><div class="l">Playing</div></div><div class="stat"><div class="v" style="color:var(--pink)">' + col + '</div><div class="l">Collect</div></div><div class="stat"><div class="v" style="color:var(--green)">' + pend + '</div><div class="l">Pending</div></div></div>' +
    '<div class="sec-label">Stations</div>' + stations + '</div></div>';
};
R.floor.after = function() {
  setInterval(function() {
    if (curR !== "floor") return;
    var now = Date.now();
    document.querySelectorAll("[data-s]").forEach(function(el) {
      var s = getSess(el.dataset.s);
      if (!s || !s.end) return;
      var l = s.end - now;
      if (l <= 0) { el.textContent = "00:00"; el.className = "time over"; return; }
      el.textContent = String(Math.floor(l / 60000)).padStart(2, "0") + ":" + String(Math.floor((l % 60000) / 1000)).padStart(2, "0");
      el.className = "time" + (l < 5 * 60000 ? " over" : l < 15 * 60000 ? " warn" : "");
    });
  }, 1000);
};

window.startAt = function(stId) {
  loadAll().then(function() {
    var all = SESS.filter(function(s) { return !s.stationId && s.status !== "ended" && s.status !== "cancelled"; });
    if (!all.length) return toast("No pending sessions", "error");
    var options = all.slice(0, 20).map(function(s) { return { value: s.id, label: s.id + " · " + s.name + (s.paid ? " (PAID)" : " (unpaid)") }; });
    var st = STA.find(function(x) { return x.id === stId; });
    sheet({ title: "Start Session", subtitle: "Station: " + (st ? st.name : ""), fields: [{ id: "sid", label: "Pick booking", type: "select", options: options, value: options[0].value }], confirmText: "Start Now", onConfirm: function(v) {
      var s = all.find(function(x) { return x.id === v.sid; });
      if (!s) return;
      s.paid = true; s.status = "playing"; s.stationId = stId; s.start = Date.now(); s.end = Date.now() + (s.minutes || 60) * 60000;
      sb.from("sessions").upsert(denormS(s)).then(function() { toast("Started at " + st.name, "success"); go("station", { id: stId }); });
    } });
  });
};

R.station = function(p) {
  var st = STA.find(function(x) { return x.id === p.id; });
  var s = SESS.find(function(x) { return x.stationId === p.id && x.status === "playing"; });
  if (!st) return '<div class="screen"><div class="wrap"><h2>Not found</h2></div></div>';
  if (!s) return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--txt3)">← Floor</a><h1 style="margin-top:20px">' + st.name + '</h1><div class="notice">Free</div></div></div>';
  var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--txt3)">← Floor</a><h1 style="margin-top:20px">' + st.name + '</h1><p class="sub">' + s.name + (c ? " · " + c.id : "") + '</p><div class="id-card"><div class="label">' + (s.isMembership ? "MEMBERSHIP TIME" : "TIME REMAINING") + '</div><div class="idnum" style="font-size:52px" id="ast">--:--</div></div><div class="card" style="margin-top:14px">' + (s.items || []).map(function(i) { return '<div style="padding:6px 0;font-size:14px;border-bottom:1px solid var(--line)">' + i + '</div>'; }).join("") + '<div style="padding:14px 0 0;display:flex;justify-content:space-between;font-weight:700"><span>Total</span><span style="color:var(--gold)">₹' + s.total + '</span></div></div><button class="btn dark" style="margin-top:12px" onclick="aAdd(\'' + s.id + '\')">Add Snacks</button><button class="btn dark" style="margin-top:8px" onclick="aExt(\'' + s.id + '\')">Add Time</button><button class="btn orange" style="margin-top:8px" onclick="aEnd(\'' + s.id + '\')">End Session</button></div></div>';
};
R.station.after = function(p) {
  var s = SESS.find(function(x) { return x.stationId === p.id && x.status === "playing"; });
  if (!s) return;
  var el = document.getElementById("ast");
  if (!el) return;
  var tick = function() {
    if (s.isMembership) { var p2 = Date.now() - s.start; el.textContent = String(Math.floor(p2 / 60000)).padStart(2, "0") + ":" + String(Math.floor((p2 % 60000) / 1000)).padStart(2, "0"); return; }
    if (!s.end) return;
    var l = s.end - Date.now();
    if (l <= 0) { el.textContent = "00:00"; el.style.color = "var(--red)"; return; }
    el.textContent = String(Math.floor(l / 60000)).padStart(2, "0") + ":" + String(Math.floor((l % 60000) / 1000)).padStart(2, "0");
    el.style.color = l < 5 * 60000 ? "var(--red)" : l < 15 * 60000 ? "#f59e0b" : "var(--gold)";
  };
  tick(); setInterval(tick, 1000);
};

window.aAdd = function(sid) {
  var opts = ADD.map(function(a) { return { value: a.id, label: a.name + " — ₹" + a.price }; });
  opts.push({ value: "__c", label: "+ Custom item" });
  sheet({ title: "Add Snacks", fields: [{ id: "pick", label: "Item", type: "select", options: opts, value: opts[0].value }, { id: "cn", label: "Custom name", type: "text" }, { id: "cp", label: "Custom ₹", type: "number" }, { id: "q", label: "Qty", type: "number", value: "1" }], confirmText: "Add", onConfirm: function(v) {
    var q = Math.max(1, parseInt(v.q) || 1);
    var name, price;
    if (v.pick === "__c") { name = (v.cn || "").trim(); price = parseInt(v.cp) || 0; if (!name || !price) return toast("Enter name & price", "error"); }
    else { var a = ADD.find(function(x) { return x.id === v.pick; }); if (!a) return; name = a.name; price = a.price; }
    var s = getSess(sid); if (!s) return;
    for (var i = 0; i < q; i++) s.items.push(name);
    s.total += price * q;
    sb.from("sessions").upsert(denormS(s)).then(function() { toast("Added " + q + "x " + name, "success"); render("station", { id: s.stationId }); });
  } });
};

window.aExt = function(sid) {
  sheet({ title: "Add Time", fields: [{ id: "m", label: "Minutes", type: "number", value: "30" }, { id: "r", label: "Rate ₹", type: "number", value: "100" }], confirmText: "Add", onConfirm: function(v) {
    var add = parseInt(v.m) || 0; if (!add) return;
    var amt = parseInt(v.r) || 0;
    var s = getSess(sid); if (!s) return;
    s.end = Math.max(Date.now(), s.end || Date.now()) + add * 60000;
    s.minutes = (s.minutes || 0) + add; s.total += amt;
    sb.from("sessions").upsert(denormS(s)).then(function() { toast("+" + add + "min", "success"); render("station", { id: s.stationId }); });
  } });
};

window.aEnd = function(sid) {
  var s = getSess(sid); if (!s) return;
  confirmBox({ title: "End Session?", message: "Total: ₹" + s.total, yesText: "End", onYes: function() {
    s.status = "ended";
    sb.from("sessions").upsert(denormS(s)).then(function() { toast("Ended", "success"); go("floor"); });
  } });
};

/* PAYMENTS */
R.payments = function() {
  if (!can("pay")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var all = SESS.filter(function(s) { return !s.paid && s.status !== "ended" && s.status !== "cancelled"; });
  var cards = all.length ? all.map(function(s) {
    var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
    return '<div class="card"><div style="font-weight:700;font-size:16px">' + s.name + '</div>' + (c ? '<div style="color:var(--gold);font-size:12px;font-weight:600;margin-top:4px">' + c.id + '</div>' : "") + '<div style="color:var(--txt3);font-size:13px;margin:8px 0">' + s.items.join(" · ") + '</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><div style="font-size:26px;font-weight:700;color:var(--gold)">₹' + s.total + '</div><button class="btn sm" onclick="collect(\'' + s.id + '\')">Collect</button></div></div>';
  }).join("") : '<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:28px">Payments</h1><p class="sub">Cash, UPI, or Points</p>' + cards + '</div></div>';
};

window.collect = function(sid) {
  var s = getSess(sid); if (!s) return;
  var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
  var pointsEarned = c ? Math.floor(s.total / RR) : 0;
  var canUsePoints = c && c.points >= s.total;
  var methodOptions = [
    { value: "cash", label: "Cash — ₹" + s.total },
    { value: "upi", label: "UPI — ₹" + s.total }
  ];
  if (c) methodOptions.push({ value: "points", label: "Points — " + s.total + " pts" + (canUsePoints ? " (has " + c.points + ")" : " (needs " + s.total + ")") });
  sheet({
    title: "Collect ₹" + s.total,
    subtitle: s.name,
    fields: [
      { type: "info", value: "Customer: <b>" + s.name + "</b>" + (c ? "<br>Current points: <b>" + c.points + "</b><br>Earn if Cash/UPI: <b>+" + pointsEarned + "</b>" : "") },
      { id: "m", label: "Payment method", type: "select", options: methodOptions, value: "cash" }
    ],
    confirmText: "Confirm Payment",
    onConfirm: function(v) {
      var m = v.m || "cash";
      var tasks = [];
      if (m === "points") {
        if (!c) return toast("No customer linked", "error");
        if (c.points < s.total) return toast("Not enough points", "error");
        c.points = c.points - s.total;
        c.visits = (c.visits || 0) + 1;
        c.lastActivity = Date.now();
        s.paid = true; s.method = "points"; s.pointsEarned = 0;
        tasks.push(sb.from("customers").upsert(denormC(c)));
        tasks.push(sb.from("sessions").upsert(denormS(s)));
        Promise.all(tasks).then(function() { toast("Paid with " + s.total + " pts", "success"); render("payments", {}); });
      } else {
        s.paid = true; s.method = m;
        if (c) {
          c.points = (c.points || 0) + pointsEarned;
          c.totalSpent = (c.totalSpent || 0) + s.total;
          c.visits = (c.visits || 0) + 1;
          c.lastActivity = Date.now();
          s.pointsEarned = pointsEarned;
          tasks.push(sb.from("customers").upsert(denormC(c)));
        }
        tasks.push(sb.from("sessions").upsert(denormS(s)));
        Promise.all(tasks).then(function() { toast("Collected ₹" + s.total + " · +" + pointsEarned + " pts", "success"); render("payments", {}); });
      }
    }
  });
};

/* REQUESTS */
R.requests = function() {
  if (!can("requests")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var pr = REQ.filter(function(r) { return r.status === "pending"; });
  var pa = CUST.filter(function(c) { return !c.activated; });
  var aHTML = pa.length ? '<div class="sec-label">Signups (' + pa.length + ')</div>' + pa.map(function(c) {
    return '<div class="card" style="border-color:rgba(251,146,60,.4)"><div style="display:flex;gap:12px;align-items:center;margin-bottom:14px"><div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div><div style="flex:1"><div style="font-weight:700">' + c.name + '</div><div style="color:var(--gold);font-size:14px;font-weight:700;letter-spacing:.1em">' + c.id + '</div></div></div><button class="btn green" onclick="activateCust(\'' + c.id + '\')">Activate</button></div>';
  }).join("") : "";
  var rHTML = pr.length ? '<div class="sec-label">Requests (' + pr.length + ')</div>' + pr.map(function(r) {
    return '<div class="card" style="border-color:rgba(244,114,182,.4)"><div style="font-weight:700;font-size:16px">' + r.customerName + '</div><div style="color:var(--txt3);font-size:13px;margin:10px 0">' + (r.items || []).join(" · ") + '</div><div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid var(--line)"><div style="font-size:22px;font-weight:700;color:var(--gold)">₹' + r.total + '</div><div style="display:flex;gap:8px"><button class="btn danger xs" onclick="rejectReq(\'' + r.id + '\')">Reject</button><button class="btn sm" onclick="approveReq(\'' + r.id + '\')">Approve</button></div></div></div>';
  }).join("") : "";
  return '<div class="screen"><div class="wrap"><h1 style="font-size:28px">Requests</h1>' + ((!pr.length && !pa.length) ? '<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>' : "") + aHTML + rHTML + '</div></div>';
};
window.activateCust = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  var np = (c.points || 0) + 50; var nc = (c.credit || 0) + 30;
  sb.from("customers").update({ activated: true, points: np, credit: nc }).eq("id", cid).select().then(function(res) {
    if (res.error) return toast(res.error.message, "error");
    c.activated = true; c.points = np; c.credit = nc;
    toast(c.name + " activated", "success"); render(curR, {});
  });
};
window.approveReq = function(rid) {
  var r = REQ.find(function(x) { return x.id === rid; }); if (!r) return;
  sb.from("requests").update({ status: "approved", processed_at: Date.now() }).eq("id", rid).select().then(function(res) {
    if (res.error) return toast(res.error.message, "error");
    r.status = "approved"; toast("Approved", "success"); render("requests", {});
  });
};
window.rejectReq = function(rid) {
  confirmBox({ title: "Reject?", yesText: "Reject", onYes: function() {
    sb.from("requests").update({ status: "rejected", processed_at: Date.now() }).eq("id", rid).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      var r = REQ.find(function(x) { return x.id === rid; }); if (r) r.status = "rejected";
      toast("Rejected", "success"); render("requests", {});
    });
  } });
};

/* CUSTOMERS */
R.customers = function() {
  if (!can("customers")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var cs = CUST.slice().sort(function(a, b) { return b.totalSpent - a.totalSpent; });
  var list = cs.length ? cs.map(function(c) {
    var badge = !c.activated ? '<span class="badge pending">Pending</span>' : c.banned ? '<span class="badge banned">Banned</span>' : c.vip ? '<span class="badge vip">VIP</span>' : '<span class="badge open">Active</span>';
    return '<div class="card"><div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">' + (c.profilePic ? '<div class="avatar" style="background-image:url(\'' + c.profilePic + '\')"></div>' : '<div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div>') + '<div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700;font-size:16px">' + c.name + '</div>' + badge + '</div><div style="color:var(--gold);font-size:13px;font-weight:700;letter-spacing:.1em;margin-top:2px">' + c.id + '</div></div></div><div class="grid4" style="gap:8px;margin-bottom:14px"><div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:9px;color:var(--txt3);font-weight:700;letter-spacing:.1em">POINTS</div><div style="font-weight:700;color:var(--gold);font-size:16px;margin-top:4px">' + c.points + '</div></div><div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:9px;color:var(--txt3);font-weight:700;letter-spacing:.1em">SPENT</div><div style="font-weight:700;font-size:16px;margin-top:4px">₹' + c.totalSpent + '</div></div><div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:9px;color:var(--txt3);font-weight:700;letter-spacing:.1em">VISITS</div><div style="font-weight:700;font-size:16px;margin-top:4px">' + c.visits + '</div></div><div style="background:var(--bg2);border-radius:8px;padding:10px;text-align:center"><div style="font-size:9px;color:var(--txt3);font-weight:700;letter-spacing:.1em">HOURS</div><div style="font-weight:700;color:var(--cyan);font-size:16px;margin-top:4px">' + (c.ps5Hours || 0) + '·' + (c.raceHours || 0) + '</div></div></div><div style="display:flex;gap:8px;flex-wrap:wrap">' + (!c.activated ? '<button class="btn green xs" onclick="activateCust(\'' + c.id + '\')">Activate</button>' : "") + '<button class="btn dark xs" onclick="editPts(\'' + c.id + '\')">Points</button><button class="btn dark xs" onclick="resetPin(\'' + c.id + '\')">Reset PIN</button><button class="btn dark xs" onclick="togVIP(\'' + c.id + '\')">' + (c.vip ? "Remove VIP" : "VIP") + '</button><button class="btn ' + (c.banned ? "dark" : "danger") + ' xs" onclick="togBan(\'' + c.id + '\')">' + (c.banned ? "Unban" : "Ban") + '</button></div></div>';
  }).join("") : '<div class="empty"><div class="msg">NO CUSTOMERS</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:28px">Customers</h1><p class="sub">' + cs.length + ' total</p>' + list + '</div></div>';
};
window.editPts = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  sheet({ title: "Edit Points", subtitle: c.name, fields: [{ id: "p", label: "Points", type: "number", value: String(c.points || 0) }], confirmText: "Save", onConfirm: function(v) {
    var n = parseInt(v.p) || 0;
    sb.from("customers").update({ points: n }).eq("id", cid).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      c.points = n; toast("Updated", "success"); render("customers", {});
    });
  } });
};
window.resetPin = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  var p = String(Math.floor(1000 + Math.random() * 9000));
  sheet({ title: "Reset PIN", subtitle: c.name, fields: [{ type: "info", value: "New PIN: <b style='font-size:28px;color:var(--gold);letter-spacing:.3em'>" + p + "</b>" }], confirmText: "Confirm Reset", onConfirm: function() {
    sb.from("customers").update({ pin_hash: hashPin(p) }).eq("id", cid).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      c.pinHash = hashPin(p); toast("New PIN: " + p, "success"); render("customers", {});
    });
  } });
};
window.togVIP = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  var nv = !c.vip;
  sb.from("customers").update({ vip: nv }).eq("id", cid).then(function(res) {
    if (res.error) return toast(res.error.message, "error");
    c.vip = nv; render("customers", {});
  });
};
window.togBan = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  confirmBox({ title: (c.banned ? "Unban" : "Ban") + " " + c.name + "?", yesText: c.banned ? "Unban" : "Ban", onYes: function() {
    var nb = !c.banned;
    sb.from("customers").update({ banned: nb }).eq("id", cid).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      c.banned = nb; render("customers", {});
    });
  } });
};

/* MORE */
R.more = function() {
  var me = getMe();
  var h = "";
  if (can("menu")) h += '<div class="card click" onclick="go(\'menu\')"><div style="font-weight:700;font-size:16px">Menu Manager</div><div class="sub" style="margin:6px 0 0;font-size:13px">' + ADD.length + ' items</div></div>';
  if (can("reports")) h += '<div class="card click" onclick="go(\'reports\')"><div style="font-weight:700;font-size:16px">Reports</div><div class="sub" style="margin:6px 0 0;font-size:13px">Revenue · payments · stats</div></div>';
  if (can("settings")) h += '<div class="card click" onclick="go(\'settings\')"><div style="font-weight:700;font-size:16px">Café Settings</div><div class="sub" style="margin:6px 0 0;font-size:13px">Phone · hours · loyalty</div></div>';
  if (isOwner()) h += '<div class="card click" onclick="go(\'admin_users\')" style="border-color:var(--gold3)"><div style="font-weight:700;font-size:16px">Staff Accounts</div><div class="sub" style="margin:6px 0 0;font-size:13px">' + ADMINS.length + ' account' + (ADMINS.length !== 1 ? "s" : "") + '</div></div>';
  h += '<div class="card click" onclick="go(\'me\')"><div style="font-weight:700;font-size:16px">My Account</div><div class="sub" style="margin:6px 0 0;font-size:13px">Change password · permissions</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:28px">More</h1><p class="sub">' + (me && me.role === "owner" ? "Owner" : "Staff") + ' · ' + (me ? me.username : "") + '</p>' + h + '<button class="btn dark" style="margin-top:24px" onclick="location.href=\'index.html\'">← Back to Customer App</button><button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button></div></div>';
};

/* MENU */
R.menu = function() {
  if (!can("menu")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var list = ADD.map(function(a) {
    return '<div class="snack-row"><div class="snack-photo">🍽️</div><div class="snack-info"><div class="snack-name">' + a.name + '</div><div class="snack-sub">₹' + a.price + (a.points_price ? " · " + a.points_price + " pts" : "") + '</div></div><div style="display:flex;gap:8px"><button class="btn dark xs" onclick="editItem(\'' + a.id + '\')">Edit</button><button class="btn danger xs" onclick="delItem(\'' + a.id + '\')">✕</button></div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--txt3)">← More</a><h1 style="margin-top:20px">Menu Manager</h1><p class="sub">' + ADD.length + ' items</p><button class="btn" onclick="addItem()">+ Add Item</button><div style="margin-top:20px">' + list + '</div></div></div>';
};
window.addItem = function() {
  sheet({ title: "New Item", fields: [{ id: "n", label: "Name" }, { id: "p", label: "Price ₹", type: "number" }], confirmText: "Create", onConfirm: function(v) {
    var n = (v.n || "").trim(); if (!n) return toast("Enter name", "error");
    var p = parseInt(v.p) || 0; if (!p) return toast("Enter price", "error");
    var id = "i" + Date.now().toString(36);
    var item = { id: id, name: n, price: p, points_price: p, photo: "" };
    sb.from("addons").insert(item).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADD = ADD.concat([item]); toast("Added", "success"); render("menu", {});
    });
  } });
};
window.editItem = function(id) {
  var a = ADD.find(function(x) { return x.id === id; }); if (!a) return;
  sheet({ title: "Edit Item", fields: [{ id: "n", label: "Name", value: a.name }, { id: "p", label: "Price ₹", type: "number", value: String(a.price) }], confirmText: "Save", onConfirm: function(v) {
    var n = (v.n || "").trim(); var p = parseInt(v.p) || 0;
    sb.from("addons").update({ name: n, price: p, points_price: p }).eq("id", id).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      a.name = n; a.price = p; a.points_price = p; toast("Updated", "success"); render("menu", {});
    });
  } });
};
window.delItem = function(id) {
  var a = ADD.find(function(x) { return x.id === id; }); if (!a) return;
  confirmBox({ title: "Delete " + a.name + "?", yesText: "Delete", onYes: function() {
    sb.from("addons").delete().eq("id", id).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADD = ADD.filter(function(x) { return x.id !== id; }); toast("Deleted", "success"); render("menu", {});
    });
  } });
};

/* REPORTS */
R.reports = function() {
  if (!can("reports")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var tr = SESS.reduce(function(t, s) { return t + (s.paid ? s.total : 0); }, 0);
  var cash = SESS.filter(function(s) { return s.paid && s.method === "cash"; }).reduce(function(t, s) { return t + s.total; }, 0);
  var upi = SESS.filter(function(s) { return s.paid && s.method === "upi"; }).reduce(function(t, s) { return t + s.total; }, 0);
  var pts = SESS.filter(function(s) { return s.paid && s.method === "points"; }).reduce(function(t, s) { return t + s.total; }, 0);
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--txt3)">← More</a><h1 style="margin-top:20px">Reports</h1><div class="grid4" style="margin-bottom:16px"><div class="stat"><div class="v">₹' + tr + '</div><div class="l">Total Revenue</div></div><div class="stat"><div class="v" style="color:var(--green)">₹' + cash + '</div><div class="l">Cash</div></div><div class="stat"><div class="v" style="color:var(--cyan)">₹' + upi + '</div><div class="l">UPI</div></div><div class="stat"><div class="v">₹' + pts + '</div><div class="l">Points</div></div></div><div class="stat"><div class="v">' + CUST.length + '</div><div class="l">Customers</div></div></div></div>';
};

/* SETTINGS */
R.settings = function() {
  if (!can("settings")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var s = (SETTINGS && SETTINGS.cafe) || {};
  var l = (SETTINGS && SETTINGS.loyalty) || {};
  return '<div class="screen"><div class="wrap" style="max-width:560px"><a href="javascript:go(\'more\')" style="color:var(--txt3)">← More</a><h1 style="margin-top:20px">Café Settings</h1><p class="sub">Live updates to customer app</p><div class="sec-label">Café Info</div><div class="card"><label>Phone</label><input id="s_phone" value="' + esc(s.phone || "") + '"><label>Hours</label><input id="s_hours" value="' + esc(s.hours || "") + '"><label>Address</label><input id="s_addr" value="' + esc(s.address || "") + '"></div><div class="sec-label">Loyalty</div><div class="card"><div class="grid2"><div><label>₹ per point</label><input id="s_rr" type="number" value="' + (l.RR || 20) + '"></div><div><label>Points per free hour</label><input id="s_pph" type="number" value="' + (l.POINTS_PER_HOUR || 1000) + '"></div></div><div class="grid2"><div><label>Referral bonus</label><input id="s_ref" type="number" value="' + (l.REF_BONUS || 50) + '"></div><div><label>Birthday bonus</label><input id="s_bday" type="number" value="' + (l.BDAY_BONUS || 100) + '"></div></div></div><button class="btn" onclick="saveSettings2()">Save Settings</button></div></div>';
};
window.saveSettings2 = function() {
  var s = {
    cafe: { phone: document.getElementById("s_phone").value.trim(), hours: document.getElementById("s_hours").value.trim(), address: document.getElementById("s_addr").value.trim() },
    loyalty: { RR: parseInt(document.getElementById("s_rr").value) || 20, POINTS_PER_HOUR: parseInt(document.getElementById("s_pph").value) || 1000, REF_BONUS: parseInt(document.getElementById("s_ref").value) || 50, BDAY_BONUS: parseInt(document.getElementById("s_bday").value) || 100 },
    experiences: (SETTINGS && SETTINGS.experiences) || EXP
  };
  saveSettings(s).then(function(res) { if (res && res.error) return toast(res.error.message, "error"); toast("Saved", "success"); });
};

/* MY ACCOUNT */
R.me = function() {
  var me = getMe(); if (!me) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var age = ageDays(me);
  var daysLeft = Math.max(0, PWD_MAX_AGE - age);
  var ageColor = daysLeft > 30 ? "var(--green)" : daysLeft > 10 ? "#f59e0b" : "var(--red)";
  var perms = me.role === "owner" ? ALL_PERMS : (me.perms || []);
  var permHTML = ALL_PERMS.map(function(p) {
    var has = perms.indexOf(p) >= 0;
    return '<div class="perm-item" style="cursor:default;' + (has ? "border-color:var(--gold3);background:var(--card2)" : "opacity:.4") + '"><span>' + PERM_LABELS[p] + '</span><span style="margin-left:auto;color:' + (has ? "var(--green)" : "var(--txt3)") + '">' + (has ? "✓" : "—") + '</span></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--txt3)">← More</a><h1 style="margin-top:20px">My Account</h1><div style="text-align:center;margin:24px 0"><div class="avatar avatar-lg" style="margin:0 auto;font-size:40px">' + (me.role === "owner" ? "👑" : "🧑‍💼") + '</div><div style="font-size:24px;font-weight:700;margin-top:16px">' + esc(me.username) + '</div><div style="color:' + (me.role === "owner" ? "var(--gold)" : "var(--cyan)") + ';font-size:11px;font-weight:700;letter-spacing:.15em;margin-top:6px;text-transform:uppercase">' + (me.role === "owner" ? "Owner · Full Access" : "Staff Member") + '</div></div><div class="sec-label">Password Status</div><div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:600">Last changed</div><div style="color:var(--txt3);font-size:12px;margin-top:4px">' + (age === 0 ? "Today" : age + " day" + (age > 1 ? "s" : "") + " ago") + '</div></div><div style="text-align:right"><div style="font-size:26px;font-weight:700;color:' + ageColor + '">' + daysLeft + '</div><div style="color:var(--txt3);font-size:10px;font-weight:700;letter-spacing:.1em">DAYS LEFT</div></div></div>' + (daysLeft <= 10 ? '<div class="notice red" style="margin:14px 0 0">Expires soon</div>' : '') + '<button class="btn dark" style="margin-top:14px" onclick="openPwdReset(getMe(),false)">Change My Password</button></div><div class="sec-label">My Permissions</div><div class="perm-grid">' + permHTML + '</div>' + (me.role === "owner" ? '<button class="btn dark" style="margin-top:20px" onclick="go(\'admin_users\')">Manage Staff</button>' : '') + '<button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button></div></div>';
};

/* STAFF */
R.admin_users = function() {
  if (!isOwner()) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var me = getMe();
  var cards = ADMINS.map(function(a) {
    var isMe = a.username === me.username;
    var permCount = a.role === "owner" ? ALL_PERMS.length : (a.perms || []).length;
    var age = ageDays(a);
    var isOld = age >= PWD_MAX_AGE - 15;
    var actions = isMe ? '<div class="notice gold" style="margin:0;font-size:12px">This is you</div>' : '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn dark xs" onclick="editPerm(\'' + a.username + '\')">Permissions (' + permCount + ')</button><button class="btn dark xs" onclick="ownerResetPwd(\'' + a.username + '\')">Reset Password</button>' + (a.role !== "owner" ? '<button class="btn dark xs" onclick="promoteAdmin(\'' + a.username + '\')">Promote</button>' : '<button class="btn dark xs" onclick="demoteAdmin(\'' + a.username + '\')">Demote</button>') + '<button class="btn danger xs" onclick="removeAdmin(\'' + a.username + '\')">Remove</button></div>';
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div><div style="font-weight:700;font-size:16px">' + esc(a.username) + (a.role === "owner" ? " 👑" : "") + '</div><div style="color:var(--txt3);font-size:12px;margin-top:3px">' + (a.role === "owner" ? "Owner · Full access" : "Staff · " + permCount + " perms") + '</div>' + (isOld && !isMe ? '<div style="color:#f59e0b;font-size:11px;margin-top:4px">Password ' + age + ' days old</div>' : '') + '</div>' + (isMe ? '<span class="badge vip">YOU</span>' : a.role === "owner" ? '<span class="badge vip">OWNER</span>' : '') + '</div>' + actions + '</div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--txt3)">← More</a><h1 style="margin-top:20px">Staff Accounts</h1><p class="sub">' + ADMINS.length + ' account' + (ADMINS.length !== 1 ? "s" : "") + '</p><button class="btn" onclick="addAdmin()">+ Add Staff Member</button><div style="margin-top:20px">' + cards + '</div></div></div>';
};
window.addAdmin = function() {
  sheet({ title: "Add Staff", fields: [{ id: "u", label: "Username", placeholder: "e.g. rahul" }, { id: "p", label: "Password (6+)", type: "password" }], confirmText: "Create", onConfirm: function(v) {
    var u = (v.u || "").trim().toLowerCase(); var p = v.p || "";
    if (!u || u.length < 3) return toast("Username 3+", "error");
    if (!/^[a-z0-9_]+$/.test(u)) return toast("Letters/numbers only", "error");
    if (!p || p.length < 6) return toast("Password 6+", "error");
    if (ADMINS.find(function(x) { return x.username.toLowerCase() === u; })) return toast("Taken", "error");
    var a = { username: u, passHash: hashPin(p), role: "admin", perms: ALL_PERMS.slice(), createdAt: Date.now(), password_changed_at: Date.now(), password_history: "[]" };
    sb.from("admins").insert(denormA(a)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADMINS = ADMINS.concat([a]); toast("Created", "success"); render("admin_users", {});
    });
  } });
};
window.ownerResetPwd = function(uname) {
  var a = ADMINS.find(function(x) { return x.username === uname; }); if (!a) return;
  var newPwd = String(Math.floor(100000 + Math.random() * 900000));
  sheet({ title: "Reset Password", subtitle: uname, fields: [{ type: "info", value: "New: <b style='font-size:22px;color:var(--gold);letter-spacing:.1em'>" + newPwd + "</b>" }], confirmText: "Reset", onConfirm: function() {
    var updated = Object.assign({}, a, { passHash: hashPin(newPwd), password_changed_at: Date.now(), password_history: "[]" });
    sb.from("admins").upsert(denormA(updated)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADMINS = ADMINS.map(function(x) { return x.username === uname ? updated : x; });
      toast("Reset for " + uname, "success"); render("admin_users", {});
    });
  } });
};
window.editPerm = function(u) {
  var a = ADMINS.find(function(x) { return x.username === u; }); if (!a) return;
  if (a.role === "owner") return toast("Owner has all", "warn");
  var m = document.createElement("div");
  m.className = "modal";
  var inner = '<div class="sheet"><h2>Permissions</h2><div class="s">' + esc(u) + '</div><div class="perm-grid">';
  ALL_PERMS.forEach(function(p) { inner += '<label class="perm-item"><input type="checkbox" id="pm_' + p + '"' + ((a.perms || []).indexOf(p) >= 0 ? " checked" : "") + '><span>' + PERM_LABELS[p] + '</span></label>'; });
  inner += '</div><button class="btn" id="sv">Save</button><button class="btn dark" id="cx" style="margin-top:8px">Cancel</button></div>';
  m.innerHTML = inner;
  document.body.appendChild(m);
  document.getElementById("sv").onclick = function() {
    var perms = ALL_PERMS.filter(function(p) { return document.getElementById("pm_" + p).checked; });
    if (!perms.length) return toast("Keep 1", "error");
    var u2 = Object.assign({}, a, { perms: perms });
    sb.from("admins").upsert(denormA(u2)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADMINS = ADMINS.map(function(x) { return x.username === u ? u2 : x; });
      m.remove(); toast("Saved", "success"); render("admin_users", {});
    });
  };
  document.getElementById("cx").onclick = function() { m.remove(); };
};
window.promoteAdmin = function(u) {
  confirmBox({ title: "Promote " + u + "?", yesText: "Promote", onYes: function() {
    var a = ADMINS.find(function(x) { return x.username === u; }); if (!a) return;
    var u2 = Object.assign({}, a, { role: "owner", perms: ALL_PERMS.slice() });
    sb.from("admins").upsert(denormA(u2)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADMINS = ADMINS.map(function(x) { return x.username === u ? u2 : x; });
      toast("Promoted", "success"); render("admin_users", {});
    });
  } });
};
window.demoteAdmin = function(u) {
  confirmBox({ title: "Demote " + u + "?", yesText: "Demote", onYes: function() {
    var a = ADMINS.find(function(x) { return x.username === u; }); if (!a) return;
    var u2 = Object.assign({}, a, { role: "admin" });
    sb.from("admins").upsert(denormA(u2)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADMINS = ADMINS.map(function(x) { return x.username === u ? u2 : x; });
      toast("Demoted", "success"); render("admin_users", {});
    });
  } });
};
window.removeAdmin = function(u) {
  confirmBox({ title: "Remove " + u + "?", yesText: "Remove", onYes: function() {
    sb.from("admins").delete().eq("username", u).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADMINS = ADMINS.filter(function(x) { return x.username !== u; });
      toast("Removed", "success"); render("admin_users", {});
    });
  } });
};

/* NEW SALE */
R.newsale = function() {
  if (!bk) bk = { exp: null };
  var cards = EXP.map(function(x) {
    return '<div class="card click" onclick="pickE(\'' + x.id + '\')"><div style="font-weight:700;font-size:16px">' + x.name + '</div><div style="color:var(--txt3);font-size:13px;margin-top:6px">' + (x.fixed ? "₹" + x.fixed : "From ₹" + x.from) + '</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--txt3)">← Floor</a><h1 style="margin-top:20px">New Sale</h1><p class="sub">Select experience</p>' + cards + '</div></div>';
};
window.pickE = function(id) {
  var e = EXP.find(function(x) { return x.id === id; }); if (!e) return;
  sheet({ title: "New Sale", subtitle: e.name, fields: [{ id: "n", label: "Customer name", value: "Walk-in" }], confirmText: "Create", onConfirm: function(v) {
    var total = e.fixed || 0;
    var s = { id: "YN" + Date.now().toString(36).toUpperCase().slice(-6), name: (v.n || "Walk-in").trim(), phone: "", expId: e.id, expName: e.name, items: [e.name], total: total, minutes: 1800, players: 1, method: "cash", paid: false, status: "pending", createdAt: Date.now(), customerId: null, isMembership: true };
    sb.from("sessions").insert(denormS(s)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      SESS = [s].concat(SESS); bk = null; toast("Saved", "success"); go("payments");
    });
  } });
};

/* REALTIME */
function setupRealtime() {
  if (!sb) return;
  try { sb.removeAllChannels(); } catch(e) {}
  ["customers", "sessions", "requests", "admins"].forEach(function(t) {
    try {
      sb.channel("adm-" + t).on("postgres_changes", { event: "*", schema: "public", table: t }, function(payload) {
        loadAll().then(function() { if (curR) render(curR, {}); });
        if (payload.eventType === "INSERT" && payload.new) {
          var row = payload.new;
          if (t === "customers" && row.activated === false) notifyAdmin("New signup: " + (row.name || "?") + " · #" + (row.id || ""));
          else if (t === "requests" && row.status === "pending") notifyAdmin((row.type === "snack" ? "🍟 " : "🔔 ") + (row.customer_name || "?") + " · ₹" + (row.total || 0));
          else if (t === "sessions" && row.status === "pending") notifyAdmin("🎮 Booking · " + (row.name || "?") + " · " + (row.exp_name || ""));
        }
      }).subscribe();
    } catch(e) { console.error(e); }
  });
}
if ("Notification" in window && Notification.permission === "default") {
  setTimeout(function() { Notification.requestPermission(); }, 3000);
}

document.getElementById("app").innerHTML = '<div class="screen"><div class="wrap"><div class="empty"><div class="big">⏳</div><div class="msg">LOADING</div></div></div></div>';
loadAll().then(function() {
  if (!ADMINS.length) go("claim_owner");
  else if (isAdmin()) go("floor");
  else go("login");
  setupRealtime();
}).catch(function(e) {
  console.error(e);
  document.getElementById("app").innerHTML = '<div class="screen"><div class="wrap"><div class="empty"><div class="big">❌</div><div class="msg">CONNECTION FAILED</div><button class="btn" style="margin-top:20px" onclick="location.reload()">Retry</button></div></div></div>';
});
