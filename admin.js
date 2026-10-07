/* YONDU ADMIN PANEL */

var curR = "", bk = null, tab = "dash";
var ALL_PERMS = ["floor","pay","requests","customers","menu","tournaments","reports","settings"];
var PERM_LABELS = { floor: "🏠 Live Floor", pay: "💳 Payments", requests: "🔔 Requests", customers: "👥 Customers", menu: "🍟 Menu", tournaments: "🏆 Tournaments", reports: "📊 Reports", settings: "⚙ Settings" };
var PASSWORD_MAX_AGE_DAYS = 90;
var PASSWORD_HISTORY_SIZE = 5;

function adminSession() { return DB.get("yondu_admin_session", null); }
function getMe() { var u = adminSession(); if (!u) return null; return ADMINS.find(function(x) { return x.username === u; }) || null; }
function isAdmin() { return !!getMe(); }
function can(p) { var me = getMe(); if (!me) return false; if (me.role === "owner") return true; return (me.perms || []).indexOf(p) >= 0; }
function isOwner() { var m = getMe(); return m && m.role === "owner"; }

function passwordAgeDays(a) { var changed = a.password_changed_at || a.createdAt || 0; if (!changed) return 0; return Math.floor((Date.now() - changed) / 86400000); }
function isPasswordExpired(a) { return passwordAgeDays(a) >= PASSWORD_MAX_AGE_DAYS; }
function checkPasswordHistory(newHash, historyJson) { var hist = []; try { hist = JSON.parse(historyJson || "[]"); } catch(e) {} return hist.indexOf(newHash) >= 0; }
function pushPasswordHistory(currentHash, historyJson) { var hist = []; try { hist = JSON.parse(historyJson || "[]"); } catch(e) {} hist.unshift(currentHash); hist = hist.slice(0, PASSWORD_HISTORY_SIZE); return JSON.stringify(hist); }

function toast(msg, type) {
  var colors = { success: "#22c55e", error: "#ef4444", info: "#22d3ee", warn: "#fb923c" };
  var el = document.createElement("div");
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);background:" + (colors[type] || colors.info) + ";color:#fff;padding:12px 22px;border-radius:12px;font-weight:800;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:14px;max-width:90%;text-align:center;transition:transform .3s cubic-bezier(.2,.9,.3,1.3)";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(0)"; }, 20);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(-100px)"; }, 2200);
  setTimeout(function() { el.remove(); }, 2700);
}

var _sheetOnConfirm = null;
function openSheet(opts) {
  var m = document.createElement("div");
  m.id = "ysheet"; m.className = "modal";
  var fieldsHTML = (opts.fields || []).map(function(f) {
    if (f.type === "info") return '<div class="notice gold" style="margin-bottom:12px">' + f.value + '</div>';
    if (f.type === "notice") return '<div class="notice ' + (f.color || "") + '" style="margin-bottom:12px">' + f.value + '</div>';
    if (f.type === "select") return '<label>' + f.label + '</label><select id="' + f.id + '">' + (f.options || []).map(function(o) { return '<option value="' + o.value + '"' + (o.value === f.value ? " selected" : "") + '>' + o.label + '</option>'; }).join("") + '</select>';
    if (f.type === "textarea") return '<label>' + f.label + '</label><textarea id="' + f.id + '" rows="3" placeholder="' + (f.placeholder || "") + '">' + (f.value || "") + '</textarea>';
    return '<label>' + f.label + '</label><input id="' + f.id + '" type="' + (f.type || "text") + '" value="' + (f.value || "") + '" placeholder="' + (f.placeholder || "") + '">';
  }).join("");
  m.innerHTML = '<div class="sheet"><h2>' + opts.title + '</h2>' + (opts.subtitle ? '<div class="s">' + opts.subtitle + '</div>' : "") + fieldsHTML + '<button class="btn ' + (opts.danger ? "danger" : "") + '" id="ysheet_ok" style="margin-top:8px">' + (opts.confirmText || "Save") + '</button><button class="btn dark" id="ysheet_cancel" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  _sheetOnConfirm = opts.onConfirm;
  m.querySelector("#ysheet_ok").onclick = function() {
    var vals = {};
    m.querySelectorAll("input, select, textarea").forEach(function(el) { if (el.id) vals[el.id] = el.value; });
    m.remove(); var cb = _sheetOnConfirm; _sheetOnConfirm = null;
    if (cb) cb(vals);
  };
  m.querySelector("#ysheet_cancel").onclick = function() { m.remove(); _sheetOnConfirm = null; };
  setTimeout(function() { var inp = m.querySelector("input:not([type=hidden]), select, textarea"); if (inp) inp.focus(); }, 60);
}

function confirmSheet(opts) {
  var m = document.createElement("div");
  m.id = "yconfirm"; m.className = "modal";
  m.innerHTML = '<div class="sheet"><h2>' + opts.title + '</h2>' + (opts.message ? '<div class="s" style="white-space:pre-line">' + opts.message + '</div>' : "") + '<button class="btn ' + (opts.danger ? "danger" : "") + '" id="yconf_yes">' + (opts.yesText || "Yes") + '</button><button class="btn dark" id="yconf_no" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  m.querySelector("#yconf_yes").onclick = function() { m.remove(); if (opts.onYes) opts.onYes(); };
  m.querySelector("#yconf_no").onclick = function() { m.remove(); };
}

function notifyAdmin(msg) {
  var el = document.createElement("div");
  el.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);background:linear-gradient(135deg,#c9a961,#e8d5a3);color:#111;padding:14px 24px;border-radius:12px;font-weight:800;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,.7);font-size:14px;max-width:90%;text-align:center;transition:transform .4s cubic-bezier(.2,.9,.3,1.3)";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(0)"; }, 20);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(-100px)"; }, 4000);
  setTimeout(function() { el.remove(); }, 4500);
  try { var ctx = new (window.AudioContext || window.webkitAudioContext)(); [880, 1320].forEach(function(freq, i) { var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = freq; osc.type = "sine"; var t = ctx.currentTime + i * 0.12; gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.25, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35); osc.start(t); osc.stop(t + 0.4); }); } catch(e) {}
  if ("Notification" in window && Notification.permission === "granted") { try { new Notification("Yondu Admin", { body: msg }); } catch(e) {} }
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
  var fn = R[r] || R.floor;
  if (app) app.innerHTML = fn(p);
  renderNav(r);
  if (R[r] && R[r].after) R[r].after(p);
}
function renderNav(r) {
  var nav = document.getElementById("nav");
  if (!isAdmin() || r === "login" || r === "claim_owner") { nav.style.display = "none"; return; }
  nav.style.display = "flex";
  var pendC = CUST.filter(function(c) { return !c.activated; }).length;
  var pendReq = REQ.filter(function(x) { return x.status === "pending"; }).length;
  var payC = SESS.filter(function(s) { return !s.paid && s.status !== "ended"; }).length;
  var links = "";
  if (can("floor")) links += '<a href="javascript:go(\'floor\')" class="' + (r === "floor" || r === "station" ? "on" : "") + '"><span class="ic">🏠</span>Floor</a>';
  if (can("pay")) links += '<a href="javascript:go(\'payments\')" class="' + (r === "payments" ? "on" : "") + '"><span class="ic">💳</span>Pay' + (payC ? '<span class="dot"></span>' : "") + '</a>';
  if (can("requests")) links += '<a href="javascript:go(\'requests\')" class="' + (r === "requests" ? "on" : "") + '"><span class="ic">🔔</span>Reqs' + ((pendReq + pendC) ? '<span class="dot"></span>' : "") + '</a>';
  if (can("customers")) links += '<a href="javascript:go(\'customers\')" class="' + (r === "customers" ? "on" : "") + '"><span class="ic">👥</span>People</a>';
  links += '<a href="javascript:go(\'more\')" class="' + (r === "more" || r.indexOf("admin_") === 0 || r === "me" ? "on" : "") + '"><span class="ic">⚙️</span>More</a>';
  nav.innerHTML = links;
}

R.denied = function() { return '<div class="screen"><div class="wrap"><div class="empty"><div class="big">🔒</div><div class="msg">ACCESS DENIED</div></div><button class="btn" style="max-width:280px;margin:20px auto 0" onclick="go(\'more\')">← Back</button></div></div>'; };

