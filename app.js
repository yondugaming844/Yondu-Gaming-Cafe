/* YONDU ADMIN PANEL */

var curR = "", bk = null, tab = "dash";
var ALL_PERMS = ["floor","pay","requests","customers","menu","reports","settings"];
var PERM_LABELS = { floor: "🏠 Live Floor", pay: "💳 Payments", requests: "🔔 Requests", customers: "👥 Customers", menu: "🍟 Menu", reports: "📊 Reports", settings: "⚙ Settings" };
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
  var colors = { success: "#22c55e", error: "#ef4444", info: "#22d3ee", warn: "#fb923c" };
  var el = document.createElement("div");
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);background:" + (colors[type] || colors.info) + ";color:#fff;padding:12px 22px;border-radius:12px;font-weight:800;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:14px;max-width:90%;text-align:center;transition:transform .3s";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(0)"; }, 20);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(-100px)"; }, 2200);
  setTimeout(function() { el.remove(); }, 2700);
}

function sheet(opts) {
  var m = document.createElement("div");
  m.className = "modal";
  var html = "";
  var fields = opts.fields || [];
  fields.forEach(function(f) {
    if (f.type === "info") html += '<div class="notice gold" style="margin-bottom:12px">' + f.value + '</div>';
    else if (f.type === "notice") html += '<div class="notice ' + (f.color || "") + '" style="margin-bottom:12px">' + f.value + '</div>';
    else if (f.type === "select") {
      html += '<label>' + f.label + '</label><select id="' + f.id + '">';
      f.options.forEach(function(o) { html += '<option value="' + o.value + '"' + (o.value === f.value ? " selected" : "") + '>' + o.label + '</option>'; });
      html += '</select>';
    } else {
      html += '<label>' + f.label + '</label><input id="' + f.id + '" type="' + (f.type || "text") + '" value="' + (f.value || "") + '" placeholder="' + (f.placeholder || "") + '">';
    }
  });
  m.innerHTML = '<div class="sheet"><h2>' + opts.title + '</h2>' + (opts.subtitle ? '<div class="s">' + opts.subtitle + '</div>' : "") + html + '<button class="btn" id="sheet-ok" style="margin-top:8px">' + (opts.confirmText || "Save") + '</button><button class="btn dark" id="sheet-cancel" style="margin-top:8px">Cancel</button></div>';
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
  m.innerHTML = '<div class="sheet"><h2>' + opts.title + '</h2>' + (opts.message ? '<div class="s">' + opts.message + '</div>' : "") + '<button class="btn" id="ok">' + (opts.yesText || "Yes") + '</button><button class="btn dark" id="no" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  document.getElementById("ok").onclick = function() { m.remove(); if (opts.onYes) opts.onYes(); };
  document.getElementById("no").onclick = function() { m.remove(); };
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

/* ===================== OWNER SETUP + LOGIN ===================== */
R.claim_owner = function() {
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto">' +
    '<div class="hero-badge" style="display:block;text-align:center;margin:0 auto 20px">✦ Setup ✦</div>' +
    '<h1 style="text-align:center;color:var(--gold);font-size:28px">CLAIM OWNER</h1>' +
    '<p class="sub" style="text-align:center">First-time setup for Yondu Gaming Café</p>' +
    '<div class="notice gold">👑 You become Owner with full control. Save these credentials somewhere safe.</div>' +
    '<label>Username</label><input id="oau" placeholder="owner" autocomplete="off" style="text-transform:lowercase">' +
    '<label>Password <span class="opt">min 6 chars</span></label><input id="oap" type="password" autocomplete="new-password">' +
    '<label>Confirm Password</label><input id="oap2" type="password" autocomplete="new-password">' +
    '<button class="btn" onclick="doClaim()">Create Owner</button>' +
    '<button class="btn dark" style="margin-top:8px" onclick="location.href=\'index.html\'">← Back to App</button>' +
  '</div></div>';
};

window.doClaim = function() {
  var u = document.getElementById("oau").value.trim().toLowerCase();
  var p = document.getElementById("oap").value;
  var p2 = document.getElementById("oap2").value;
  if (!u || u.length < 3) return toast("Username 3+", "error");
  if (!/^[a-z0-9_]+$/.test(u)) return toast("Letters, numbers, underscore only", "error");
  if (!p || p.length < 6) return toast("Password 6+", "error");
  if (p !== p2) return toast("Passwords don't match", "error");
  loadAll().then(function() {
    if (ADMINS.length) return toast("Owner already exists", "error");
    var a = { username: u, passHash: hashPin(p), role: "owner", perms: ALL_PERMS.slice(), createdAt: Date.now(), password_changed_at: Date.now(), password_history: "[]" };
    ADMINS = [a];
    saveAdmins(ADMINS).then(function() {
      DB.set("yondu_admin_session", u);
      toast("✅ Owner created!", "success");
      go("floor");
    });
  });
};

R.login = function() {
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto">' +
    '<div class="hero-badge" style="display:block;text-align:center;margin:0 auto 20px">✦ Admin ✦</div>' +
    '<h1 style="text-align:center;color:var(--gold);font-size:32px;letter-spacing:4px">YONDU</h1>' +
    '<p class="sub" style="text-align:center;letter-spacing:3px;font-size:11px">ADMIN PANEL</p>' +
    '<label>Username</label><input id="au" placeholder="username" autocomplete="username" style="text-transform:lowercase">' +
    '<label>Password</label><input id="ap" type="password" placeholder="••••••" autocomplete="current-password">' +
    '<button class="btn" style="margin-top:8px" onclick="doLogin()">Sign In</button>' +
    '<button class="btn dark" style="margin-top:8px" onclick="location.href=\'index.html\'">← Back to Customer App</button>' +
  '</div></div>';
};

window.doLogin = function() {
  var u = document.getElementById("au").value.trim().toLowerCase();
  var p = document.getElementById("ap").value;
  if (!u || !p) return toast("Enter username & password", "error");
  loadAll().then(function() {
    if (!ADMINS.length) { go("claim_owner"); return; }
    var a = ADMINS.find(function(x) { return x.username.toLowerCase() === u; });
    if (!a || hashPin(p) !== a.passHash) return toast("Wrong username or password", "error");
    DB.set("yondu_admin_session", a.username);
    if (isExpired(a)) { openPwdReset(a, true); return; }
    var age = ageDays(a);
    if (age >= 75) setTimeout(function() { toast("⚠ Password expires in " + (PWD_MAX_AGE - age) + " days", "warn"); }, 800);
    go("floor");
  });
};

window.doLogout = function() {
  confirmBox({ title: "Sign Out?", message: "You'll need to log in again.", yesText: "Sign Out", onYes: function() { DB.del("yondu_admin_session"); go("login"); } });
};

/* ============================================================
   PASSWORD RESET — used by owner (self or staff)
   ============================================================ */
function openPwdReset(admin, isExpired) {
  var m = document.createElement("div");
  m.id = "pwdResetModal"; m.className = "modal";
  m.innerHTML = '<div class="sheet">' +
    '<h2>' + (isExpired ? "🔐 Password Expired" : "🔑 Reset Password") + '</h2>' +
    '<div class="s">' + (isExpired ? "Your password is " + PWD_MAX_AGE + "+ days old. Set a new one to continue." : "Set a new password for <b>" + esc(admin.username) + "</b>") + '</div>' +
    '<label>New password (6+ chars)</label><input id="fp_new" type="password" placeholder="••••••" autocomplete="new-password">' +
    '<label>Confirm new password</label><input id="fp_conf" type="password" placeholder="••••••" autocomplete="new-password">' +
    '<div class="notice gold" style="margin-top:10px">🔒 Cannot reuse any of your last ' + PWD_HISTORY + ' passwords</div>' +
    '<button class="btn" id="fp_save">Save New Password</button>' +
    (isExpired ? '' : '<button class="btn dark" id="fp_cancel" style="margin-top:8px">Cancel</button>') +
    '</div>';
  document.body.appendChild(m);
  document.getElementById("fp_save").onclick = function() {
    var np = document.getElementById("fp_new").value;
    var cf = document.getElementById("fp_conf").value;
    if (np.length < 6) return toast("6+ characters required", "error");
    if (np !== cf) return toast("Passwords don't match", "error");
    var newHash = hashPin(np);
    if (newHash === admin.passHash) return toast("Cannot reuse current password", "error");
    if (checkPwdHistory(newHash, admin.password_history)) return toast("Recently used password — pick a new one", "error");
    var oldHistory = pushPwdHistory(admin.passHash, admin.password_history);
    var updated = Object.assign({}, admin, { passHash: newHash, password_history: oldHistory, password_changed_at: Date.now() });
    sb.from("admins").upsert(denormA(updated)).then(function(res) {
      if (res.error) return toast("❌ " + res.error.message, "error");
      ADMINS = ADMINS.map(function(x) { return x.username === admin.username ? updated : x; });
      m.remove();
      toast("✅ Password updated!", "success");
      if (isExpired) { go("floor"); } else { render(curR, {}); }
    });
  };
  var cx = document.getElementById("fp_cancel");
  if (cx) cx.onclick = function() { m.remove(); };
}

/* ===================== LIVE FLOOR ===================== */
R.floor = function() {
  if (!can("floor")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var now = Date.now();
  var playing = SESS.filter(function(s) { return s.status === "playing"; });
  var pend = CUST.filter(function(c) { return !c.activated; }).length;
  var pendReq = REQ.filter(function(r) { return r.status === "pending"; }).length;
  var col = SESS.filter(function(s) { return !s.paid && s.status !== "ended"; }).length;
  var today = new Date().setHours(0, 0, 0, 0);
  var tSess = SESS.filter(function(s) { return s.createdAt >= today; });
  var tRev = tSess.reduce(function(t, s) { return t + (s.paid ? s.total : 0); }, 0);
  var busy = {};
  playing.forEach(function(s) { if (s.stationId) busy[s.stationId] = s; });
  var stations = STA.map(function(st) {
    var s = busy[st.id];
    if (s) {
      var l = s.end ? (s.end - now) : 0;
      var m = Math.max(0, Math.floor(l / 60000));
      var sec = Math.max(0, Math.floor((l % 60000) / 1000));
      var cls = s.isMembership ? "" : (l < 5 * 60000 ? "over" : l < 15 * 60000 ? "warn" : "");
      var elapsed = s.isMembership && s.start ? Date.now() - s.start : 0;
      var display = s.isMembership ? String(Math.floor(elapsed / 60000)).padStart(2, "0") + ":" + String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0") : String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
      return '<div class="station playing" onclick="go(\'station\',{id:\'' + st.id + '\'})"><div class="st-h"><div class="st-nm">' + st.name + '</div><span class="pill busy">' + (s.isMembership ? "🎫 MEMBERSHIP" : "● PLAYING") + '</span></div><div class="status">' + s.name + '</div><div class="time ' + cls + '" data-s="' + s.id + '">' + display + '</div></div>';
    }
    return '<div class="station free" onclick="startAt(\'' + st.id + '\')"><div class="st-h"><div class="st-nm">' + st.name + '</div><span class="pill free">● FREE</span></div><div class="status">Ready</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<div><h1 style="font-size:24px;margin:0">Live Floor</h1><p class="sub" style="margin:4px 0 0">' + playing.length + ' playing · ' + tSess.length + ' today</p></div>' +
      '<button class="btn sm" onclick="go(\'newsale\')">+ Sale</button>' +
    '</div>' +
    ((pend + pendReq) > 0 ? '<div class="notice orange" onclick="go(\'requests\')" style="cursor:pointer">🔔 <b>' + pend + ' signup' + (pend !== 1 ? "s" : "") + '</b> · <b>' + pendReq + ' request' + (pendReq !== 1 ? "s" : "") + '</b> → tap to open</div>' : "") +
    '<div class="grid4" style="margin-bottom:16px">' +
      '<div class="stat"><div class="v">₹' + tRev + '</div><div class="l">Today</div></div>' +
      '<div class="stat"><div class="v" style="color:var(--cyan)">' + playing.length + '</div><div class="l">Playing</div></div>' +
      '<div class="stat"><div class="v" style="color:var(--pink)">' + col + '</div><div class="l">Collect</div></div>' +
      '<div class="stat"><div class="v" style="color:var(--green)">' + pend + '</div><div class="l">Pending</div></div>' +
    '</div>' +
    '<div class="sec-label">Stations</div>' + stations +
  '</div></div>';
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
    var all = SESS.filter(function(s) { return !s.stationId && s.status !== "ended"; });
    if (!all.length) return toast("No pending sessions", "error");
    var options = all.slice(0, 20).map(function(s) { return { value: s.id, label: s.id + " — " + s.name }; });
    var st = STA.find(function(x) { return x.id === stId; });
    sheet({ title: "▶ Start Session", subtitle: "Station: " + (st ? st.name : ""), fields: [{ id: "sid", label: "Pick booking", type: "select", options: options, value: options[0].value }], confirmText: "▶ Start Now", onConfirm: function(v) {
      var s = all.find(function(x) { return x.id === v.sid; });
      if (!s) return;
      s.paid = true; s.status = "playing"; s.stationId = stId; s.start = Date.now(); s.end = Date.now() + (s.minutes || 60) * 60000;
      sb.from("sessions").upsert(denormS(s)).then(function() { toast("Started", "success"); go("station", { id: stId }); });
    } });
  });
};

R.station = function(p) {
  var st = STA.find(function(x) { return x.id === p.id; });
  var s = SESS.find(function(x) { return x.stationId === p.id && x.status === "playing"; });
  if (!st) return '<div class="screen"><div class="wrap"><h2>Not found</h2></div></div>';
  if (!s) return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted)">← Floor</a><h1 style="margin-top:20px">' + st.name + '</h1><div class="notice">Station free</div></div></div>';
  var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted)">← Floor</a><h1 style="margin-top:20px">' + st.name + '</h1><p class="sub">' + s.name + (c ? " · " + c.id : "") + '</p><div class="card" style="text-align:center;padding:24px"><div style="color:var(--gold);font-size:11px;letter-spacing:2px;font-weight:700">' + (s.isMembership ? "MEMBERSHIP" : "TIME REMAINING") + '</div><div class="timer-huge" id="ast">--:--</div></div><div class="card">' + (s.items || []).map(function(i) { return '<div style="padding:4px 0;font-size:14px">' + i + '</div>'; }).join("") + '</div><button class="btn dark" onclick="aAdd(\'' + s.id + '\')">🍟 Add Snacks</button><button class="btn dark" style="margin-top:8px" onclick="aExt(\'' + s.id + '\')">⏱ Add Time</button><button class="btn orange" style="margin-top:8px" onclick="aEnd(\'' + s.id + '\')">End</button></div></div>';
};

R.station.after = function(p) {
  var s = SESS.find(function(x) { return x.stationId === p.id && x.status === "playing"; });
  if (!s) return;
  var el = document.getElementById("ast");
  if (!el) return;
  var tick = function() {
    if (!s.end) return;
    var l = s.end - Date.now();
    if (l <= 0) { el.textContent = "00:00"; el.className = "timer-huge over"; return; }
    el.textContent = String(Math.floor(l / 60000)).padStart(2, "0") + ":" + String(Math.floor((l % 60000) / 1000)).padStart(2, "0");
    el.className = "timer-huge" + (l < 5 * 60000 ? " over" : l < 15 * 60000 ? " warn" : "");
  };
  tick(); setInterval(tick, 1000);
};

window.aAdd = function(sid) {
  var opts = ADD.map(function(a) { return { value: a.id, label: a.name + " — ₹" + a.price }; });
  opts.push({ value: "__c", label: "✏ Custom" });
  sheet({ title: "Add Snacks", fields: [{ id: "pick", label: "Item", type: "select", options: opts, value: opts[0].value }, { id: "cn", label: "Custom name", type: "text" }, { id: "cp", label: "Custom ₹", type: "number" }, { id: "q", label: "Qty", type: "number", value: "1" }], onConfirm: function(v) {
    var q = Math.max(1, parseInt(v.q) || 1);
    var name, price;
    if (v.pick === "__c") { name = (v.cn || "").trim(); price = parseInt(v.cp) || 0; if (!name || !price) return toast("Enter name & price", "error"); }
    else { var a = ADD.find(function(x) { return x.id === v.pick; }); if (!a) return; name = a.name; price = a.price; }
    var s = getSess(sid); if (!s) return;
    for (var i = 0; i < q; i++) s.items.push(name);
    s.total += price * q;
    sb.from("sessions").upsert(denormS(s)).then(function() { toast("Added", "success"); render("station", { id: s.stationId }); });
  } });
};

window.aExt = function(sid) {
  sheet({ title: "Add Time", fields: [{ id: "m", label: "Minutes", type: "number", value: "30" }, { id: "r", label: "Rate ₹", type: "number", value: "100" }], onConfirm: function(v) {
    var add = parseInt(v.m) || 0; if (!add) return;
    var amt = parseInt(v.r) || 0;
    var s = getSess(sid); if (!s) return;
    s.end = Math.max(Date.now(), s.end || Date.now()) + add * 60000;
    s.minutes = (s.minutes || 0) + add; s.total += amt;
    sb.from("sessions").upsert(denormS(s)).then(function() { toast("Added", "success"); render("station", { id: s.stationId }); });
  } });
};

window.aEnd = function(sid) {
  var s = getSess(sid); if (!s) return;
  confirmBox({ title: "End Session?", message: "Total: ₹" + s.total, yesText: "End", onYes: function() {
    s.status = "ended";
    sb.from("sessions").upsert(denormS(s)).then(function() { toast("Ended", "success"); go("floor"); });
  } });
};

/* ===================== PAYMENTS ===================== */
R.payments = function() {
  if (!can("pay")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var all = SESS.filter(function(s) { return !s.paid && s.status !== "ended"; });
  var cards = all.length ? all.map(function(s) {
    var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
    return '<div class="card"><div style="font-weight:800;font-size:15px">' + s.name + '</div>' + (c ? '<div style="color:var(--cyan);font-size:12px;font-weight:700">' + c.id + '</div>' : "") + '<div style="color:var(--muted);font-size:13px;margin:6px 0">' + s.items.join(" · ") + '</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div style="font-size:24px;font-weight:800;color:var(--gold-bright)">₹' + s.total + '</div><button class="btn sm" onclick="collect(\'' + s.id + '\')">Collect</button></div></div>';
  }).join("") : '<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:24px">Payments</h1><p class="sub">Confirm cash → assign station</p>' + cards + '</div></div>';
};

window.collect = function(sid) {
  var s = getSess(sid); if (!s) return;
  var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
  sheet({ title: "Collect ₹" + s.total, subtitle: s.name, fields: [{ id: "m", label: "Method", type: "select", options: [{ value: "cash", label: "💵 Cash" }, { value: "upi", label: "📱 UPI" }, { value: "points", label: "🎁 Points" + (c ? " (" + c.points + ")" : "") }], value: "cash" }], confirmText: "✅ Confirm", onConfirm: function(v) {
    var m = v.m;
    if (m === "points") { if (!c) return toast("No customer", "error"); if (c.points < s.total) return toast("Not enough points", "error"); }
    s.paid = true; s.method = m;
    var tasks = [sb.from("sessions").upsert(denormS(s))];
    if (c) {
      if (m === "points") c.points -= s.total;
      else { c.points = (c.points || 0) + Math.floor(s.total / RR); c.totalSpent = (c.totalSpent || 0) + s.total; c.visits = (c.visits || 0) + 1; }
      tasks.push(sb.from("customers").upsert(denormC(c)));
    }
    Promise.all(tasks).then(function() { toast("Collected", "success"); render("payments", {}); });
  } });
};

/* ===================== REQUESTS ===================== */
R.requests = function() {
  if (!can("requests")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var pr = REQ.filter(function(r) { return r.status === "pending"; });
  var pa = CUST.filter(function(c) { return !c.activated; });
  var aHTML = pa.length ? '<div class="sec-label">⏳ Signups (' + pa.length + ')</div>' + pa.map(function(c) {
    return '<div class="card" style="border-left:4px solid var(--orange)"><div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' + (c.profilePic ? '<div class="avatar" style="background-image:url(\'' + c.profilePic + '\')"></div>' : '<div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div>') + '<div style="flex:1"><div style="font-weight:700">' + c.name + '</div><div style="color:var(--cyan);font-size:15px;font-weight:800;letter-spacing:2px">' + c.id + '</div></div></div><button class="btn green" onclick="activateCust(\'' + c.id + '\')">✅ Activate</button></div>';
  }).join("") : "";
  var rHTML = pr.length ? '<div class="sec-label">🔔 Requests (' + pr.length + ')</div>' + pr.map(function(r) {
    return '<div class="card" style="border-left:4px solid var(--pink)"><div style="font-weight:700">' + r.customerName + '</div><div style="color:var(--muted);font-size:13px;margin:8px 0">' + (r.items || []).join(" · ") + '</div><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:20px;font-weight:800;color:var(--gold-bright)">₹' + r.total + '</div><div style="display:flex;gap:6px"><button class="btn danger xs" onclick="rejectReq(\'' + r.id + '\')">✕</button><button class="btn sm" onclick="approveReq(\'' + r.id + '\')">Approve</button></div></div></div>';
  }).join("") : "";
  return '<div class="screen"><div class="wrap"><h1 style="font-size:24px">Requests</h1>' + ((!pr.length && !pa.length) ? '<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>' : "") + aHTML + rHTML + '</div></div>';
};

window.activateCust = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  var np = (c.points || 0) + 50;
  var nc = (c.credit || 0) + 30;
  sb.from("customers").update({ activated: true, points: np, credit: nc }).eq("id", cid).select().then(function(res) {
    if (res.error) return toast(res.error.message, "error");
    c.activated = true; c.points = np; c.credit = nc;
    toast(c.name + " activated", "success");
    render(curR, {});
  });
};

window.approveReq = function(rid) {
  var r = REQ.find(function(x) { return x.id === rid; }); if (!r) return;
  sb.from("requests").update({ status: "approved", processed_at: Date.now() }).eq("id", rid).select().then(function(res) {
    if (res.error) return toast(res.error.message, "error");
    r.status = "approved";
    toast("Approved", "success");
    render("requests", {});
  });
};

window.rejectReq = function(rid) {
  confirmBox({ title: "Reject?", yesText: "Reject", onYes: function() {
    sb.from("requests").update({ status: "rejected", processed_at: Date.now() }).eq("id", rid).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      var r = REQ.find(function(x) { return x.id === rid; });
      if (r) r.status = "rejected";
      render("requests", {});
    });
  } });
};