R.claim_owner = function() {
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto"><div style="text-align:center;margin-bottom:24px"><div class="brand-icon" style="margin:0 auto 14px;width:70px;height:70px"></div><h1 style="font-size:22px;text-align:center;color:var(--gold)">CLAIM OWNER</h1><p style="color:var(--muted);font-size:12px;text-align:center;margin-top:6px">First-time setup</p></div><div class="notice gold">👑 First admin becomes Owner with full control.</div><label>Username</label><input id="oau" placeholder="owner" autocomplete="off" style="text-transform:lowercase"><label>Password <span class="opt">min 6 chars</span></label><input id="oap" type="password" autocomplete="new-password"><label>Confirm Password</label><input id="oap2" type="password" autocomplete="new-password"><button class="btn" onclick="claimOwner()">Create Owner</button><button class="btn dark" style="margin-top:8px" onclick="window.location.href=\'index.html\'">← Back to App</button></div></div>';
};
window.claimOwner = function() {
  var u = document.getElementById("oau").value.trim().toLowerCase();
  var p = document.getElementById("oap").value;
  var p2 = document.getElementById("oap2").value;
  if (!u || u.length < 3) return toast("Username 3+", "error");
  if (!/^[a-z0-9_]+$/.test(u)) return toast("Letters, numbers, underscore only", "error");
  if (!p || p.length < 6) return toast("Password 6+", "error");
  if (p !== p2) return toast("Passwords don't match", "error");
  loadAll().then(function() {
    if (ADMINS.length) return toast("Owner already exists", "error");
    var newA = { username: u, passHash: hashPin(p), role: "owner", perms: ALL_PERMS.slice(), createdAt: Date.now(), password_changed_at: Date.now(), password_history: "[]" };
    ADMINS = [newA];
    saveAdmins(ADMINS).then(function() {
      DB.set("yondu_admin_session", u);
      toast("✅ Owner created!", "success");
      go("floor");
    });
  });
};

R.login = function() {
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto"><div style="text-align:center;margin-bottom:24px"><div class="brand-icon" style="margin:0 auto 14px;width:70px;height:70px"></div><h1 style="font-size:22px;text-align:center;color:var(--gold)">YONDU</h1><p style="color:var(--muted);font-size:12px;letter-spacing:3px;margin-top:4px">ADMIN PANEL</p></div><label>Username</label><input id="au" placeholder="username" autocomplete="username" style="text-transform:lowercase"><label>Password</label><input id="ap" type="password" placeholder="••••••" autocomplete="current-password"><button class="btn" style="margin-top:8px" onclick="doLogin()">Sign In</button><button class="btn dark" style="margin-top:8px" onclick="window.location.href=\'index.html\'">← Back to App</button></div></div>';
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
    if (isPasswordExpired(a)) { forcePasswordReset(a, true); return; }
    var age = passwordAgeDays(a);
    if (age >= 75) setTimeout(function() { toast("⚠ Password expires in " + (PASSWORD_MAX_AGE_DAYS - age) + " days", "warn"); }, 800);
    go("floor");
  });
};
window.doLogout = function() {
  confirmSheet({ title: "Sign Out?", message: "You'll need to log in again.", yesText: "Sign Out", danger: true, onYes: function() { DB.del("yondu_admin_session"); go("login"); } });
};

R.floor = function() {
  if (!can("floor")) return R.denied();
  var now = Date.now();
  var playing = SESS.filter(function(s) { return s.status === "playing"; });
  var pend = CUST.filter(function(c) { return !c.activated; }).length;
  var pendReq = REQ.filter(function(r) { return r.status === "pending"; }).length;
  var collect = SESS.filter(function(s) { return !s.paid && s.status !== "ended"; }).length;
  var today = new Date().setHours(0, 0, 0, 0);
  var todaySess = SESS.filter(function(s) { return s.createdAt >= today; });
  var todayRev = todaySess.reduce(function(t, s) { return t + (s.paid ? s.total : 0); }, 0);
  var busy = {};
  playing.forEach(function(s) { if (s.stationId) busy[s.stationId] = s; });
  var stations = STA.map(function(st) {
    var s = busy[st.id];
    if (s) {
      var l = s.end ? (s.end - now) : 0;
      var m = Math.max(0, Math.floor(l / 60000)); var sec = Math.max(0, Math.floor((l % 60000) / 1000));
      var cls = s.isMembership ? "" : (l < 5 * 60000 ? "over" : l < 15 * 60000 ? "warn" : "");
      var elapsed = s.isMembership && s.start ? Date.now() - s.start : 0;
      var eM = Math.floor(elapsed / 60000), eS = Math.floor((elapsed % 60000) / 1000);
      var display = s.isMembership ? String(eM).padStart(2, "0") + ":" + String(eS).padStart(2, "0") : String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
      return '<div class="station playing" onclick="go(\'station\',{id:\'' + st.id + '\'})"><div class="st-h"><div class="st-nm">' + st.name + '</div><span class="pill busy">' + (s.isMembership ? "🎫 MEMBERSHIP" : "● PLAYING") + '</span></div><div class="status">' + s.name + ' · ' + s.items.join(" · ") + '</div><div class="time ' + cls + '" data-s="' + s.id + '">' + display + '</div></div>';
    }
    return '<div class="station free" onclick="startAt(\'' + st.id + '\')"><div class="st-h"><div class="st-nm">' + st.name + '</div><span class="pill free">● FREE</span></div><div class="status">Ready · tap to start</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><div><h1 style="font-size:22px;margin:0">Live Floor</h1><p class="sub" style="margin:4px 0 0">' + playing.length + ' playing · ' + todaySess.length + ' today</p></div><button class="btn sm" onclick="go(\'newsale\')">+ Sale</button></div>' + ((pend + pendReq) > 0 ? '<div class="notice orange" onclick="go(\'requests\')" style="cursor:pointer">🔔 <b>' + pend + ' activation' + (pend !== 1 ? "s" : "") + '</b> · <b>' + pendReq + ' request' + (pendReq !== 1 ? "s" : "") + '</b> → tap to open</div>' : "") + '<div class="grid4" style="margin-bottom:16px"><div class="stat"><div class="v">₹' + todayRev + '</div><div class="l">Today ₹</div></div><div class="stat"><div class="v" style="color:var(--cyan)">' + playing.length + '</div><div class="l">Playing</div></div><div class="stat"><div class="v" style="color:var(--pink)">' + collect + '</div><div class="l">Collect</div></div><div class="stat"><div class="v" style="color:var(--green)">' + pend + '</div><div class="l">Pending</div></div></div><div class="sec-label">Stations</div>' + stations + '</div></div>';
};
R.floor.after = function() {
  setInterval(function() {
    if (curR !== "floor") return;
    var now = Date.now();
    document.querySelectorAll("[data-s]").forEach(function(el) {
      var s = getSess(el.dataset.s);
      if (!s) return;
      if (s.isMembership && s.start) {
        var p = now - s.start;
        el.textContent = String(Math.floor(p / 60000)).padStart(2, "0") + ":" + String(Math.floor((p % 60000) / 1000)).padStart(2, "0");
        el.className = "time";
      } else if (s.end) {
        var l = s.end - now;
        if (l <= 0) { el.textContent = "00:00"; el.className = "time over"; return; }
        el.textContent = String(Math.floor(l / 60000)).padStart(2, "0") + ":" + String(Math.floor((l % 60000) / 1000)).padStart(2, "0");
        el.className = "time" + (l < 5 * 60000 ? " over" : l < 15 * 60000 ? " warn" : "");
      }
    });
  }, 1000);
};

window.startAt = function(stId) {
  loadAll().then(function() {
    var pend = SESS.filter(function(s) { return !s.stationId && s.status !== "ended" && s.paid && s.expId !== "snacks"; });
    var pendB = SESS.filter(function(s) { return !s.stationId && s.status === "pending" && s.expId !== "snacks"; });
    var all = pend.concat(pendB);
    if (!all.length) { toast("No pending sessions", "error"); return; }
    var options = all.slice(0, 20).map(function(s) { return { value: s.id, label: s.id + " — " + s.name + " (" + (s.paid ? "PAID" : "unpaid") + ")" }; });
    var st = STA.find(function(x) { return x.id === stId; });
    openSheet({
      title: "▶ Start Session", subtitle: "Station: " + (st ? st.name : ""),
      fields: [{ id: "sessid", label: "Pick a pending booking", type: "select", options: options, value: options[0].value }],
      confirmText: "▶ Start Now",
      onConfirm: function(vals) {
        var s = all.find(function(x) { return x.id === vals.sessid; });
        if (!s) return;
        if (s.status === "pending") s.paid = true;
        s.status = "playing"; s.stationId = stId; s.start = Date.now();
        s.end = Date.now() + (s.minutes || 60) * 60000;
        upsertS(s);
        toast("✅ Started at " + st.name, "success");
        go("station", { id: stId });
      }
    });
  });
};

R.station = function(p) {
  var st = STA.find(function(x) { return x.id === p.id; });
  var s = SESS.find(function(x) { return x.stationId === p.id && x.status === "playing"; });
  if (!st) return '<div class="screen"><div class="wrap"><h2>Not found</h2><button class="btn" onclick="go(\'floor\')">Back</button></div></div>';
  if (!s) return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted);font-size:13px">← Floor</a><h1 style="margin-top:20px">' + st.name + '</h1><div class="notice">Station free</div><button class="btn" onclick="go(\'floor\')">Back</button></div></div>';
  var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted);font-size:13px">← Floor</a><div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;margin-bottom:10px"><div><h1 style="font-size:22px;margin:0">' + st.name + '</h1><p class="sub" style="margin:4px 0 0">' + s.name + (c ? " · " + c.id : "") + '</p></div><span class="pill busy">' + (s.isMembership ? "🎫 MEMBERSHIP" : "● PLAYING") + '</span></div><div class="card" style="text-align:center;padding:24px"><div style="color:var(--gold);font-size:11px;letter-spacing:2px;font-weight:700">' + (s.isMembership ? "MEMBERSHIP · TIME PLAYED" : "TIME REMAINING") + '</div><div class="timer-huge" id="ast">--:--</div></div>' + (c ? '<div class="card" style="display:flex;gap:12px;align-items:center;padding:12px">' + (c.profilePic ? '<div class="avatar" style="background-image:url(\'' + c.profilePic + '\')"></div>' : '<div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div>') + '<div style="flex:1"><div style="font-weight:700">' + c.name + '</div><div style="color:var(--cyan);font-size:13px;font-weight:700;letter-spacing:1.5px">' + c.id + '</div></div><div style="text-align:right"><div style="color:var(--gold);font-size:10px;font-weight:700">POINTS</div><div style="font-size:20px;font-weight:800;color:var(--gold-bright)">' + c.points + '</div></div></div>' : "") + '<div class="sec-label">Items</div><div class="card">' + (s.items || []).map(function(i) { return '<div style="padding:4px 0;font-size:14px;color:#cbd5e1">' + i + '</div>'; }).join("") + (s.total > 0 ? '<div style="border-top:1px solid var(--border);margin-top:8px;padding-top:10px;display:flex;justify-content:space-between;font-weight:800"><span>Total</span><span style="color:var(--gold-bright)">₹' + s.total + '</span></div>' : "") + '</div><div class="sec-label">Actions</div><button class="btn dark" onclick="aAdd(\'' + s.id + '\')">🍟 Add Snacks</button>' + (!s.isMembership ? '<button class="btn dark" style="margin-top:8px" onclick="aExt(\'' + s.id + '\')">⏱ Add Time</button>' : "") + '<button class="btn orange" style="margin-top:8px" onclick="aEnd(\'' + s.id + '\')">⏹ ' + (s.isMembership ? "Stop & Deduct" : "End") + '</button><button class="btn danger" style="margin-top:8px;background:#7f1d1d" onclick="delSess(\'' + s.id + '\')">🗑 Delete</button></div></div>';
};
R.station.after = function(p) {
  var s = SESS.find(function(x) { return x.stationId === p.id && x.status === "playing"; });
  if (!s) return;
  var el = document.getElementById("ast");
  if (!el) return;
  var tick = function() {
    if (s.isMembership && s.start) { var p2 = Date.now() - s.start; el.textContent = String(Math.floor(p2 / 60000)).padStart(2, "0") + ":" + String(Math.floor((p2 % 60000) / 1000)).padStart(2, "0"); el.className = "timer-huge"; return; }
    if (!s.end) return;
    var l = s.end - Date.now();
    if (l <= 0) { el.textContent = "00:00"; el.className = "timer-huge over"; return; }
    el.textContent = String(Math.floor(l / 60000)).padStart(2, "0") + ":" + String(Math.floor((l % 60000) / 1000)).padStart(2, "0");
    el.className = "timer-huge" + (l < 5 * 60000 ? " over" : l < 15 * 60000 ? " warn" : "");
  };
  tick(); setInterval(tick, 1000);
};

window.aAdd = function(sid) {
  var menuOptions = ADD.map(function(a) { return { value: a.id, label: a.name + " — ₹" + a.price }; });
  menuOptions.push({ value: "__custom", label: "✏️ Custom item…" });
  openSheet({
    title: "🍟 Add Snacks", subtitle: "Pick from menu or enter custom",
    fields: [
      { id: "pick", label: "Menu item", type: "select", options: menuOptions, value: menuOptions[0].value },
      { id: "cname", label: "Custom name (if custom)", type: "text", placeholder: "e.g. Extra samosa" },
      { id: "cprice", label: "Custom price ₹ (if custom)", type: "number", placeholder: "20" },
      { id: "qty", label: "Quantity", type: "number", value: "1" }
    ],
    confirmText: "Add to Bill",
    onConfirm: function(v) {
      var qty = Math.max(1, parseInt(v.qty) || 1); var name, price;
      if (v.pick === "__custom") { name = (v.cname || "").trim(); price = parseInt(v.cprice) || 0; if (!name || !price) return toast("Enter custom name & price", "error"); }
      else { var a = ADD.find(function(x) { return x.id === v.pick; }); if (!a) return; name = a.name; price = a.price; }
      loadAll().then(function() {
        var s2 = getSess(sid); if (!s2) return;
        for (var i = 0; i < qty; i++) s2.items.push(name);
        s2.total += price * qty; upsertS(s2);
        toast("✅ Added " + qty + "× " + name, "success");
        render("station", { id: s2.stationId });
      });
    }
  });
};

window.aExt = function(sid) {
  openSheet({
    title: "⏱ Add Time", subtitle: "Extend the session",
    fields: [
      { id: "min", label: "Minutes to add", type: "number", value: "30" },
      { id: "rate", label: "Rate ₹ (per player)", type: "number", value: "100" },
      { id: "pl", label: "Players", type: "number", value: "1" }
    ],
    confirmText: "Add Time",
    onConfirm: function(v) {
      var add = parseInt(v.min) || 0; if (!add) return toast("Enter minutes", "error");
      var rate = parseInt(v.rate) || 0; var pl = parseInt(v.pl) || 1; var amt = rate * pl;
      loadAll().then(function() {
        var s2 = getSess(sid); if (!s2) return;
        s2.end = Math.max(Date.now(), s2.end || Date.now()) + add * 60000;
        s2.minutes = (s2.minutes || 0) + add; s2.total += amt; upsertS(s2);
        toast("✅ +" + add + "min · ₹" + amt, "success");
        render("station", { id: s2.stationId });
      });
    }
  });
};

window.aEnd = function(sid) {
  loadAll().then(function() {
    var s2 = getSess(sid); if (!s2) return;
    var played = Math.max(0, Math.floor((Date.now() - (s2.start || Date.now())) / 60000));
    confirmSheet({ title: "End Session?", message: "Played: " + played + " min\nTotal: ₹" + s2.total, yesText: "⏹ End Session", danger: true,
      onYes: function() { s2.status = "ended"; upsertS(s2); toast("✅ Session ended", "success"); go("floor"); } });
  });
};
window.delSess = function(sid) {
  confirmSheet({ title: "Delete Session?", message: "This cannot be undone.", yesText: "Delete", danger: true,
    onYes: function() { loadAll().then(function() { saveS(SESS.filter(function(x) { return x.id !== sid; })); toast("🗑 Deleted", "success"); go("floor"); }); } });
};

R.payments = function() {
  if (!can("pay")) return R.denied();
  var up = SESS.filter(function(s) { return !s.paid && s.status !== "ended" && !s.stationId; });
  var col = SESS.filter(function(s) { return !s.paid && s.status !== "ended" && s.stationId; });
  var all = col.concat(up);
  var cards = all.length ? all.map(function(s) {
    var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
    return '<div class="card"' + (s.stationId && !s.paid ? ' style="border:2px solid var(--orange);background:#1a1207"' : "") + '><div style="display:flex;justify-content:space-between;margin-bottom:8px"><div><div style="font-weight:800;font-size:15px">' + s.name + '</div>' + (c ? '<div style="color:var(--cyan);font-size:12px;font-weight:700;letter-spacing:1.5px;margin-top:2px">' + c.id + '</div>' : "") + '<div style="color:var(--muted);font-size:13px;margin-top:4px">' + s.items.join(" · ") + '</div></div><span class="badge ' + s.method + '">' + s.method.toUpperCase() + '</span></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><div><div style="font-size:24px;font-weight:800;color:var(--gold-bright)">₹' + s.total + '</div></div><div style="display:flex;gap:6px"><button class="btn danger xs" onclick="delSess(\'' + s.id + '\')">🗑</button><button class="btn sm" onclick="collect(\'' + s.id + '\')">Collect</button></div></div></div>';
  }).join("") : '<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:22px">Payments</h1><p class="sub">Confirm cash → assign station</p>' + (col.length ? '<div class="notice orange">⚠ <b>' + col.length + '</b> playing but unpaid</div>' : "") + cards + '</div></div>';
};
window.collect = function(sid) {
  var s = getSess(sid); if (!s) return;
  var c = s.customerId ? CUST.find(function(x) { return x.id === s.customerId; }) : null;
  openSheet({
    title: "💰 Collect Payment", subtitle: s.name + " · " + s.items.join(", "),
    fields: [
      { type: "info", value: "Total: <b style='color:var(--gold-bright);font-size:20px'>₹" + s.total + "</b>" + (c ? "<br>Customer points: <b>" + c.points + "</b>" : "") },
      { id: "method", label: "Payment method", type: "select", options: [
        { value: "cash", label: "💵 Cash" }, { value: "upi", label: "📱 UPI" },
        { value: "points", label: "🎁 Points" + (c ? " (" + c.points + " available)" : " (no customer)") }
      ], value: "cash" }
    ],
    confirmText: "✅ Confirm Payment",
    onConfirm: function(v) {
      var m = v.method; var usePoints = m === "points";
      if (usePoints) { if (!c) return toast("No customer linked", "error"); if (c.points < s.total) return toast("Not enough points", "error"); }
      loadAll().then(function() {
        var s2 = getSess(sid); if (!s2) return;
        if (usePoints && c) { c.points -= s2.total; s2.method = "points"; var arr = CUST.slice(); var i = arr.findIndex(function(x) { return x.id === c.id; }); if (i >= 0) arr[i] = c; saveC(arr); }
        else { s2.method = m; }
        s2.paid = true;
        if (!usePoints && s2.customerId) {
          var c2 = CUST.find(function(x) { return x.id === s2.customerId; });
          if (c2) {
            var earned = Math.floor(s2.total / RR);
            c2.points = Math.min(POINTS_MAX, (c2.points || 0) + earned);
            c2.pointsSpent = (c2.pointsSpent || 0) + earned;
            c2.totalSpent += s2.total; c2.visits += 1; s2.pointsEarned = earned;
            var arr2 = CUST.slice(); var i2 = arr2.findIndex(function(x) { return x.id === c2.id; }); if (i2 >= 0) arr2[i2] = c2; saveC(arr2);
          }
        }
        upsertS(s2);
        toast("✅ Collected ₹" + s2.total, "success");
        render("payments", {});
      });
    }
  });
};

R.requests = function() {
  if (!can("requests")) return R.denied();
  var pendingReqs = REQ.filter(function(r) { return r.status === "pending"; });
  var pendingAct = CUST.filter(function(c) { return !c.activated; });
  var actHTML = pendingAct.length ? '<div class="sec-label urgent">⏳ Signups (' + pendingAct.length + ')</div>' + pendingAct.map(function(c) {
    return '<div class="card" style="border-left:4px solid var(--orange);padding:14px"><div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' + (c.profilePic ? '<div class="avatar" style="background-image:url(\'' + c.profilePic + '\')"></div>' : '<div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div>') + '<div style="flex:1"><div style="font-weight:700">' + c.name + '</div><div style="color:var(--cyan);font-size:15px;font-weight:800;letter-spacing:2px;margin-top:2px;font-family:\'Courier New\',monospace">' + c.id + '</div></div></div><div style="display:flex;gap:8px"><button class="btn green sm" style="flex:1" onclick="activateCust(\'' + c.id + '\')">✅ Activate</button><button class="btn danger sm" onclick="deleteCust(\'' + c.id + '\')">🗑</button></div></div>';
  }).join("") : "";
  var reqHTML = pendingReqs.length ? '<div class="sec-label urgent">🔔 Requests (' + pendingReqs.length + ')</div>' + pendingReqs.map(function(r) {
    return '<div class="card" style="border-left:4px solid ' + (r.type === "snack" ? "var(--pink)" : "var(--orange)") + '"><div style="font-size:10px;color:' + (r.type === "snack" ? "var(--pink)" : "var(--orange)") + ';font-weight:800;letter-spacing:1.5px">' + (r.type === "snack" ? "🍟 SNACK" : "📋 REQUEST") + '</div><div style="font-weight:700;font-size:15px;margin-top:6px">' + r.customerName + '</div><div style="color:var(--muted);font-size:13px;margin:8px 0">' + (r.items || []).join(" · ") + '</div><div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border)"><div><div style="font-size:20px;font-weight:800;color:var(--gold-bright)">₹' + r.total + '</div></div><div style="display:flex;gap:6px"><button class="btn danger xs" onclick="rejectReq(\'' + r.id + '\')">✕</button><button class="btn sm" onclick="approveReq(\'' + r.id + '\')">Approve</button></div></div></div>';
  }).join("") : "";
  return '<div class="screen"><div class="wrap"><h1 style="font-size:22px">Requests</h1><p class="sub">Waiting for you</p>' + ((!pendingReqs.length && !pendingAct.length) ? '<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>' : "") + actHTML + reqHTML + '</div></div>';
};
window.activateCust = function(cid) {
  loadAll().then(function() {
    var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
    c.activated = true; c.points = (c.points || 0) + 50; c.credit = (c.credit || 0) + 30;
    var arr = CUST.slice(); var i = arr.findIndex(function(x) { return x.id === cid; }); if (i >= 0) arr[i] = c; saveC(arr);
    toast("✅ " + c.name + " activated", "success");
    render(curR, {});
  });
};
window.deleteCust = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; });
  confirmSheet({ title: "Delete Customer?", message: "Delete " + (c ? c.name : "this customer") + "?\nThis cannot be undone.", yesText: "Delete", danger: true,
    onYes: function() { loadAll().then(function() { saveC(CUST.filter(function(x) { return x.id !== cid; })); toast("🗑 Deleted", "success"); render("requests", {}); }); } });
};