/* ===================== CUSTOMERS + PIN RESET ===================== */
R.customers = function() {
  if (!can("customers")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var cs = CUST.slice().sort(function(a, b) { return b.totalSpent - a.totalSpent; });
  var list = cs.length ? cs.map(function(c) {
    var badge = !c.activated ? '<span class="badge pending">Pending</span>' : c.banned ? '<span class="badge banned">Banned</span>' : c.vip ? '<span class="badge vip">VIP</span>' : '<span class="badge open">Active</span>';
    return '<div class="card"><div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">' + (c.profilePic ? '<div class="avatar" style="background-image:url(\'' + c.profilePic + '\')"></div>' : '<div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div>') + '<div style="flex:1"><div style="display:flex;justify-content:space-between"><div style="font-weight:700;font-size:15px">' + c.name + '</div>' + badge + '</div><div style="color:var(--cyan);font-size:13px;font-weight:700;letter-spacing:1.5px">' + c.id + '</div></div></div><div class="grid4" style="gap:8px;margin-bottom:10px"><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">POINTS</div><div style="font-weight:800;color:var(--gold-bright)">' + c.points + '</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">SPENT</div><div style="font-weight:800">₹' + c.totalSpent + '</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">VISITS</div><div style="font-weight:800">' + c.visits + '</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">HOURS</div><div style="font-weight:800;color:var(--cyan)">' + (c.ps5Hours || 0) + '·' + (c.raceHours || 0) + '</div></div></div><div style="display:flex;gap:6px;flex-wrap:wrap">' + (!c.activated ? '<button class="btn green xs" onclick="activateCust(\'' + c.id + '\')">✅</button>' : "") + '<button class="btn dark xs" onclick="editPts(\'' + c.id + '\')">💰</button><button class="btn dark xs" onclick="resetPin(\'' + c.id + '\')">🔑</button><button class="btn dark xs" onclick="togVIP(\'' + c.id + '\')">' + (c.vip ? "★" : "☆") + '</button><button class="btn ' + (c.banned ? "dark" : "danger") + ' xs" onclick="togBan(\'' + c.id + '\')">' + (c.banned ? "✓" : "🚫") + '</button></div></div>';
  }).join("") : '<div class="empty"><div class="msg">NONE</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:24px">Customers</h1><p class="sub">' + cs.length + ' total</p>' + list + '</div></div>';
};

window.editPts = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  sheet({ title: "Points", subtitle: c.name, fields: [{ id: "p", label: "Points", type: "number", value: String(c.points || 0) }], onConfirm: function(v) {
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
  sheet({ title: "🔑 Reset Customer PIN", subtitle: c.name, fields: [{ type: "info", value: "New PIN: <b style='font-size:22px;color:var(--gold-bright);letter-spacing:4px'>" + p + "</b><br><small>Write this down and give to customer</small>" }], confirmText: "Confirm Reset", onConfirm: function() {
    sb.from("customers").update({ pin_hash: hashPin(p) }).eq("id", cid).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      c.pinHash = hashPin(p); toast("PIN: " + p, "success"); render("customers", {});
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
  confirmBox({ title: (c.banned ? "Unban" : "Ban") + " " + c.name + "?", onYes: function() {
    var nb = !c.banned;
    sb.from("customers").update({ banned: nb }).eq("id", cid).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      c.banned = nb; render("customers", {});
    });
  } });
};

/* ===================== MORE MENU ===================== */
R.more = function() {
  var me = getMe();
  var h = "";
  if (can("menu")) h += '<div class="card click" onclick="go(\'menu\')"><div style="font-weight:700">🍟 Menu Manager</div><div class="sub" style="margin:4px 0 0;font-size:13px">' + ADD.length + ' items</div></div>';
  if (can("reports")) h += '<div class="card click" onclick="go(\'reports\')"><div style="font-weight:700">📊 Reports</div></div>';
  if (can("settings")) h += '<div class="card click" onclick="go(\'settings\')"><div style="font-weight:700">⚙ Café Settings</div></div>';
  if (isOwner()) h += '<div class="card click" onclick="go(\'admin_users\')" style="border:2px solid var(--gold)"><div style="font-weight:700">👑 Staff Accounts</div><div class="sub" style="margin:4px 0 0;font-size:13px">' + ADMINS.length + ' account' + (ADMINS.length !== 1 ? "s" : "") + ' · add · reset · remove</div></div>';
  h += '<div class="card click" onclick="go(\'me\')"><div style="font-weight:700">🧑‍💼 My Account</div><div class="sub" style="margin:4px 0 0;font-size:13px">Change my password · permissions</div></div>';
  return '<div class="screen"><div class="wrap">' +
    '<h1 style="font-size:24px">More</h1>' +
    '<p class="sub">' + (me && me.role === "owner" ? "👑 Owner" : "Staff Member") + ' · ' + (me ? me.username : "") + '</p>' +
    h +
    '<button class="btn dark" style="margin-top:20px" onclick="location.href=\'index.html\'">← Back to Customer App</button>' +
    '<button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button>' +
  '</div></div>';
};

/* ===================== MENU MANAGER ===================== */
R.menu = function() {
  if (!can("menu")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var list = ADD.map(function(a) {
    return '<div class="snack-row"><div class="snack-photo">🍽️</div><div class="snack-info"><div class="snack-name">' + a.name + '</div><div class="snack-sub">₹' + a.price + (a.points_price ? " · " + a.points_price + " pts" : "") + '</div></div><div style="display:flex;gap:6px"><button class="btn dark xs" onclick="editItem(\'' + a.id + '\')">✏</button><button class="btn danger xs" onclick="delItem(\'' + a.id + '\')">✕</button></div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">Menu Manager</h1><p class="sub">' + ADD.length + ' items</p><button class="btn" onclick="addItem()">+ Add Item</button><div style="margin-top:16px">' + list + '</div></div></div>';
};

window.addItem = function() {
  sheet({ title: "➕ New Item", fields: [{ id: "n", label: "Name" }, { id: "p", label: "Price ₹", type: "number" }], onConfirm: function(v) {
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
  sheet({ title: "Edit", fields: [{ id: "n", label: "Name", value: a.name }, { id: "p", label: "Price", type: "number", value: String(a.price) }], onConfirm: function(v) {
    var n = (v.n || "").trim(); var p = parseInt(v.p) || 0;
    sb.from("addons").update({ name: n, price: p, points_price: p }).eq("id", id).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      a.name = n; a.price = p; toast("Updated", "success"); render("menu", {});
    });
  } });
};

window.delItem = function(id) {
  var a = ADD.find(function(x) { return x.id === id; }); if (!a) return;
  confirmBox({ title: "Delete " + a.name + "?", onYes: function() {
    sb.from("addons").delete().eq("id", id).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      ADD = ADD.filter(function(x) { return x.id !== id; }); render("menu", {});
    });
  } });
};

/* ===================== REPORTS ===================== */
R.reports = function() {
  if (!can("reports")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var tr = SESS.reduce(function(t, s) { return t + (s.paid ? s.total : 0); }, 0);
  var cash = SESS.filter(function(s) { return s.paid && s.method === "cash"; }).reduce(function(t, s) { return t + s.total; }, 0);
  var upi = SESS.filter(function(s) { return s.paid && s.method === "upi"; }).reduce(function(t, s) { return t + s.total; }, 0);
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">Reports</h1><div class="grid4"><div class="stat"><div class="v">₹' + tr + '</div><div class="l">Total Revenue</div></div><div class="stat"><div class="v" style="color:var(--green)">₹' + cash + '</div><div class="l">Cash</div></div><div class="stat"><div class="v" style="color:var(--cyan)">₹' + upi + '</div><div class="l">UPI</div></div><div class="stat"><div class="v">' + CUST.length + '</div><div class="l">Customers</div></div></div></div></div>';
};

/* ===================== SETTINGS ===================== */
R.settings = function() {
  if (!can("settings")) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var s = (SETTINGS && SETTINGS.cafe) || {};
  var l = (SETTINGS && SETTINGS.loyalty) || {};
  return '<div class="screen"><div class="wrap" style="max-width:560px"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">Café Settings</h1><p class="sub">Changes apply live to customer app</p><div class="sec-label">📍 Café Info</div><div class="card"><label>Phone</label><input id="s_phone" value="' + esc(s.phone || "") + '"><label>Hours</label><input id="s_hours" value="' + esc(s.hours || "") + '"><label>Address</label><input id="s_addr" value="' + esc(s.address || "") + '"></div><div class="sec-label">💰 Loyalty</div><div class="card"><div class="grid2"><div><label>₹ per point</label><input id="s_rr" type="number" value="' + (l.RR || 20) + '"></div><div><label>Points per free hour</label><input id="s_pph" type="number" value="' + (l.POINTS_PER_HOUR || 1000) + '"></div></div><div class="grid2"><div><label>Referral bonus</label><input id="s_ref" type="number" value="' + (l.REF_BONUS || 50) + '"></div><div><label>Birthday bonus</label><input id="s_bday" type="number" value="' + (l.BDAY_BONUS || 100) + '"></div></div></div><button class="btn" onclick="saveSettings2()">💾 Save Settings</button></div></div>';
};

window.saveSettings2 = function() {
  var s = {
    cafe: { phone: document.getElementById("s_phone").value.trim(), hours: document.getElementById("s_hours").value.trim(), address: document.getElementById("s_addr").value.trim() },
    loyalty: { RR: parseInt(document.getElementById("s_rr").value) || 20, POINTS_PER_HOUR: parseInt(document.getElementById("s_pph").value) || 1000, REF_BONUS: parseInt(document.getElementById("s_ref").value) || 50, BDAY_BONUS: parseInt(document.getElementById("s_bday").value) || 100 },
    experiences: (SETTINGS && SETTINGS.experiences) || EXP
  };
  saveSettings(s).then(function(res) { if (res && res.error) return toast(res.error.message, "error"); toast("Saved", "success"); });
};

/* ===================== MY ACCOUNT (owner + staff) ===================== */
R.me = function() {
  var me = getMe();
  if (!me) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var age = ageDays(me);
  var daysLeft = Math.max(0, PWD_MAX_AGE - age);
  var ageColor = daysLeft > 30 ? "var(--green)" : daysLeft > 10 ? "var(--orange)" : "var(--red)";
  var perms = me.role === "owner" ? ALL_PERMS : (me.perms || []);
  var permHTML = ALL_PERMS.map(function(p) {
    var has = perms.indexOf(p) >= 0;
    return '<div class="perm-item" style="cursor:default;' + (has ? "border-color:var(--gold);background:#1f1a10" : "opacity:.4") + '"><span>' + PERM_LABELS[p] + '</span><span style="margin-left:auto;color:' + (has ? "var(--green)" : "var(--muted)") + '">' + (has ? "✓" : "—") + '</span></div>';
  }).join("");
  return '<div class="screen"><div class="wrap">' +
    '<a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a>' +
    '<h1 style="margin-top:20px">My Account</h1>' +
    '<div style="text-align:center;margin:20px 0">' +
      '<div class="avatar avatar-lg" style="margin:0 auto;font-size:36px;background:linear-gradient(135deg,#1f1a10,#0d0b05)">' + (me.role === "owner" ? "👑" : "🧑‍💼") + '</div>' +
      '<div style="font-size:22px;font-weight:800;margin-top:14px">' + esc(me.username) + '</div>' +
      '<div style="color:' + (me.role === "owner" ? "var(--gold)" : "var(--cyan)") + ';font-size:11px;font-weight:800;letter-spacing:2px;margin-top:6px">' + (me.role === "owner" ? "👑 OWNER · FULL ACCESS" : "STAFF MEMBER") + '</div>' +
    '</div>' +
    '<div class="sec-label">🔐 Password Status</div>' +
    '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div><div style="font-weight:700">Last changed</div><div style="color:var(--muted);font-size:12px;margin-top:3px">' + (age === 0 ? "Today" : age + " day" + (age > 1 ? "s" : "") + " ago") + '</div></div>' +
        '<div style="text-align:right"><div style="font-size:22px;font-weight:800;color:' + ageColor + '">' + daysLeft + '</div><div style="color:var(--muted);font-size:10px;font-weight:700">DAYS LEFT</div></div>' +
      '</div>' +
      (daysLeft <= 10 ? '<div class="notice red" style="margin:12px 0 0">⚠ Password expires soon — change now</div>' : '') +
      '<button class="btn" style="margin-top:12px" onclick="openPwdReset(getMe(),false)">🔑 Change My Password</button>' +
    '</div>' +
    '<div class="sec-label">🛡 My Permissions</div>' +
    '<div class="perm-grid">' + permHTML + '</div>' +
    (me.role === "owner" ? '<button class="btn dark" style="margin-top:20px" onclick="go(\'admin_users\')">👑 Manage Staff Accounts</button>' : '') +
    '<button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button>' +
  '</div></div>';
};

/* ===================== STAFF ACCOUNTS (owner only) ===================== */
R.admin_users = function() {
  if (!isOwner()) return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var me = getMe();
  var cards = ADMINS.map(function(a) {
    var isMe = a.username === me.username;
    var permCount = a.role === "owner" ? ALL_PERMS.length : (a.perms || []).length;
    var age = ageDays(a);
    var isOld = age >= PWD_MAX_AGE - 15;
    var actions = isMe ? '<div class="notice gold" style="margin:0;font-size:12px">👑 This is you</div>' :
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button class="btn dark xs" onclick="editPerm(\'' + a.username + '\')">🛡 Perms (' + permCount + ')</button>' +
      '<button class="btn dark xs" onclick="ownerResetPwd(\'' + a.username + '\')">🔑 Reset Password</button>' +
      (a.role !== "owner" ? '<button class="btn dark xs" onclick="promoteAdmin(\'' + a.username + '\')">👑 Promote</button>' : '<button class="btn dark xs" onclick="demoteAdmin(\'' + a.username + '\')">↓ Demote</button>') +
      '<button class="btn danger xs" onclick="removeAdmin(\'' + a.username + '\')">🗑</button>' +
      '</div>';
    return '<div class="card" style="padding:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<div><div style="font-weight:700;font-size:15px">' + esc(a.username) + (a.role === "owner" ? " 👑" : "") + '</div>' +
        '<div style="color:var(--muted);font-size:12px;margin-top:2px">' + (a.role === "owner" ? "Owner · Full access" : "Staff · " + permCount + " permissions") + '</div>' +
        (isOld && !isMe ? '<div style="color:var(--orange);font-size:11px;margin-top:4px">⚠ Password ' + age + ' days old</div>' : '') +
        '</div>' +
        (isMe ? '<span class="badge vip">YOU</span>' : a.role === "owner" ? '<span class="badge vip">OWNER</span>' : '') +
      '</div>' + actions + '</div>';
  }).join("");
  return '<div class="screen"><div class="wrap">' +
    '<a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a>' +
    '<h1 style="margin-top:20px">👑 Staff Accounts</h1>' +
    '<p class="sub">' + ADMINS.length + ' account' + (ADMINS.length !== 1 ? "s" : "") + ' · You are <b style="color:var(--gold-bright)">' + esc(me.username) + '</b></p>' +
    '<button class="btn" onclick="addAdmin()">+ Add Staff Member</button>' +
    '<div style="margin-top:16px">' + cards + '</div>' +
    '<div class="notice gold" style="margin-top:20px">💡 <b>Owner</b> = full access to everything<br><b>Staff</b> = only the permissions you grant<br><b>Reset Password</b> = set a new password for them</div>' +
  '</div></div>';
};

window.addAdmin = function() {
  sheet({
    title: "➕ Add Staff Member", subtitle: "Create a new login",
    fields: [
      { id: "u", label: "Username", type: "text", placeholder: "e.g. rahul" },
      { id: "p", label: "Password (6+ chars)", type: "password", placeholder: "••••••" },
      { type: "notice", value: "All permissions are ON by default. You can turn them off after." }
    ],
    confirmText: "Create Staff Account",
    onConfirm: function(v) {
      var u = (v.u || "").trim().toLowerCase();
      var p = v.p || "";
      if (!u || u.length < 3) return toast("Username 3+ characters", "error");
      if (!/^[a-z0-9_]+$/.test(u)) return toast("Only letters, numbers, underscore", "error");
      if (!p || p.length < 6) return toast("Password 6+ characters", "error");
      if (ADMINS.find(function(x) { return x.username.toLowerCase() === u; })) return toast("Username taken", "error");
      var a = { username: u, passHash: hashPin(p), role: "admin", perms: ALL_PERMS.slice(), createdAt: Date.now(), password_changed_at: Date.now(), password_history: "[]" };
      sb.from("admins").insert(denormA(a)).then(function(res) {
        if (res.error) return toast(res.error.message, "error");
        ADMINS = ADMINS.concat([a]);
        toast("✅ Staff \"" + u + "\" created", "success");
        render("admin_users", {});
      });
    }
  });
};

window.ownerResetPwd = function(uname) {
  var a = ADMINS.find(function(x) { return x.username === uname; }); if (!a) return;
  var newPwd = String(Math.floor(100000 + Math.random() * 900000));
  sheet({
    title: "🔑 Reset Password", subtitle: uname,
    fields: [
      { type: "info", value: "New password: <b style='font-size:22px;color:var(--gold-bright);letter-spacing:2px'>" + newPwd + "</b><br><small>Write this down and give to <b>" + esc(uname) + "</b></small>" }
    ],
    confirmText: "✅ Reset Password",
    onConfirm: function() {
      var updated = Object.assign({}, a, { passHash: hashPin(newPwd), password_changed_at: Date.now(), password_history: "[]" });
      sb.from("admins").upsert(denormA(updated)).then(function(res) {
        if (res.error) return toast(res.error.message, "error");
        ADMINS = ADMINS.map(function(x) { return x.username === uname ? updated : x; });
        toast("✅ Password reset for " + uname, "success");
        render("admin_users", {});
      });
    }
  });
};

window.editPerm = function(u) {
  var a = ADMINS.find(function(x) { return x.username === u; }); if (!a) return;
  if (a.role === "owner") return toast("Owner has all permissions", "warn");
  var m = document.createElement("div");
  m.className = "modal";
  var inner = '<div class="sheet"><h2>🛡 Permissions</h2><div class="s">' + esc(u) + '</div><div class="perm-grid">';
  ALL_PERMS.forEach(function(p) {
    inner += '<label class="perm-item"><input type="checkbox" id="pm_' + p + '"' + ((a.perms || []).indexOf(p) >= 0 ? " checked" : "") + '><span>' + PERM_LABELS[p] + '</span></label>';
  });
  inner += '</div><button class="btn" id="sv">Save Permissions</button><button class="btn dark" id="cx" style="margin-top:8px">Cancel</button></div>';
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
  confirmBox({ title: "Promote " + u + " to Owner?", message: "They will get full access.", yesText: "Promote",
    onYes: function() {
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
  confirmBox({ title: "Demote " + u + "?", yesText: "Demote",
    onYes: function() {
      var a = ADMINS.find(function(x) { return x.username === u; }); if (!a) return;
      var u2 = Object.assign({}, a, { role: "admin" });
      sb.from("admins").upsert(denormA(u2)).then(function(res) {
        if (res.error) return toast(res.error.message, "error");
        ADMINS = ADMINS.map(function(x) { return x.username === u ? u2 : x; });
        toast("Demoted", "warn"); render("admin_users", {});
      });
    } });
};

window.removeAdmin = function(u) {
  confirmBox({ title: "Remove " + u + "?", message: "They lose access immediately.", yesText: "Remove",
    onYes: function() {
      sb.from("admins").delete().eq("username", u).then(function(res) {
        if (res.error) return toast(res.error.message, "error");
        ADMINS = ADMINS.filter(function(x) { return x.username !== u; });
        toast("Removed", "success"); render("admin_users", {});
      });
    } });
};

/* ===================== NEW SALE ===================== */
R.newsale = function() {
  if (!bk) bk = { exp: null };
  var cards = EXP.map(function(x) {
    return '<div class="card click" onclick="pickE(\'' + x.id + '\')"><div style="font-weight:700">' + x.name + '</div><div style="color:var(--muted);font-size:12px;margin-top:4px">' + (x.fixed ? "₹" + x.fixed : "From ₹" + x.from) + '</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted)">← Floor</a><h1 style="margin-top:20px">New Sale</h1>' + cards + '</div></div>';
};

window.pickE = function(id) {
  var e = EXP.find(function(x) { return x.id === id; }); if (!e) return;
  sheet({ title: "New Sale", subtitle: e.name, fields: [{ id: "n", label: "Customer name", value: "Walk-in" }], onConfirm: function(v) {
    var total = e.fixed || 0;
    var s = { id: "YN" + Date.now().toString(36).toUpperCase().slice(-6), name: (v.n || "Walk-in").trim(), phone: "", expId: e.id, expName: e.name, items: [e.name], total: total, minutes: 1800, players: 1, method: "cash", paid: false, status: "pending", createdAt: Date.now(), customerId: null, isMembership: true };
    sb.from("sessions").insert(denormS(s)).then(function(res) {
      if (res.error) return toast(res.error.message, "error");
      SESS = [s].concat(SESS); bk = null; toast("Saved", "success"); go("payments");
    });
  } });
};

/* ===================== REALTIME + START ===================== */
function setupRealtime() {
  if (!sb) return;
  try { sb.removeAllChannels(); } catch(e) {}
  ["customers", "sessions", "requests", "admins"].forEach(function(t) {
    try {
      sb.channel("adm-" + t).on("postgres_changes", { event: "*", schema: "public", table: t }, function() {
        loadAll().then(function() { if (curR) render(curR, {}); });
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