window.approveReq = function(rid) {
  var r2 = REQ.find(function(x) { return x.id === rid; });
  if (!r2) return;
  var c = CUST.find(function(x) { return x.id === r2.customerId; });
  var earnUpdate = null;
  if (r2.type === "snack" && c) {
    var earned = Math.floor(r2.total / RR);
    earnUpdate = { points: Math.min(POINTS_MAX, (c.points || 0) + earned), total_spent: (c.totalSpent || 0) + r2.total };
  }
  var reqUpdate = sb.from("requests").update({ status: "approved", processed_at: Date.now() }).eq("id", rid);
  var custUpdate = earnUpdate ? sb.from("customers").update(earnUpdate).eq("id", c.id) : Promise.resolve();
  Promise.all([reqUpdate, custUpdate]).then(function(results) {
    var err = results.find(function(r) { return r && r.error; });
    if (err) { toast("❌ " + err.error.message, "error"); return; }
    r2.status = "approved";
    r2.processedAt = Date.now();
    toast("✅ Approved", "success");
    render("requests", {});
  }).catch(function(e) { toast("❌ " + e.message, "error"); });
};

window.rejectReq = function(rid) {
  confirmSheet({ title: "Reject Request?", yesText: "Reject", danger: true,
    onYes: function() {
      sb.from("requests").update({ status: "rejected", processed_at: Date.now() }).eq("id", rid).then(function(res) {
        if (res.error) { toast("❌ " + res.error.message, "error"); return; }
        var r2 = REQ.find(function(x) { return x.id === rid; });
        if (r2) { r2.status = "rejected"; r2.processedAt = Date.now(); }
        toast("Rejected", "warn");
        render("requests", {});
      });
    }
  });
};

R.customers = function() {
  if (!can("customers")) return R.denied();
  var cs = CUST.slice().sort(function(a, b) { return b.totalSpent - a.totalSpent; });
  var listHTML = cs.length ? cs.map(function(c) {
    var badge = !c.activated ? '<span class="badge pending">Pending</span>' : c.banned ? '<span class="badge banned">Banned</span>' : c.vip ? '<span class="badge vip">VIP</span>' : '<span class="badge open">Active</span>';
    return '<div class="card" style="padding:14px"><div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">' + (c.profilePic ? '<div class="avatar" style="background-image:url(\'' + c.profilePic + '\')"></div>' : '<div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div>') + '<div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="font-weight:700;font-size:15px">' + c.name + '</div>' + badge + '</div><div style="color:var(--cyan);font-size:14px;font-weight:800;letter-spacing:2px;font-family:\'Courier New\',monospace;margin-top:3px">' + c.id + '</div></div></div><div class="grid4" style="gap:8px;margin-bottom:10px"><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">POINTS</div><div style="font-weight:800;color:var(--gold-bright);margin-top:2px">' + c.points + '</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">SPENT</div><div style="font-weight:800;margin-top:2px">₹' + c.totalSpent + '</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">VISITS</div><div style="font-weight:800;margin-top:2px">' + c.visits + '</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">HOURS</div><div style="font-weight:800;color:var(--cyan);margin-top:2px">' + (c.ps5Hours || 0) + '·' + (c.raceHours || 0) + '</div></div></div><div style="display:flex;gap:6px;flex-wrap:wrap">' + (!c.activated ? '<button class="btn green xs" onclick="activateCust(\'' + c.id + '\')">✅ Activate</button>' : "") + '<button class="btn dark xs" onclick="editPts(\'' + c.id + '\')">💰 Points</button><button class="btn dark xs" onclick="editHrs(\'' + c.id + '\')">🎫 Hours</button><button class="btn dark xs" onclick="resetPin(\'' + c.id + '\')">🔑 PIN</button><button class="btn dark xs" onclick="togVIP(\'' + c.id + '\')">' + (c.vip ? "Remove VIP" : "⭐ VIP") + '</button><button class="btn ' + (c.banned ? "dark" : "danger") + ' xs" onclick="togBan(\'' + c.id + '\')">' + (c.banned ? "Unban" : "🚫") + '</button></div></div>';
  }).join("") : '<div class="empty"><div class="big">👥</div><div class="msg">NO CUSTOMERS</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:22px">Customers</h1><p class="sub">' + cs.length + ' total</p><input placeholder="🔍 Search name or number" oninput="filtC(this.value)"><div id="ccl" style="color:var(--muted);font-size:12px;font-weight:700;margin-bottom:12px">' + cs.length + ' shown</div><div id="cl">' + listHTML + '</div></div></div>';
};
window.filtC = function(q) { var s = q.toLowerCase().trim(); var sh = 0; document.querySelectorAll("#cl .card").forEach(function(el) { var txt = el.textContent.toLowerCase(); var m = !s || txt.indexOf(s) >= 0; el.style.display = m ? "" : "none"; if (m) sh++; }); document.getElementById("ccl").textContent = sh + " shown"; };
window.editPts = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  openSheet({ title: "💰 Edit Points", subtitle: c.name + " · #" + c.id,
    fields: [{ id: "pts", label: "Points", type: "number", value: String(c.points || 0) }],
    confirmText: "Save Points",
    onConfirm: function(v) {
      var n = parseInt(v.pts); if (isNaN(n)) return toast("Enter a number", "error");
      loadAll().then(function() { var c2 = CUST.find(function(x) { return x.id === cid; }); if (!c2) return; c2.points = n; var arr = CUST.slice(); var i = arr.findIndex(function(x) { return x.id === cid; }); if (i >= 0) arr[i] = c2; saveC(arr); toast("✅ Points updated", "success"); render("customers", {}); });
    }
  });
};
window.editHrs = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  openSheet({ title: "🎫 Membership Hours", subtitle: c.name,
    fields: [{ id: "ps5", label: "PS5 hours", type: "number", value: String(c.ps5Hours || 0) }, { id: "race", label: "Racing hours", type: "number", value: String(c.raceHours || 0) }],
    confirmText: "Save Hours",
    onConfirm: function(v) {
      var p = parseFloat(v.ps5) || 0; var r = parseFloat(v.race) || 0;
      loadAll().then(function() { var c2 = CUST.find(function(x) { return x.id === cid; }); if (!c2) return; c2.ps5Hours = Math.max(0, p); c2.raceHours = Math.max(0, r); var arr = CUST.slice(); var i = arr.findIndex(function(x) { return x.id === cid; }); if (i >= 0) arr[i] = c2; saveC(arr); toast("✅ Hours updated", "success"); render("customers", {}); });
    }
  });
};
window.resetPin = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  var p = String(Math.floor(1000 + Math.random() * 9000));
  openSheet({ title: "🔑 Reset PIN", subtitle: c.name,
    fields: [{ type: "info", value: "New PIN: <b style='font-size:22px;color:var(--gold-bright);letter-spacing:4px'>" + p + "</b><br><small>Write this down and give to customer</small>" }],
    confirmText: "✅ Confirm Reset",
    onConfirm: function() {
      loadAll().then(function() { var c2 = CUST.find(function(x) { return x.id === cid; }); if (!c2) return; c2.pinHash = hashPin(p); var arr = CUST.slice(); var i = arr.findIndex(function(x) { return x.id === cid; }); if (i >= 0) arr[i] = c2; saveC(arr); toast("✅ New PIN: " + p, "success"); render("customers", {}); });
    }
  });
};
window.togVIP = function(cid) { loadAll().then(function() { var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return; c.vip = !c.vip; var arr = CUST.slice(); var i = arr.findIndex(function(x) { return x.id === cid; }); if (i >= 0) arr[i] = c; saveC(arr); toast(c.vip ? "⭐ VIP added" : "VIP removed", "success"); render("customers", {}); }); };
window.togBan = function(cid) {
  var c = CUST.find(function(x) { return x.id === cid; }); if (!c) return;
  confirmSheet({ title: (c.banned ? "Unban " : "Ban ") + c.name + "?", yesText: c.banned ? "Unban" : "Ban", danger: !c.banned,
    onYes: function() { loadAll().then(function() { var c2 = CUST.find(function(x) { return x.id === cid; }); if (!c2) return; c2.banned = !c2.banned; var arr = CUST.slice(); var i = arr.findIndex(function(x) { return x.id === cid; }); if (i >= 0) arr[i] = c2; saveC(arr); toast(c2.banned ? "🚫 Banned" : "✅ Unbanned", "success"); render("customers", {}); }); } });
};

R.more = function() {
  var me = getMe();
  var cards = "";
  if (can("menu")) cards += '<div class="card click" onclick="go(\'menu\')"><div style="font-weight:700">🍟 Menu Manager</div><div class="sub" style="margin:4px 0 0;font-size:13px">' + ADD.length + ' items</div></div>';
  if (can("tournaments")) cards += '<div class="card click" onclick="go(\'tourneys\')"><div style="font-weight:700">🏆 Tournaments</div><div class="sub" style="margin:4px 0 0;font-size:13px">' + TOURN.length + ' events</div></div>';
  if (can("reports")) cards += '<div class="card click" onclick="go(\'reports\')"><div style="font-weight:700">📊 Reports</div></div>';
  if (can("settings")) cards += '<div class="card click" onclick="go(\'settings\')"><div style="font-weight:700">⚙ Settings</div><div class="sub" style="margin:4px 0 0;font-size:13px">Café info · prices · loyalty</div></div>';
  if (isOwner()) cards += '<div class="card click" onclick="go(\'admin_users\')" style="border:2px solid var(--gold)"><div style="font-weight:700">👑 Staff Accounts</div><div class="sub" style="margin:4px 0 0;font-size:13px">Add · remove · permissions (' + ADMINS.length + ')</div></div>';
  cards += '<div class="card click" onclick="go(\'me\')"><div style="font-weight:700">🧑‍💼 My Account</div><div class="sub" style="margin:4px 0 0;font-size:13px">Password · permissions · profile</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:22px">More</h1><p class="sub">' + (me && me.role === "owner" ? "👑 Owner" : "Admin") + ' · ' + (me ? me.username : "") + '</p>' + cards + '<button class="btn dark" style="margin-top:20px" onclick="window.location.href=\'index.html\'">← Back to Customer App</button><button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button></div></div>';
};

R.menu = function() {
  if (!can("menu")) return R.denied();
  var cards = ADD.map(function(a) {
    return '<div class="snack-row"><div class="snack-photo">🍽️</div><div class="snack-info"><div class="snack-name">' + a.name + '</div><div class="snack-sub">₹' + a.price + (a.points_price ? " · " + a.points_price + " pts" : "") + '</div></div><div style="display:flex;gap:6px"><button class="btn dark xs" onclick="editItem(\'' + a.id + '\')">✏</button><button class="btn danger xs" onclick="delItem(\'' + a.id + '\')">✕</button></div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted);font-size:13px">← More</a><h1 style="margin-top:20px">Menu Manager</h1><p class="sub">' + ADD.length + ' items</p><button class="btn" onclick="addItem()">+ Add Item</button><div style="margin-top:16px">' + cards + '</div></div></div>';
};
window.addItem = function() {
  openSheet({ title: "➕ Add Item",
    fields: [{ id: "name", label: "Item name", type: "text", placeholder: "e.g. Mojito" }, { id: "price", label: "Price ₹", type: "number", placeholder: "80" }, { id: "pts", label: "Points price", type: "number", placeholder: "same as ₹" }],
    confirmText: "Create Item",
    onConfirm: function(v) {
      var n = (v.name || "").trim(); if (!n) return toast("Enter a name", "error");
      var p = parseInt(v.price) || 0; if (!p) return toast("Enter a price", "error");
      var pp = parseInt(v.pts) || p;
      loadAll().then(function() { var id = "i" + Date.now().toString(36); var arr = ADD.concat([{ id: id, name: n, price: p, points_price: pp, photo: "" }]); var old = ADD; ADD = arr; syncTable("addons", arr, old, function(r) { return { id: r.id, name: r.name, price: r.price, points_price: r.points_price || 0, photo: r.photo || "" }; }); toast("✅ Added " + n, "success"); render("menu", {}); });
    }
  });
};
window.editItem = function(id) {
  var a = ADD.find(function(x) { return x.id === id; }); if (!a) return;
  openSheet({ title: "✏ Edit Item",
    fields: [{ id: "name", label: "Name", type: "text", value: a.name }, { id: "price", label: "Price ₹", type: "number", value: String(a.price) }, { id: "pts", label: "Points price", type: "number", value: String(a.points_price || a.price) }],
    confirmText: "Save Changes",
    onConfirm: function(v) {
      var n = (v.name || "").trim(); if (!n) return toast("Enter a name", "error");
      var p = parseInt(v.price) || 0; if (!p) return toast("Enter a price", "error");
      var pp = parseInt(v.pts) || p;
      loadAll().then(function() { var arr = ADD.map(function(x) { return x.id === id ? Object.assign({}, x, { name: n, price: p, points_price: pp }) : x; }); var old = ADD; ADD = arr; syncTable("addons", arr, old, function(r) { return { id: r.id, name: r.name, price: r.price, points_price: r.points_price || 0, photo: r.photo || "" }; }); toast("✅ Saved", "success"); render("menu", {}); });
    }
  });
};
window.delItem = function(id) {
  var a = ADD.find(function(x) { return x.id === id; }); if (!a) return;
  confirmSheet({ title: "Delete " + a.name + "?", yesText: "Delete", danger: true,
    onYes: function() { loadAll().then(function() { var arr = ADD.filter(function(x) { return x.id !== id; }); var old = ADD; ADD = arr; syncTable("addons", arr, old, function(r) { return { id: r.id, name: r.name, price: r.price, points_price: r.points_price || 0, photo: r.photo || "" }; }); toast("🗑 Deleted", "success"); render("menu", {}); }); } });
};

R.tourneys = function() {
  if (!can("tournaments")) return R.denied();
  var cards = TOURN.length ? TOURN.map(function(t) {
    var players = t.players || [];
    return '<div class="card click" onclick="go(\'tdetail\',{id:\'' + t.id + '\'})"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><div style="font-weight:800">' + (t.banner || "🏆") + ' ' + t.name + '</div><span class="badge ' + t.status + '">' + t.status.toUpperCase() + '</span></div><div style="color:var(--muted);font-size:12px">' + t.game + ' · ' + (t.date || "") + ' ' + fmtTime(t.time) + '</div><div style="color:var(--cyan);font-size:12px;margin-top:4px">👥 ' + players.length + '/' + (t.maxPlayers || 16) + '</div></div>';
  }).join("") : '<div class="empty"><div class="big">🏆</div><div class="msg">NONE</div></div>';
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted);font-size:13px">← More</a><h1 style="margin-top:20px">Tournaments</h1><button class="btn" onclick="createTourney()">+ New</button><div style="margin-top:16px">' + cards + '</div></div></div>';
};
window.createTourney = function() {
  var today = new Date().toISOString().slice(0, 10);
  openSheet({
    title: "🏆 New Tournament",
    fields: [
      { id: "name", label: "Tournament name", type: "text", placeholder: "e.g. FIFA Night" },
      { id: "game", label: "Game", type: "text", value: "FIFA 24" },
      { id: "date", label: "Date", type: "date", value: today },
      { id: "time", label: "Time", type: "time", value: "18:00" },
      { id: "fee", label: "Entry fee ₹", type: "number", value: "500" },
      { id: "maxp", label: "Max players", type: "number", value: "16" }
    ],
    confirmText: "Create Tournament",
    onConfirm: function(v) {
      var n = (v.name || "").trim(); if (!n) return toast("Enter tournament name", "error");
      var g = (v.game || "").trim(); if (!g) return toast("Enter game", "error");
      loadAll().then(function() {
        var t = { id: newTID(), name: n, game: g, date: v.date || today, time: v.time || "18:00", entryFee: parseInt(v.fee) || 0, maxPlayers: parseInt(v.maxp) || 16, winnersCount: 3, banner: "🏆", bannerPic: "", description: "", prize1: "", prize2: "", prize3: "", prize4: "", rules: "", status: "open", players: [], bracket: [], winners: [], winner: null, createdAt: Date.now() };
        var arr = [t].concat(TOURN); var old = TOURN; TOURN = arr;
        syncTable("tournaments", arr, old, denormT);
        toast("✅ Tournament created", "success");
        render("tourneys", {});
      });
    }
  });
};
R.tdetail = function(p) {
  var t = getTid(p.id);
  if (!t) return '<div class="screen"><div class="wrap"><h2>Not found</h2></div></div>';
  var players = t.players || [];
  var playerHTML = players.length ? players.map(function(pl) {
    return '<div class="row"><div class="row-info"><div class="row-title">#' + pl.id + ' ' + pl.name + '</div></div>' + (pl.paid ? '<span class="badge open">Paid</span>' : '<button class="btn xs" onclick="markPaidT(\'' + t.id + '\',\'' + pl.id + '\')">Collect</button>') + '</div>';
  }).join("") : '<div class="notice">No players</div>';
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'tourneys\')" style="color:var(--muted);font-size:13px">← Tournaments</a><h1 style="margin-top:20px">' + t.name + '</h1><p class="sub">' + t.game + '</p><div class="sec-label">Players (' + players.length + ')</div>' + playerHTML + '<div class="sec-label">Actions</div><button class="btn danger" onclick="delTourney(\'' + t.id + '\')">Delete Tournament</button></div></div>';
};
window.markPaidT = function(tid, pid) {
  loadAll().then(function() {
    var t = getTid(tid); if (!t) return;
    var pl = (t.players || []).find(function(x) { return x.id === pid; }); if (!pl) return;
    pl.paid = true; upsertT(t);
    toast("✅ Collected ₹" + t.entryFee, "success");
    render("tdetail", { id: tid });
  });
};
window.delTourney = function(tid) {
  confirmSheet({ title: "Delete Tournament?", message: "This cannot be undone.", yesText: "Delete", danger: true,
    onYes: function() { loadAll().then(function() { saveT(TOURN.filter(function(t) { return t.id !== tid; })); toast("🗑 Deleted", "success"); go("tourneys"); }); } });
};

R.reports = function() {
  if (!can("reports")) return R.denied();
  var all = SESS;
  var tr = all.reduce(function(t, s) { return t + (s.paid ? s.total : 0); }, 0);
  var cash = all.filter(function(s) { return s.paid && s.method === "cash"; }).reduce(function(t, s) { return t + s.total; }, 0);
  var upi = all.filter(function(s) { return s.paid && s.method === "upi"; }).reduce(function(t, s) { return t + s.total; }, 0);
  var pts = all.filter(function(s) { return s.paid && s.method === "points"; }).reduce(function(t, s) { return t + s.total; }, 0);
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted);font-size:13px">← More</a><h1 style="margin-top:20px">Reports</h1><div class="grid4"><div class="stat"><div class="v">₹' + tr + '</div><div class="l">Revenue</div></div><div class="stat"><div class="v" style="color:var(--green)">₹' + cash + '</div><div class="l">Cash</div></div><div class="stat"><div class="v" style="color:var(--cyan)">₹' + upi + '</div><div class="l">UPI</div></div><div class="stat"><div class="v" style="color:var(--gold-bright)">₹' + pts + '</div><div class="l">Points</div></div></div></div></div>';
};

R.settings = function() {
  if (!can("settings")) return R.denied();
  var s = (SETTINGS && SETTINGS.cafe) || {};
  var l = (SETTINGS && SETTINGS.loyalty) || {};
  var exps = (SETTINGS && SETTINGS.experiences) || EXP;
  var expHTML = exps.map(function(e, i) {
    var priceFields = "";
    if (e.fixed) {
      priceFields = '<label>Fixed Price ₹</label><input type="number" data-exp="' + i + '" data-field="fixed" value="' + (e.fixed || 0) + '">';
    } else if (e.prices) {
      priceFields = '<div class="sec-label" style="margin-top:10px">Prices</div><div class="grid2">' +
        Object.keys(e.prices).map(function(d) { return '<div><label>' + d + ' min (₹)</label><input type="number" data-exp="' + i + '" data-field="price_' + d + '" value="' + e.prices[d] + '"></div>'; }).join("") + '</div>';
    }
    return '<div class="card"><div style="font-weight:800;color:var(--gold);margin-bottom:10px;font-size:15px">' + esc(e.name) + '</div><label>Name</label><input type="text" data-exp="' + i + '" data-field="name" value="' + esc(e.name) + '"><label>Subtitle</label><input type="text" data-exp="' + i + '" data-field="sub" value="' + esc(e.sub || "") + '">' + priceFields + '</div>';
  }).join("");
  return '<div class="screen"><div class="wrap" style="max-width:560px">' +
    '<a href="javascript:go(\'more\')" style="color:var(--muted);font-size:13px">← More</a>' +
    '<h1 style="margin-top:20px">Settings</h1>' +
    '<p class="sub">Changes apply instantly to customer app</p>' +
    '<div class="sec-label">📍 Café Info</div>' +
    '<div class="card"><label>Phone</label><input id="set_phone" value="' + esc(s.phone || "") + '"><label>Hours</label><input id="set_hours" value="' + esc(s.hours || "") + '"><label>Address</label><input id="set_address" value="' + esc(s.address || "") + '"></div>' +
    '<div class="sec-label">💰 Loyalty Settings</div>' +
    '<div class="card"><div class="grid2"><div><label>₹ per point</label><input id="set_rr" type="number" value="' + (l.RR || 20) + '"></div><div><label>Points per free hour</label><input id="set_pph" type="number" value="' + (l.POINTS_PER_HOUR || 1000) + '"></div></div><div class="grid2"><div><label>Referral bonus</label><input id="set_ref" type="number" value="' + (l.REF_BONUS || 50) + '"></div><div><label>Birthday bonus</label><input id="set_bday" type="number" value="' + (l.BDAY_BONUS || 100) + '"></div></div></div>' +
    '<div class="sec-label">🎮 Experiences & Prices</div>' +
    '<div id="exp_editor">' + expHTML + '</div>' +
    '<button class="btn" style="margin-top:20px" onclick="saveAllSettings()">💾 Save All Changes</button>' +
    '<div class="notice green" style="margin-top:14px">✅ Changes apply instantly — customers will see them on their next screen refresh.</div>' +
  '</div></div>';
};
window.saveAllSettings = function() {
  var s = {
    cafe: { phone: document.getElementById("set_phone").value.trim(), hours: document.getElementById("set_hours").value.trim(), address: document.getElementById("set_address").value.trim() },
    loyalty: { RR: parseInt(document.getElementById("set_rr").value) || 20, POINTS_PER_HOUR: parseInt(document.getElementById("set_pph").value) || 1000, REF_BONUS: parseInt(document.getElementById("set_ref").value) || 50, BDAY_BONUS: parseInt(document.getElementById("set_bday").value) || 100 },
    experiences: []
  };
  var exps = (SETTINGS && SETTINGS.experiences) || EXP;
  exps.forEach(function(e, i) {
    var ne = JSON.parse(JSON.stringify(e));
    var nameEl = document.querySelector('[data-exp="' + i + '"][data-field="name"]');
    var subEl = document.querySelector('[data-exp="' + i + '"][data-field="sub"]');
    if (nameEl) ne.name = nameEl.value.trim();
    if (subEl) ne.sub = subEl.value.trim();
    if (ne.fixed) {
      var fxEl = document.querySelector('[data-exp="' + i + '"][data-field="fixed"]');
      if (fxEl) ne.fixed = parseInt(fxEl.value) || 0;
      ne.from = ne.fixed;
    } else if (ne.prices) {
      Object.keys(ne.prices).forEach(function(d) {
        var el = document.querySelector('[data-exp="' + i + '"][data-field="price_' + d + '"]');
        if (el) ne.prices[d] = parseInt(el.value) || 0;
      });
      var vals = Object.keys(ne.prices).map(function(k) { return ne.prices[k]; });
      ne.from = Math.min.apply(null, vals);
    }
    s.experiences.push(ne);
  });
  saveSettings(s).then(function(res) {
    if (res && res.error) { toast("❌ " + res.error.message, "error"); return; }
    toast("✅ Settings saved!", "success");
    render("settings", {});
  });
};

function forcePasswordReset(admin, isExpired) {
  var m = document.createElement("div");
  m.id = "forceResetModal"; m.className = "modal";
  m.innerHTML = '<div class="sheet">' +
    '<h2>' + (isExpired ? "🔐 Password Expired" : "🔑 Reset Password") + '</h2>' +
    '<div class="s">' + (isExpired ? "Your password is 90+ days old. Please set a new one to continue." : "Set a new password for " + esc(admin.username)) + '</div>' +
    '<label>New password (6+ chars)</label><input id="fp_new" type="password" placeholder="••••••" autocomplete="new-password">' +
    '<label>Confirm new password</label><input id="fp_conf" type="password" placeholder="••••••" autocomplete="new-password">' +
    '<div class="notice gold" style="margin-top:10px">🔒 Cannot reuse any of your last ' + PASSWORD_HISTORY_SIZE + ' passwords</div>' +
    '<button class="btn" id="fp_save">Save New Password</button>' +
    (isExpired ? '' : '<button class="btn dark" id="fp_cancel" style="margin-top:8px">Cancel</button>') +
    '</div>';
  document.body.appendChild(m);
  m.querySelector("#fp_save").onclick = function() {
    var np = m.querySelector("#fp_new").value;
    var cf = m.querySelector("#fp_conf").value;
    if (np.length < 6) return toast("6+ characters required", "error");
    if (np !== cf) return toast("Passwords don't match", "error");
    var newHash = hashPin(np);
    if (newHash === admin.passHash) return toast("Cannot reuse current password", "error");
    if (checkPasswordHistory(newHash, admin.password_history)) return toast("Recently used password — pick a new one", "error");
    var oldHistory = pushPasswordHistory(admin.passHash, admin.password_history);
    loadAll().then(function() {
      var arr = ADMINS.map(function(x) {
        return x.username === admin.username ?
          Object.assign({}, x, { passHash: newHash, password_history: oldHistory, password_changed_at: Date.now() }) : x;
      });
      ADMINS = arr;
      saveAdmins(arr).then(function() {
        m.remove();
        toast("✅ Password updated!", "success");
        if (isExpired) { go("floor"); } else { render(curR, {}); }
      });
    });
  };
  var cancel = m.querySelector("#fp_cancel");
  if (cancel) cancel.onclick = function() { m.remove(); };
}

R.me = function() {
  var me = getMe();
  if (!me) return R.denied();
  var age = passwordAgeDays(me);
  var daysLeft = Math.max(0, PASSWORD_MAX_AGE_DAYS - age);
  var ageColor = daysLeft > 30 ? "var(--green)" : daysLeft > 10 ? "var(--orange)" : "var(--red)";
  var permList = me.role === "owner" ? ALL_PERMS : (me.perms || []);
  var permHTML = ALL_PERMS.map(function(p) {
    var has = permList.indexOf(p) >= 0;
    return '<div class="perm-item" style="cursor:default;' + (has ? 'border-color:var(--gold);background:#1f1a10' : 'opacity:.4') + '"><span>' + PERM_LABELS[p] + '</span>' + (has ? ' <span style="color:var(--green);margin-left:auto">✓</span>' : ' <span style="color:var(--muted);margin-left:auto">—</span>') + '</div>';
  }).join("");
  return '<div class="screen"><div class="wrap">' +
    '<a href="javascript:go(\'more\')" style="color:var(--muted);font-size:13px">← More</a>' +
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
      (daysLeft <= 10 ? '<div class="notice red" style="margin:12px 0 0">⚠ Password expires soon — change it now to avoid lockout.</div>' : '') +
      '<button class="btn dark" style="margin-top:12px" onclick="forcePasswordReset(getMe(),false)">🔑 Change Password</button>' +
    '</div>' +
    '<div class="sec-label">🛡 Permissions</div>' +
    '<div class="perm-grid">' + permHTML + '</div>' +
    (me.role === "owner" ? '<button class="btn dark" style="margin-top:20px" onclick="go(\'admin_users\')">👑 Manage Staff Accounts</button>' : '') +
    '<button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button>' +
  '</div></div>';
};

R.admin_users = function() {
  if (!isOwner()) return R.denied();
  var me = getMe();
  var cards = ADMINS.map(function(a) {
    var isMe = a.username === me.username;
    var permCount = a.role === "owner" ? ALL_PERMS.length : (a.perms || []).length;
    var actions = isMe ? '<div class="notice gold" style="margin:0;font-size:12px">👑 This is you</div>' :
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button class="btn dark xs" onclick="editPerms(\'' + a.username + '\')">🛡 Permissions (' + permCount + ')</button>' +
      '<button class="btn dark xs" onclick="changeAdminPwd(\'' + a.username + '\')">🔑 Password</button>' +
      (a.role !== "owner" ? '<button class="btn dark xs" onclick="promoteAdmin(\'' + a.username + '\')">👑 Promote</button>' : '<button class="btn dark xs" onclick="demoteAdmin(\'' + a.username + '\')">↓ Demote</button>') +
      '<button class="btn danger xs" onclick="removeAdmin(\'' + a.username + '\')">🗑 Remove</button>' +
      '</div>';
    return '<div class="card" style="padding:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div><div style="font-weight:700;color:var(--txt);font-size:15px">' + esc(a.username) + (a.role === "owner" ? " 👑" : "") + '</div><div style="color:var(--muted);font-size:12px;margin-top:2px">' + (a.role === "owner" ? "Owner · Full access" : "Staff · " + permCount + " permissions") + '</div></div>' + (isMe ? '<span class="badge vip">YOU</span>' : a.role === "owner" ? '<span class="badge vip">OWNER</span>' : '') + '</div>' + actions + '</div>';
  }).join("");
  return '<div class="screen"><div class="wrap">' +
    '<a href="javascript:go(\'more\')" style="color:var(--muted);font-size:13px">← More</a>' +
    '<h1 style="margin-top:20px">👑 Staff Accounts</h1>' +
    '<p class="sub">' + ADMINS.length + ' total · You are <b style="color:var(--gold-bright)">' + esc(me.username) + '</b></p>' +
    '<button class="btn" onclick="addAdmin()">+ Add Staff Member</button>' +
    '<div style="margin-top:16px">' + cards + '</div>' +
    '<div class="notice gold" style="margin-top:20px">💡 <b>Owner</b> = full access to everything<br><b>Staff</b> = only the permissions you grant</div>' +
  '</div></div>';
};
window.addAdmin = function() {
  openSheet({
    title: "➕ Add Staff Member", subtitle: "Create a new login",
    fields: [
      { id: "u", label: "Username", type: "text", placeholder: "e.g. rahul" },
      { id: "p", label: "Password (6+ chars)", type: "password", placeholder: "••••••" },
      { type: "notice", value: "All permissions are ON by default. You can turn them off after creation." }
    ],
    confirmText: "Create Staff Account",
    onConfirm: function(v) {
      var u = (v.u || "").trim().toLowerCase();
      var p = v.p || "";
      if (!u || u.length < 3) return toast("Username must be 3+ characters", "error");
      if (!/^[a-z0-9_]+$/.test(u)) return toast("Only letters, numbers, underscore", "error");
      if (!p || p.length < 6) return toast("Password must be 6+ characters", "error");
      loadAll().then(function() {
        if (ADMINS.find(function(x) { return x.username.toLowerCase() === u; })) return toast("Username already taken", "error");
        var newA = { username: u, passHash: hashPin(p), role: "admin", perms: ALL_PERMS.slice(), createdAt: Date.now(), password_changed_at: Date.now(), password_history: "[]" };
        var arr = ADMINS.concat([newA]);
        ADMINS = arr;
        saveAdmins(arr).then(function() {
          toast("✅ Staff \"" + u + "\" created", "success");
          render("admin_users", {});
        });
      });
    }
  });
};
window.editPerms = function(uname) {
  loadAll().then(function() {
    var a = ADMINS.find(function(x) { return x.username === uname; });
    if (!a) return;
    if (a.role === "owner") return toast("Owner has all permissions", "warn");
    var m = document.createElement("div");
    m.id = "permModal"; m.className = "modal";
    m.innerHTML = '<div class="sheet"><h2>🛡 Permissions</h2><div class="s">' + esc(uname) + '</div>' +
      '<div class="perm-grid">' + ALL_PERMS.map(function(p) {
        return '<label class="perm-item"><input type="checkbox" id="perm_' + p + '"' + ((a.perms || []).indexOf(p) >= 0 ? " checked" : "") + '><span>' + PERM_LABELS[p] + '</span></label>';
      }).join("") + '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:14px">' +
        '<button class="btn dark sm" style="flex:1;font-size:12px" onclick="toggleAllPerms(true)">Select All</button>' +
        '<button class="btn dark sm" style="flex:1;font-size:12px" onclick="toggleAllPerms(false)">Clear All</button>' +
      '</div>' +
      '<button class="btn" onclick="savePerms(\'' + uname + '\')">Save Permissions</button>' +
      '<button class="btn dark" style="margin-top:8px" onclick="document.getElementById(\'permModal\').remove()">Cancel</button></div>';
    document.body.appendChild(m);
  });
};
window.toggleAllPerms = function(v) {
  ALL_PERMS.forEach(function(p) { var el = document.getElementById("perm_" + p); if (el) el.checked = v; });
};
window.savePerms = function(uname) {
  var perms = ALL_PERMS.filter(function(p) { var el = document.getElementById("perm_" + p); return el && el.checked; });
  if (!perms.length) return toast("Keep at least 1 permission", "error");
  loadAll().then(function() {
    var arr = ADMINS.map(function(x) { return x.username === uname ? Object.assign({}, x, { perms: perms }) : x; });
    ADMINS = arr;
    saveAdmins(arr).then(function() {
      document.getElementById("permModal").remove();
      toast("✅ Permissions updated", "success");
      render("admin_users", {});
    });
  });
};
window.changeAdminPwd = function(uname) {
  openSheet({
    title: "🔑 Change Password", subtitle: uname,
    fields: [{ id: "p", label: "New password (6+ chars)", type: "password", placeholder: "••••••" }],
    confirmText: "Update Password",
    onConfirm: function(v) {
      var p = v.p || "";
      if (p.length < 6) return toast("Password must be 6+", "error");
      loadAll().then(function() {
        var arr = ADMINS.map(function(x) { return x.username === uname ? Object.assign({}, x, { passHash: hashPin(p), password_changed_at: Date.now() }) : x; });
        ADMINS = arr;
        saveAdmins(arr).then(function() {
          toast("✅ Password updated", "success");
          render("admin_users", {});
        });
      });
    }
  });
};
window.promoteAdmin = function(uname) {
  confirmSheet({ title: "Promote to Owner?", message: uname + " will get full access to everything.", yesText: "Promote",
    onYes: function() { loadAll().then(function() { var arr = ADMINS.map(function(x) { return x.username === uname ? Object.assign({}, x, { role: "owner", perms: ALL_PERMS.slice() }) : x; }); ADMINS = arr; saveAdmins(arr).then(function() { toast("👑 Promoted", "success"); render("admin_users", {}); }); }); } });
};
window.demoteAdmin = function(uname) {
  confirmSheet({ title: "Demote to Staff?", message: uname + " will lose full owner access.", yesText: "Demote",
    onYes: function() { loadAll().then(function() { var arr = ADMINS.map(function(x) { return x.username === uname ? Object.assign({}, x, { role: "admin" }) : x; }); ADMINS = arr; saveAdmins(arr).then(function() { toast("Demoted", "warn"); render("admin_users", {}); }); }); } });
};
window.removeAdmin = function(uname) {
  confirmSheet({ title: "Remove " + uname + "?", message: "They will lose access immediately. This cannot be undone.", yesText: "Remove", danger: true,
    onYes: function() { loadAll().then(function() { var arr = ADMINS.filter(function(x) { return x.username !== uname; }); ADMINS = arr; saveAdmins(arr).then(function() { toast("🗑 Removed", "success"); render("admin_users", {}); }); }); } });
};

R.newsale = function() {
  if (!bk) bk = { exp: null, time: null, players: 1 };
  var e = EXP.find(function(x) { return x.id === bk.exp; });
  var expCards = EXP.map(function(x) {
    return '<div class="card click ' + (bk.exp === x.id ? "selected" : "") + '" onclick="pickE(\'' + x.id + '\')" style="padding:14px"><div style="font-weight:700">' + x.name + '</div><div style="color:var(--muted);font-size:12px;margin-top:4px">' + (x.fixed ? "₹" + x.fixed : "From ₹" + x.from) + '</div></div>';
  }).join("");
  var timeHTML = (e && !e.fixed) ? '<div class="sec-label">02 · Time</div><div class="grid2">' + dursOf(bk.exp).map(function(m) {
    return '<div class="card click ' + (bk.time === m ? "selected" : "") + '" onclick="pickT(' + m + ')" style="padding:12px;text-align:center"><div style="font-weight:700">' + (m < 60 ? m + "min" : m / 60 + "h") + '</div><div style="color:var(--muted);font-size:12px;margin-top:4px">₹' + (e.prices[m] || 0) + '</div></div>';
  }).join("") + '</div>' : '<div class="sec-label">03 · Players</div><div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:14px"><button class="btn dark sm" style="width:50px;height:50px;border-radius:50%;font-size:24px;padding:0" onclick="chP(-1)">−</button><div style="font-size:32px;font-weight:800">' + bk.players + '</div><button class="btn sm" style="width:50px;height:50px;border-radius:50%;font-size:24px;padding:0" onclick="chP(1)">+</button></div>';
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted);font-size:13px">← Floor</a><h1 style="margin-top:20px">New Sale</h1><div class="sec-label">01 · Experience</div>' + expCards + (e ? timeHTML : "") + (e ? '<button class="btn" style="margin-top:20px" onclick="saveSale()">Save & Continue</button>' : "") + '</div></div>';
};
window.pickE = function(id) { bk.exp = id; var e = EXP.find(function(x) { return x.id === id; }); if (e.fixed) bk.time = null; else if (!bk.time) bk.time = dursOf(id)[0]; render("newsale", {}); };
window.pickT = function(m) { bk.time = m; render("newsale", {}); };
window.chP = function(d) { var n = bk.players + d; if (n < 1 || n > 8) return; bk.players = n; render("newsale", {}); };
window.saveSale = function() {
  var e = EXP.find(function(x) { return x.id === bk.exp; });
  if (!e) return;
  openSheet({
    title: "💾 New Sale", subtitle: e.name + (bk.time ? " · " + bk.time + "min" : ""),
    fields: [{ id: "cname", label: "Customer name", type: "text", value: "Walk-in", placeholder: "e.g. Arjun" }],
    confirmText: "Save Sale",
    onConfirm: function(v) {
      var n = (v.cname || "").trim() || "Walk-in";
      var isMem = e.id === "member" || e.id === "racemem";
      var items = [e.name];
      if (bk.time && !e.fixed && !isMem) items.push(bk.time + "min × " + bk.players + "p");
      var total = e.fixed || 0;
      if (!e.fixed && bk.time) total = (e.prices[bk.time] || 0) * bk.players;
      var s = { id: newBID(), name: n, phone: "", expId: e.id, expName: e.name, items: items, total: total, minutes: isMem ? 1800 : (bk.time || 60), players: bk.players, method: "cash", paid: false, status: "pending", createdAt: Date.now(), customerId: null, isMembership: isMem };
      loadAll().then(function() {
        var arr = [s].concat(SESS); var old = SESS; SESS = arr;
        syncTable("sessions", arr, old, denormS);
        bk = null;
        toast("✅ Saved ₹" + total, "success");
        go("payments");
      });
    }
  });
};

function setupAdminRealtime() {
  if (!sb) return;
  try { sb.removeAllChannels(); } catch(e) {}
  ["customers", "sessions", "requests", "tournaments", "addons", "settings"].forEach(function(t) {
    try {
      sb.channel("admin-" + t).on("postgres_changes", { event: "*", schema: "public", table: t }, function(payload) {
        loadAll().then(function() { if (curR) render(curR, {}); });
        if (payload.eventType === "INSERT" && payload.new) {
          var row = payload.new;
          if (t === "customers" && row.activated === false) notifyAdmin("🎉 New signup: " + (row.name || "?"));
          else if (t === "requests" && row.status === "pending") notifyAdmin("🍟 New order from " + (row.customer_name || "?"));
          else if (t === "sessions" && row.status === "pending") notifyAdmin("🎮 New booking: " + (row.name || "?"));
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
  setupAdminRealtime();
}).catch(function(e) {
  console.error("Load failed:", e);
  document.getElementById("app").innerHTML = '<div class="screen"><div class="wrap"><div class="empty"><div class="big">❌</div><div class="msg">CONNECTION FAILED</div><p style="color:var(--muted);margin-top:10px;font-size:13px">Could not reach database. Check your internet.</p><button class="btn" style="max-width:280px;margin:20px auto 0" onclick="location.reload()">Retry</button></div></div></div>';
});
