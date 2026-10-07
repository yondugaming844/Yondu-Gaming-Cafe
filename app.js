/* YONDU CUSTOMER APP */

var curR = "", bk = null, sc = {}, signupPic = "";
var PUBLIC_ROUTES = { landing: 1, signin: 1, signup: 1, login: 1 };

function curC() {
  var id = DB.get("yondu_current_customer", null);
  if (!id) return null;
  return CUST.find(function(c) { return c.id === id; }) || null;
}
function setCur(id) { DB.set("yondu_current_customer", id); }
function signOut() { DB.del("yondu_current_customer"); DB.del("yondu_guest_mode"); go("landing"); }
function isGuest() { return !curC() && DB.get("yondu_guest_mode", false); }
function setGuest() { DB.set("yondu_guest_mode", true); }

var R = {};
function go(r, p) { curR = r; window.scrollTo(0, 0); render(r, p || {}); }
window.go = go;

var adminTaps = 0, adminTapTimer = null;
window.tapAdmin = function() {
  adminTaps++;
  clearTimeout(adminTapTimer);
  adminTapTimer = setTimeout(function() { adminTaps = 0; }, 1500);
  if (adminTaps >= 5) {
    adminTaps = 0;
    if (confirm("Staff login?")) window.location.href = "admin.html";
  }
};

function render(r, p) {
  var c = curC();
  if (c && !c.activated && r !== "pending" && !PUBLIC_ROUTES[r]) { r = "pending"; p = {}; }
  if (!c && !isGuest() && !PUBLIC_ROUTES[r]) { r = "landing"; p = {}; }
  curR = r;
  var app = document.getElementById("app");
  var fn = R[r] || R.landing;
  if (app) app.innerHTML = fn(p);
  renderNav(r);
  if (R[r] && R[r].after) R[r].after(p);
}

function renderNav(r) {
  var nav = document.getElementById("nav");
  var c = curC();
  if (r === "landing" || r === "signin" || r === "login" || r === "signup" || r === "pending") {
    nav.style.display = "none"; return;
  }
  if (!c || !c.activated) { nav.style.display = "none"; return; }
  nav.style.display = "flex";
  nav.innerHTML =
    '<a href="javascript:go(\'home\')" class="' + (r === "home" ? "on" : "") + '"><span class="ic">🏠</span>Home</a>' +
    '<a href="javascript:go(\'book\')" class="' + (r === "book" ? "on" : "") + '"><span class="ic">🎮</span>Book</a>' +
    '<a href="javascript:go(\'snacks\')" class="' + (r === "snacks" ? "on" : "") + '"><span class="ic">🍟</span>Snacks</a>' +
    '<a href="javascript:go(\'tournaments\')" class="' + (r === "tournaments" || r === "detail" || r === "ticket" ? "on" : "") + '"><span class="ic">🏆</span>Tourneys</a>' +
    '<a href="javascript:go(\'profile\')" class="' + (r === "profile" ? "on" : "") + '"><span class="ic">🎁</span>Me</a>';
}

/* ===================== LANDING (PREMIUM) ===================== */
R.landing = function() {
  var stats = {
    customers: CUST.length || 0,
    stations: STA.length || 5,
    tournaments: TOURN.filter(function(t) { return t.status !== "done"; }).length
  };
  return '<div class="landing">' +
    '<div class="hero-bg-text">YONDU</div>' +
    '<div class="hero">' +
      '<div class="hero-badge">✦ Est. 2024 · Vadodara ✦</div>' +
      '<h1 class="hero-title">YONDU</h1>' +
      '<p class="hero-sub">Gaming Café</p>' +
      '<p class="hero-tag">Where legends power up and squad goals begin.</p>' +
      '<div class="hero-actions">' +
        '<button class="btn" onclick="go(\'signup\')">🎮 Start Playing</button>' +
        '<button class="btn dark" onclick="go(\'signin\')">Sign In</button>' +
      '</div>' +
      '<button class="btn-link" onclick="guestEnter()">Browse as guest →</button>' +
    '</div>' +
    '<div class="stat-strip">' +
      '<div class="stat-item"><div class="stat-num">' + stats.customers + '</div><div class="stat-lbl">Players</div></div>' +
      '<div class="stat-item"><div class="stat-num">' + stats.stations + '</div><div class="stat-lbl">Stations</div></div>' +
      '<div class="stat-item"><div class="stat-num">' + stats.tournaments + '</div><div class="stat-lbl">Events</div></div>' +
    '</div>' +
    '<div class="features">' +
      '<div class="sec-label" style="text-align:center;margin-top:0">What You Get</div>' +
      '<div class="feature-grid">' +
        '<div class="feature-card" onclick="go(\'signup\')"><span class="feature-ic">🎮</span><div class="feature-t">PS5 + Racing</div><div class="feature-d">Latest AAA titles + full racing rig</div></div>' +
        '<div class="feature-card" onclick="go(\'signup\')"><span class="feature-ic">🍟</span><div class="feature-t">Snacks & Drinks</div><div class="feature-d">Fuel up between matches</div></div>' +
        '<div class="feature-card" onclick="go(\'signup\')"><span class="feature-ic">🏆</span><div class="feature-t">Tournaments</div><div class="feature-d">Weekly events with prizes</div></div>' +
        '<div class="feature-card" onclick="go(\'signup\')"><span class="feature-ic">🎁</span><div class="feature-t">Rewards</div><div class="feature-d">Every ₹20 = 1 point</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="cta-band">' +
      '<div class="cta-inner">' +
        '<div class="cta-title">New here?</div>' +
        '<div class="cta-sub">Get 30 minutes FREE + 50 bonus points</div>' +
        '<button class="btn" onclick="go(\'signup\')">Claim Now →</button>' +
      '</div>' +
    '</div>' +
    '<div class="sec-label" style="text-align:center;margin-top:20px">📱 Connect</div>' +
    '<div style="padding:0 20px 20px;max-width:680px;margin:0 auto">' +
      '<a class="social-link social-instagram" href="' + getIG() + '" target="_blank" rel="noopener">' +
        '<div class="social-badge">Follow</div>' +
        '<div class="social-icon">📸</div>' +
        '<div class="social-body">' +
          '<div class="social-title">Follow us on Instagram</div>' +
          '<div class="social-desc">Daily updates · Tournaments · Behind the scenes</div>' +
        '</div>' +
        '<div class="social-arrow">→</div>' +
      '</a>' +
      '<a class="social-link social-google" href="' + getGR() + '" target="_blank" rel="noopener">' +
        '<div class="social-badge">Rate Us</div>' +
        '<div class="social-icon">⭐</div>' +
        '<div class="social-body">' +
          '<div class="social-title">Review us on Google</div>' +
          '<div class="social-desc">Helps us grow · Takes 30 seconds</div>' +
        '</div>' +
        '<div class="social-arrow">→</div>' +
      '</a>' +
    '</div>' +
    '<div class="footer-links">' + CAFE_INFO.hours + '<br>' + CAFE_INFO.address + '</div>' +
    '<a href="admin.html" class="staff-link">Staff Login →</a>' +
  '</div>';
};

window.guestEnter = function() { setGuest(); go("guest_home"); };

/* ===================== GUEST ===================== */
R.guest_home = function() {
  var open = TOURN.filter(function(t) { return t.status !== "done"; }).slice(0, 3);
  var expCards = EXP.map(function(e) {
    return '<div class="card"><div style="font-size:15px;font-weight:700">' + e.name + '</div><div style="color:var(--muted);font-size:12px;margin-top:4px">' + (e.sub || "Popular") + '</div></div>';
  }).join("");
  var addRows = ADD.slice(0, 6).map(function(a) {
    return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:14px"><span>' + a.name + '</span><span style="color:var(--muted);font-size:12px">₹' + a.price + '</span></div>';
  }).join("");
  return '<div class="screen"><div class="wrap">' +
    '<div class="brand"><div class="brand-icon"></div><div class="brand-txt"><div class="g">Jay Shree Ganesha</div><div class="n">Yondu Gaming Café</div><div class="s">GUEST MODE</div></div></div>' +
    '<div class="card" style="background:linear-gradient(135deg,#1a1508,#0d0b05);border:2px solid var(--gold);padding:18px">' +
      '<div style="color:var(--gold);font-size:10px;font-weight:700;letter-spacing:1.5px">BROWSING AS</div>' +
      '<div style="font-size:20px;font-weight:800;margin-top:4px">Guest 👀</div>' +
      '<div style="color:var(--muted);font-size:12px;margin-top:6px">Sign up to book, order, compete, and earn rewards</div>' +
      '<button class="btn" style="margin-top:14px" onclick="go(\'signup\')">🎁 Sign Up · 30 min FREE</button></div>' +
    '<div class="sec-label">📍 Visit Us</div>' +
    '<div class="card" style="padding:6px 16px">' +
      '<div class="benefit"><div class="ic">🕐</div><div><div class="t">Hours</div><div class="d">' + CAFE_INFO.hours + '</div></div></div>' +
      '<div class="benefit"><div class="ic">📍</div><div><div class="t">Location</div><div class="d">' + CAFE_INFO.address + '</div></div></div>' +
      '<div class="benefit"><div class="ic">📞</div><div><div class="t">Phone</div><div class="d">' + CAFE_INFO.phone + '</div></div></div>' +
    '</div>' +
    '<div class="sec-label">🎮 What We Offer</div>' + expCards +
    '<div class="sec-label">🍟 Snack Menu</div>' +
    '<div class="card" style="padding:14px">' + addRows + '</div>' +
    (open.length ? '<div class="sec-label">🏆 Upcoming</div>' + open.map(function(t) { return tCrd(t); }).join("") : "") +
    '<button class="btn dark" style="margin-top:20px" onclick="go(\'landing\')">← Back</button>' +
  '</div></div>';
};

/* ===================== SIGNIN ===================== */
R.signin = function() {
  return '<div class="screen"><div class="wrap" style="max-width:440px;margin:30px auto">' +
    '<a href="javascript:go(\'landing\')" style="color:var(--muted);font-weight:600;font-size:13px">← Back</a>' +
    '<h1 style="margin-top:20px">Welcome Back</h1><p class="sub">Enter your number and PIN</p>' +
    '<label>Yondu Number</label><input id="in" placeholder="6-digit" style="font-size:20px;font-weight:800;text-align:center;letter-spacing:4px" inputmode="numeric" maxlength="6">' +
    '<label>4-digit PIN</label><input id="ip" placeholder="••••" inputmode="numeric" maxlength="4" type="password" style="font-size:22px;text-align:center;letter-spacing:12px">' +
    '<button class="btn" style="margin-top:12px" onclick="doSignin()">Sign In</button>' +
    '<div style="text-align:center;margin-top:16px"><a href="javascript:go(\'signup\')" style="color:var(--muted);font-size:13px;font-weight:600">New here? Sign up →</a></div>' +
  '</div></div>';
};

window.doSignin = function() {
  var n = document.getElementById("in").value.trim();
  var p = document.getElementById("ip").value.trim();
  if (!n) return alert("Enter number");
  if (!p) return alert("Enter PIN");
  var c = findC(n);
  if (!c) return alert("No account found");
  if (c.banned) return alert("🚫 Suspended");
  if (!checkPin(p, c.pinHash)) return alert("Wrong PIN");
  DB.del("yondu_guest_mode");
  if (!c.activated) { setCur(c.id); go("pending"); return; }
  if (checkExpiry(c)) {
    var a = CUST.slice();
    var i = a.findIndex(function(x) { return x.id === c.id; });
    if (i >= 0) a[i] = c;
    saveC(a);
    setTimeout(function() { alert("⚠️ 1000 points expired"); }, 300);
  }
  if (checkBday(c)) { awardBday(c); setTimeout(function() { alert("🎂 +100 points!"); }, 500); }
  c.lastActivity = Date.now();
  var a2 = CUST.slice();
  var i2 = a2.findIndex(function(x) { return x.id === c.id; });
  if (i2 >= 0) a2[i2] = c;
  saveC(a2);
  setCur(c.id);
  go("home");
};

/* ===================== SIGNUP ===================== */
R.signup = function() {
  var av = signupPic
    ? '<div class="avatar avatar-lg" style="background-image:url(\'' + signupPic + '\');margin:0 auto"></div>'
    : '<div class="avatar avatar-lg" style="margin:0 auto;font-size:34px">📷</div>';
  var hint = signupPic
    ? 'Tap to change · <span onclick="clearSignupPic()" style="color:var(--red);font-weight:700">remove</span>'
    : 'Tap to add photo <span style="opacity:.7">(optional)</span>';
  return '<div class="screen"><div class="wrap" style="max-width:440px;margin:30px auto">' +
    '<a href="javascript:go(\'landing\')" style="color:var(--muted);font-weight:600;font-size:13px">← Back</a>' +
    '<h1 style="margin-top:20px">Create Account</h1><p class="sub">One account per person</p>' +
    '<div class="preview-card">' +
      '<div class="tag">✨ WHAT YOU GET per</div>' +
      '<div style="font-size: ₹28px;margin:6px 0 8'px">🎮</div>' +
      '< +div style="font-weight:800;color:var(--gold RR-bright);font-size:15px;margin-bottom:14px">Welcome to Yondu</div>' +
      '<div style="text-align:left">' +
        '<div class="benefit" style="padding:8px 0"><div class="ic" style="font-size:16px">🆔</div><div><div class="t" style="font-size:13px">Unique Yondu Number</div><div class="d">Use it every visit</div></div></div>' +
        '<div class="benefit" style="padding:8px 0"><div class="ic" style="font-size:16px">🎁</div><div><div class="t" style="font-size:13px">' + REF_BONUS + ' Bonus Points</div><div class="d">Yours on activation</div></div></div>' +
        '<div class="benefit" style="padding:8px 0"><div class="ic" style="font-size:16px">⏱</div><div><div class="t" style="font-size:13px">30 Minutes FREE</div><div class="d">Credited on activation</div></div></div>' +
        '<div class="benefit" style="padding:8px 0"><div class="ic" style="font-size:16px">💰</div><div><div class="t" style="font-size:13px">1 Point + '</div><div class="d">' + POINTS_PER_HOUR + ' points = 1 free hour</div></div></div>' +
      '</div>' +
    '</div>' +
    '<div style="text-align:center;margin:6px 0 18px">' +
      '<div onclick="pickSignupPic()" style="display:inline-block;cursor:pointer">' + av + '</div>' +
      '<div style="color:var(--muted);font-size:12px;margin-top:8px">' + hint + '</div>' +
      '<input type="file" id="signupPicInput" accept="image/*" style="display:none" onchange="handleSignupPic(this)">' +
    '</div>' +
    '<label>Your Name</label><input id="sn" placeholder="e.g. Arjun" maxlength="30">' +
    '<div style="font-size:11px;color:var(--muted);margin:-6px 0 10px">At least 3 letters · must be unique</div>' +
    '<label>Birthday <span class="opt">(optional)</span></label><input id="sb" type="date">' +
    '<label>Referral Code <span class="opt">(optional)</span></label><input id="sr" placeholder="6-digit" style="text-transform:uppercase" maxlength="6">' +
    '<label>PIN (4-digit)</label><input id="sp1" placeholder="••••" inputmode="numeric" maxlength="4" type="password">' +
    '<label>Confirm PIN</label><input id="sp2" placeholder="••••" inputmode="numeric" maxlength="4" type="password">' +
    '<button class="btn" style="margin-top:12px" onclick="doSignup()">Create My Account 🎮</button>' +
  '</div></div>';
};

window.pickSignupPic = function() { var el = document.getElementById("signupPicInput"); if (el) el.click(); };
window.handleSignupPic = function(inp) {
  var f = inp.files && inp.files[0];
  readImageFile(f, function(dataUrl) {
    if (dataUrl) { signupPic = dataUrl; render("signup", {}); }
    else { inp.value = ""; }
  });
};
window.clearSignupPic = function() { signupPic = ""; render("signup", {}); };

window.doSignup = function() {
  var n = document.getElementById("sn").value.trim();
  var b = document.getElementById("sb").value;
  var r = document.getElementById("sr").value.trim().toUpperCase();
  var p1 = document.getElementById("sp1").value.trim();
  var p2 = document.getElementById("sp2").value.trim();
  if (!n) return alert("Enter name");
  if (n.length < 3) return alert("Name 3+ chars");
  if ((n.match(/[a-zA-Z]/g) || []).length < 3) return alert("3+ letters");
  if (CUST.find(function(c) { return c.name.toLowerCase() === n.toLowerCase(); })) return alert("❌ Name taken");
  if (p1.length !== 4 || !/^\d{4}$/.test(p1)) return alert("PIN 4 digits");
  if (p1 !== p2) return alert("PINs don't match");
  var all = CUST.slice();
  var refB = 0, refId = null;
  if (r) {
    var rf = all.find(function(x) { return x.id.toUpperCase() === r; });
    if (rf) { refId = rf.id; refB = REF_BONUS; }
  }
  var c = {
    id: newCID(), name: n, phone: "", birthday: b || "", pinHash: hashPin(p1),
    points: refB, pointsSpent: 0, ps5Hours: 0, raceHours: 0,
    totalSpent: 0, visits: 0, createdAt: Date.now(),
    activated: false, vip: false, banned: false,
    profilePic: signupPic || "", credit: 60, creditUsed: false,
    referrals: 0, referredBy: refId, birthdayAwarded: 0,
    lastActivity: Date.now(), pointsExpiredAt: 0
  };
  all.push(c);
  if (refId) {
    var rf2 = all.find(function(x) { return x.id === refId; });
    if (rf2) {
      rf2.points = Math.min(POINTS_MAX, (rf2.points || 0) + REF_BONUS);
      rf2.referrals = (rf2.referrals || 0) + 1;
    }
  }
  saveC(all);
  setCur(c.id);
  DB.del("yondu_guest_mode");
  signupPic = "";
  go("pending");
};

/* ===================== PENDING ===================== */
R.pending = function() {
  var c = curC();
  if (!c) return R.landing();
  if (c.activated) { setTimeout(function() { go("home"); }, 100); return '<div class="screen"><div class="wrap"><div class="empty"><div class="big">✓</div><div class="msg">LOADING</div></div></div></div>'; }
  var av = c.profilePic
    ? '<div class="avatar avatar-lg" style="background-image:url(\'' + c.profilePic + '\');margin:0 auto"></div>'
    : '<div class="avatar avatar-lg" style="margin:0 auto">' + c.name.charAt(0).toUpperCase() + '</div>';
  return '<div class="screen"><div class="wrap" style="max-width:480px">' +
    '<div style="text-align:center;margin:20px 0 16px">' + av +
      '<h1 style="font-size:22px;text-align:center;margin-top:14px">Hi, ' + c.name + '!</h1>' +
      '<p style="color:var(--muted);font-size:14px;margin-top:6px">Waiting for activation</p></div>' +
    '<div class="id-card"><div class="label">YOUR YONDU NUMBER</div><div class="idnum">' + c.id + '</div><div class="hint">Show at counter</div></div>' +
    '<div class="notice red" style="margin-top:14px"><b>📢 Next step:</b><br>Show this number to staff at counter.</div>' +
    '<div class="notice green" style="margin-top:10px"><b>🎁 Waiting:</b><br>• 30 minutes FREE<br>• 50 bonus points</div>' +
    '<button class="btn" style="margin-top:14px" onclick="checkActivation()">🔄 Check Activation</button>' +
    '<button class="btn dark" style="margin-top:8px" onclick="signOut()">Sign Out</button>' +
  '</div></div>';
};

window.checkActivation = function() {
  var c = curC();
  if (!c) return;
  loadAll().then(function() {
    var cc = curC();
    if (cc && cc.activated) { alert("✅ Activated!"); go("home"); }
    else alert("⏳ Still waiting.\n\nShow number: " + c.id);
  }).catch(function() { alert("Could not load. Try again."); });
};

/* ===================== HOME ===================== */
R.home = function() {
  var c = curC();
  if (!c) return R.landing();
  var pts = c.points || 0;
  var prog = Math.min(100, Math.floor((pts / POINTS_PER_HOUR) * 100));
  var freeH = Math.floor(pts / POINTS_PER_HOUR);
  var av = c.profilePic
    ? '<div class="avatar" style="background-image:url(\'' + c.profilePic + '\')"></div>'
    : '<div class="avatar">' + c.name.charAt(0).toUpperCase() + '</div>';
  var mem = "";
  if (c.ps5Hours > 0 || c.raceHours > 0) {
    var ps = c.ps5Hours > 0 ? '<div><div style="color:var(--muted);font-size:10px;font-weight:700">PS5</div><div style="font-size:20px;font-weight:800">' + c.ps5Hours + 'h</div></div>' : "";
    var rc = c.raceHours > 0 ? '<div><div style="color:var(--muted);font-size:10px;font-weight:700">RACING</div><div style="font-size:20px;font-weight:800">' + c.raceHours + 'h</div></div>' : "";
    mem = '<div class="card" style="background:linear-gradient(135deg,#0d1a10,#0a1409);border:1px solid var(--green);padding:14px"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="color:var(--green);font-size:10px;font-weight:700;letter-spacing:1.5px">🎫 MEMBERSHIP</div><div style="display:flex;gap:18px;margin-top:8px">' + ps + rc + '</div></div><div style="font-size:32px">🎫</div></div></div>';
  }
  return '<div class="screen"><div class="wrap">' +
    '<div class="brand"><div class="brand-icon"></div><div class="brand-txt"><div class="g">Jay Shree Ganesha</div><div class="n">Yondu Gaming Café</div><div class="s">VADODARA · EST. 2024</div></div></div>' +
    '<div class="card click" onclick="go(\'profile\')" style="background:linear-gradient(135deg,#1a1508,#0d0b05);border:2px solid var(--gold);padding:18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">' +
        '<div style="display:flex;align-items:center;gap:12px;min-width:0">' + av +
          '<div style="min-width:0"><div style="color:var(--gold);font-size:9px;font-weight:700;letter-spacing:1.5px">WELCOME BACK</div>' +
            '<div style="font-size:17px;font-weight:800;margin-top:2px">' + c.name + (c.vip ? " ⭐" : "") + '</div>' +
            '<div style="color:var(--cyan);font-size:12px;font-weight:700;letter-spacing:1.5px;margin-top:2px">' + c.id + '</div></div></div>' +
        '<div style="text-align:right"><div style="color:var(--gold);font-size:9px;font-weight:700">POINTS</div><div style="font-size:26px;font-weight:800;color:var(--gold-bright);line-height:1">' + pts + '</div></div>' +
      '</div></div>' +
    '<div class="card" style="padding:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="color:var(--gold);font-size:10px;font-weight:700;letter-spacing:1.5px">NEXT FREE HOUR</div><div style="font-size:12px;font-weight:700">' + pts + '/' + POINTS_PER_HOUR + '</div></div><div class="progress" style="margin:0"><div style="width:' + prog + '%"></div></div><div style="color:var(--muted);font-size:12px;margin-top:8px">' + (freeH > 0 ? '🎁 <b style="color:var(--gold-bright)">' + freeH + ' free hour' + (freeH > 1 ? "s" : "") + '</b>' : 'Earn ' + (POINTS_PER_HOUR - pts) + ' more') + '</div></div>' +
    mem +
    '<div class="sec-label">Quick Actions</div>' +
    '<div class="grid2" style="gap:10px">' +
      '<div class="card click" onclick="go(\'book\')" style="margin:0;padding:16px"><div style="font-size:24px;margin-bottom:6px">🎮</div><div style="font-weight:700;color:var(--cyan);font-size:14px">Book Station</div></div>' +
      '<div class="card click" onclick="go(\'snacks\')" style="margin:0;padding:16px"><div style="font-size:24px;margin-bottom:6px">🍟</div><div style="font-weight:700;color:var(--gold);font-size:14px">Order Snacks</div></div>' +
      '<div class="card click" onclick="go(\'tournaments\')" style="margin:0;padding:16px"><div style="font-size:24px;margin-bottom:6px">🏆</div><div style="font-weight:700;color:var(--pink);font-size:14px">Tournaments</div></div>' +
      '<div class="card click" onclick="go(\'mybookings\')" style="margin:0;padding:16px"><div style="font-size:24px;margin-bottom:6px">📋</div><div style="font-weight:700;font-size:14px">My Bookings</div></div>' +
    '</div>' +
    '<div class="sec-label">📍 Visit Us</div>' +
    '<div class="card" style="padding:6px 16px">' +
      '<div class="benefit"><div class="ic">🕐</div><div><div class="t">Hours</div><div class="d">' + CAFE_INFO.hours + '</div></div></div>' +
      '<div class="benefit"><div class="ic">📍</div><div><div class="t">Location</div><div class="d">' + CAFE_INFO.address + '</div></div></div>' +
      '<div class="benefit"><div class="ic">📞</div><div><div class="t">Phone</div><div class="d">' + CAFE_INFO.phone + '</div></div></div>' +
    '</div>' +
    '<div class="sec-label">📱 Connect with Us</div>' +
    '<a class="social-link social-instagram" href="' + getIG() + '" target="_blank" rel="noopener">' +
      '<div class="social-badge">Follow</div>' +
      '<div class="social-icon">📸</div>' +
      '<div class="social-body">' +
        '<div class="social-title">Follow us on Instagram</div>' +
        '<div class="social-desc">Daily updates · Tournaments · Behind the scenes</div>' +
      '</div>' +
      '<div class="social-arrow">→</div>' +
    '</a>' +
    '<a class="social-link social-google" href="' + getGR() + '" target="_blank" rel="noopener">' +
      '<div class="social-badge">Rate Us</div>' +
      '<div class="social-icon">⭐</div>' +
      '<div class="social-body">' +
        '<div class="social-title">Review us on Google</div>' +
        '<div class="social-desc">Helps us grow · Takes 30 seconds</div>' +
      '</div>' +
      '<div class="social-arrow">→</div>' +
    '</a>' +
  '</div></div>';
};

/* ===================== PROFILE ===================== */
R.profile = function() {
  var c = curC();
  if (!c) return R.landing();
  var ub = unlockedBadges(c);
  var pts = c.points || 0;
  var av = c.profilePic
    ? '<div class="avatar avatar-lg" style="background-image:url(\'' + c.profilePic + '\');margin:0 auto"></div>'
    : '<div class="avatar avatar-lg" style="margin:0 auto">' + c.name.charAt(0).toUpperCase() + '</div>';
  var photoBtns = '<div style="margin-top:10px">' +
    '<button class="btn sm dark" onclick="changePhoto()" style="margin:0 4px">📷 ' + (c.profilePic ? "Change" : "Add") + ' Photo</button>' +
    (c.profilePic ? '<button class="btn sm dark" onclick="removePhoto()" style="margin:0 4px;color:var(--red)">Remove</button>' : '') + '</div>';
  var badges = BADGES.map(function(b) {
    var has = ub.find(function(u) { return u.id === b.id; });
    return '<div class="badge-item ' + (has ? "unlocked" : "locked") + '"><span class="em">' + b.em + '</span><div class="nm">' + b.name + '</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap">' +
    '<a href="javascript:go(\'home\')" style="color:var(--muted);font-weight:600;font-size:13px">← Home</a>' +
    '<h1 style="margin-top:20px">My Account</h1><p class="sub">' + (c.vip ? "⭐ VIP · " : "") + 'Member since ' + new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) + '</p>' +
    '<div style="text-align:center;margin:14px 0">' + av + photoBtns + '</div>' +
    '<div class="id-card" style="padding:22px"><div class="label">YOUR YONDU NUMBER</div><div class="idnum" style="font-size:32px">' + c.id + '</div></div>' +
    '<div class="pts-hero" style="margin-top:14px"><div class="lbl">REWARD POINTS</div><div class="val">' + pts + '</div><div class="sub">' + (Math.floor(pts / POINTS_PER_HOUR) > 0 ? Math.floor(pts / POINTS_PER_HOUR) + " free hour available" : "Earn more for free hours") + '</div></div>' +
    '<div class="notice" style="margin-top:14px"><b>📊 Points:</b><br>• ₹' + RR + ' = 1 point<br>• ' + POINTS_PER_HOUR + ' points = 1 free hour</div>' +
    '<div class="sec-label">🏆 Badges (' + ub.length + '/' + BADGES.length + ')</div>' +
    '<div class="badge-grid">' + badges + '</div>' +
    '<div class="sec-label">🤝 Refer & Earn</div>' +
    '<div class="card" style="text-align:center">' +
      '<div style="font-size:28px;margin-bottom:6px">🎁</div>' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:6px">Your code: <span style="color:var(--gold-bright);font-family:\'Courier New\',monospace;font-size:18px">' + c.id + '</span></div>' +
      '<div style="color:var(--muted);font-size:12px;margin-bottom:10px">Friend signs up → both get ' + REF_BONUS + ' points</div>' +
      '<div style="color:var(--cyan);font-weight:700;font-size:13px;margin-bottom:10px">Referred ' + (c.referrals || 0) + '</div>' +
      '<button class="btn green" onclick="shareRef()">📤 Share on WhatsApp</button></div>' +
    '<div class="sec-label">📱 Connect with Us</div>' +
    '<a class="social-link social-instagram" href="' + getIG() + '" target="_blank" rel="noopener">' +
      '<div class="social-badge">Follow</div>' +
      '<div class="social-icon">📸</div>' +
      '<div class="social-body">' +
        '<div class="social-title">Follow us on Instagram</div>' +
        '<div class="social-desc">Daily updates · Tournaments · Behind the scenes</div>' +
      '</div>' +
      '<div class="social-arrow">→</div>' +
    '</a>' +
    '<a class="social-link social-google" href="' + getGR() + '" target="_blank" rel="noopener">' +
      '<div class="social-badge">Rate Us</div>' +
      '<div class="social-icon">⭐</div>' +
      '<div class="social-body">' +
        '<div class="social-title">Review us on Google</div>' +
        '<div class="social-desc">Helps us grow · Takes 30 seconds</div>' +
      '</div>' +
      '<div class="social-arrow">→</div>' +
    '</a>' +
    '<button class="btn dark" style="margin-top:20px" onclick="changePin()">🔒 Change PIN</button>' +
    '<button class="btn dark" style="margin-top:8px" onclick="editName()">✏️ Change Name</button>' +
    '<button class="btn danger" style="margin-top:8px" onclick="signOut()">Sign Out</button>' +
    '<div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)"><div onclick="tapAdmin()" style="color:var(--muted);font-size:10px;letter-spacing:1.5px;cursor:pointer;padding:8px">YONDU · V1.0</div></div>' +
  '</div></div>';
};

window.changePhoto = function() {
  var inp = document.createElement("input");
  inp.type = "file"; inp.accept = "image/*";
  inp.onchange = function() {
    var f = inp.files && inp.files[0];
    readImageFile(f, function(dataUrl) {
      if (!dataUrl) return;
      var c = curC(); if (!c) return;
      c.profilePic = dataUrl;
      var a = CUST.slice();
      var i = a.findIndex(function(x) { return x.id === c.id; });
      if (i >= 0) a[i] = c;
      saveC(a);
      alert("✅ Photo updated!");
      render("profile", {});
    });
  };
  inp.click();
};
window.removePhoto = function() {
  var c = curC();
  if (!c || !confirm("Remove photo?")) return;
  c.profilePic = "";
  var a = CUST.slice();
  var i = a.findIndex(function(x) { return x.id === c.id; });
  if (i >= 0) a[i] = c;
  saveC(a);
  render("profile", {});
};
window.shareRef = function() {
  var c = curC(); if (!c) return;
  var m = "🎮 Join Yondu Gaming Café!\n\nUse my code: " + c.id + "\nGet " + REF_BONUS + " bonus points + 30 min FREE!\n\n👉 " + location.origin;
  if (navigator.share) navigator.share({ title: "Yondu", text: m }).catch(function() {});
  else window.open("https://wa.me/?text=" + encodeURIComponent(m), "_blank");
};
window.changePin = function() {
  var c = curC(); if (!c) return;
  var o = prompt("Current PIN:"); if (!o) return;
  if (!checkPin(o, c.pinHash)) return alert("Wrong PIN");
  var n = prompt("New 4-digit PIN:");
  if (!n || n.length !== 4 || !/^\d{4}$/.test(n)) return alert("Must be 4 digits");
  if (prompt("Confirm:") !== n) return alert("Don't match");
  var a = CUST.slice();
  c.pinHash = hashPin(n);
  var i = a.findIndex(function(x) { return x.id === c.id; });
  if (i >= 0) a[i] = c;
  saveC(a);
  alert("✅ PIN changed!");
  render("profile", {});
};
window.editName = function() {
  var c = curC(); if (!c) return;
  var n = prompt("New name:", c.name);
  if (!n || !n.trim()) return;
  var nn = n.trim();
  if (nn.length < 3) return alert("3+ chars");
  if (CUST.find(function(x) { return x.id !== c.id && x.name.toLowerCase() === nn.toLowerCase(); })) return alert("Name taken");
  var a = CUST.slice();
  c.name = nn;
  var i = a.findIndex(function(x) { return x.id === c.id; });
  if (i >= 0) a[i] = c;
  saveC(a);
  alert("✅ Changed");
  render("profile", {});
};

/* ===================== BOOK ===================== */
R.book = function() {
  var c = curC(); if (!c) return R.landing();
  if (!bk) bk = { exp: null, time: null, players: 1 };
  var e = EXP.find(function(x) { return x.id === bk.exp; });
  var expCards = EXP.map(function(ex) {
    return '<div class="card click ' + (bk.exp === ex.id ? "selected" : "") + '" onclick="pickE(\'' + ex.id + '\')"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:16px;font-weight:700;color:' + (bk.exp === ex.id ? "var(--gold)" : "var(--txt)") + '">' + ex.name + '</div>' + (bk.exp === ex.id ? '<span class="badge open">✓</span>' : "") + '</div><div style="color:var(--muted);font-size:13px;margin-top:4px">' + (ex.sub || "Popular") + '</div></div>';
  }).join("");
  var dur = "";
  if (e && !e.fixed) {
    var tiles = dursOf(bk.exp).map(function(m) {
      return '<div class="tile ' + (bk.time === m ? "on" : "") + '" onclick="pickT(' + m + ')"><div class="t">' + (m < 60 ? m + " min" : m / 60 + " hour" + (m > 60 ? "s" : "")) + '</div></div>';
    }).join("");
    dur = '<div class="sec-label" style="margin-top:20px">02 · Duration</div><div class="grid2">' + tiles + '</div>' +
      '<div class="sec-label" style="margin-top:20px">03 · Players</div>' +
      '<div class="card" style="display:flex;align-items:center;justify-content:space-between;padding:14px">' +
      '<button class="qty-btn" style="width:48px;height:48px" onclick="chP(-1)">−</button>' +
      '<div style="font-size:32px;font-weight:800;color:var(--gold-bright)">' + bk.players + '</div>' +
      '<button class="qty-btn plus" style="width:48px;height:48px" onclick="chP(1)">+</button></div>';
  }
  var cf = e ? '<div style="position:fixed;bottom:80px;left:0;right:0;background:rgba(21,24,33,0.95);backdrop-filter:blur(20px);border-top:1px solid var(--border);padding:14px 20px;z-index:50"><button class="btn" style="width:100%" onclick="submitBk()">Request Booking →</button></div>' : "";
  return '<div class="screen"><div class="wrap" style="padding-bottom:120px">' +
    '<div class="brand"><div class="brand-icon"></div><div class="brand-txt"><div class="g">Jay Shree Ganesha</div><div class="n">Start Booking</div><div class="s">' + c.name + ' · ' + c.id + '</div></div></div>' +
    '<div class="sec-label">01 · Choose Experience</div>' + expCards + dur +
    '<div class="notice gold" style="margin-top:20px">💡 Payment at counter. Admin assigns your station.</div>' +
  '</div></div>' + cf;
};
window.pickE = function(id) {
  bk.exp = id;
  var e = EXP.find(function(x) { return x.id === id; });
  if (e.fixed) bk.time = null;
  else if (!bk.time) bk.time = dursOf(id)[0];
  render("book", {});
};
window.pickT = function(m) { bk.time = m; render("book", {}); };
window.chP = function(d) { var n = bk.players + d; if (n < 1 || n > 8) return; bk.players = n; render("book", {}); };
window.submitBk = function() {
  var c = curC(); if (!c) return;
  var e = EXP.find(function(x) { return x.id === bk.exp; });
  if (!e) return alert("Pick an experience");
  var isMem = (e.id === "member" || e.id === "racemem");
  var min = isMem ? 1800 : (bk.time || 60);
  var items = [e.name];
  if (bk.time && !e.fixed && !isMem) items.push(bk.time + "min × " + bk.players + "p");
  var s = { id: newBID(), name: c.name, phone: "", expId: e.id, expName: e.name, items: items,
    total: e.fixed || 0, minutes: min, players: bk.players,
    method: "cash", paid: false, status: "pending",
    createdAt: Date.now(), customerId: c.id, isMembership: isMem };
  upsertS(s);
  bk = null;
  alert("✅ Booking sent!\n\nYour # " + c.id);
  go("confirm", { id: s.id });
};

/* ===================== CONFIRM ===================== */
R.confirm = function(p) {
  var s = getSess(p.id);
  if (!s) return '<div class="screen"><div class="wrap"><h2>Not found</h2></div></div>';
  return '<div class="screen"><div class="wrap">' +
    '<div class="notice gold">📌 Show at counter</div>' +
    '<div class="card" style="text-align:center;padding:24px"><div class="sub" style="margin:0 0 8px;font-size:11px;letter-spacing:2px;font-weight:700">BOOKING ID</div><div style="font-size:26px;font-weight:800;letter-spacing:3px;color:var(--gold-bright);font-family:\'Courier New\',monospace">' + s.id + '</div></div>' +
    '<div class="card" style="text-align:center"><div style="color:var(--gold);font-size:10px;font-weight:700;letter-spacing:2px">YOUR NUMBER</div><div style="font-size:32px;font-weight:800;letter-spacing:4px;color:var(--gold-bright);font-family:\'Courier New\',monospace;margin-top:6px">' + (s.customerId || "----") + '</div></div>' +
    '<div class="card"><div style="font-size:16px;font-weight:700;margin-bottom:8px">' + s.name + '</div><div style="color:var(--muted);font-size:13px;margin-bottom:10px">' + s.items.join(" · ") + '</div><span class="badge pending">⏳ PENDING</span></div>' +
    '<button class="btn dark" onclick="go(\'mybookings\')">My Bookings</button>' +
    '<button class="btn" style="margin-top:8px" onclick="go(\'book\')">Book Another</button>' +
  '</div></div>';
};

/* ===================== MY BOOKINGS ===================== */
R.mybookings = function() {
  var c = curC(); if (!c) return R.landing();
  var mine = SESS.filter(function(s) { return s.customerId === c.id; });
  if (!mine.length) return '<div class="screen"><div class="wrap"><h1>My Bookings</h1><div class="empty"><div class="big">📋</div><div class="msg">NO BOOKINGS</div><button class="btn" style="max-width:280px;margin:20px auto 0" onclick="go(\'book\')">Book Now</button></div></div></div>';
  var now = Date.now();
  var cards = mine.slice(0, 20).map(function(s) {
    var st = s.status, ts = "", cls = "";
    if (s.status === "playing" && s.start) {
      if (s.isMembership) {
        var p = now - s.start;
        ts = String(Math.floor(p / 60000)).padStart(2, "0") + ":" + String(Math.floor((p % 60000) / 1000)).padStart(2, "0");
      } else if (s.end) {
        var l = s.end - now;
        if (l <= 0) { st = "ended"; ts = "TIME UP"; cls = "over"; }
        else {
          ts = String(Math.floor(l / 60000)).padStart(2, "0") + ":" + String(Math.floor((l % 60000) / 1000)).padStart(2, "0");
          cls = l < 5 * 60000 ? "over" : l < 15 * 60000 ? "warn" : "";
        }
      }
    }
    var stCol = { pending: "var(--gold-bright)", paid: "var(--cyan)", playing: "var(--cyan)", ended: "var(--muted)" };
    return '<div class="card click" onclick="go(\'session\',{id:\'' + s.id + '\'})">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><div style="font-size:15px;font-weight:700">' + s.name + '</div>' +
      '<span class="badge" style="background:var(--card2);color:' + (stCol[st] || "var(--muted)") + '">' + st.toUpperCase() + '</span></div>' +
      '<div style="color:var(--muted);font-size:13px;margin-bottom:10px">' + s.items.join(" · ") + '</div>' +
      (ts ? '<div class="timer-huge ' + cls + '" style="font-size:36px;text-align:left">' + ts + '</div>' : "") +
      '<div style="font-size:11px;color:var(--muted);font-weight:700">' + s.id + '</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><h1>My Bookings</h1>' + cards + '</div></div>';
};

/* ===================== SNACKS ===================== */
R.snacks = function() {
  var c = curC(); if (!c) return R.landing();
  var cnt = Object.keys(sc).reduce(function(s, k) { return s + sc[k]; }, 0);
  var total = Object.keys(sc).reduce(function(s, id) { var a = ADD.find(function(x) { return x.id === id; }); return s + (a ? a.price * sc[id] : 0); }, 0);
  var ptsTotal = Object.keys(sc).reduce(function(s, id) { var a = ADD.find(function(x) { return x.id === id; }); return s + (a ? (a.points_price || 0) * sc[id] : 0); }, 0);
  var items = ADD.length ? ADD.map(function(a) {
    var q = sc[a.id] || 0;
    var ctrl = q === 0
      ? '<button class="qty-btn plus" onclick="addS(\'' + a.id + '\')">+</button>'
      : '<button class="qty-btn" onclick="remS(\'' + a.id + '\')">−</button><div class="qty-num">' + q + '</div><button class="qty-btn plus" onclick="addS(\'' + a.id + '\')">+</button>';
    return '<div class="snack-row"><div class="snack-photo">🍽️</div><div class="snack-info"><div class="snack-name">' + a.name + '</div><div class="snack-sub">₹' + a.price + (a.points_price ? " · " + a.points_price + " pts" : "") + '</div></div><div style="display:flex;align-items:center;gap:6px">' + ctrl + '</div></div>';
  }).join("") : '<div class="empty"><div class="big">🍟</div><div class="msg">NO ITEMS</div></div>';
  var sticky = cnt ? '<div style="position:fixed;bottom:80px;left:0;right:0;background:rgba(21,24,33,0.95);backdrop-filter:blur(20px);border-top:2px solid var(--gold);padding:14px 20px;z-index:50;display:flex;gap:12px;align-items:center"><div style="flex:1"><div style="color:var(--muted);font-size:10px;font-weight:700">' + cnt + ' ITEM' + (cnt > 1 ? "S" : "") + '</div><div style="font-size:22px;font-weight:800;color:var(--gold-bright)">₹' + total + '</div><div style="color:var(--gold);font-size:12px">or ' + ptsTotal + ' pts</div></div><button class="btn pink" style="width:auto;padding:14px 24px" onclick="openSC()">Order →</button></div>' : "";
  return '<div class="screen"><div class="wrap" style="padding-bottom:180px">' +
    '<div class="brand"><div class="brand-icon">🍟</div><div class="brand-txt"><div class="g">Jay Shree Ganesha</div><div class="n">Snacks & Drinks</div><div class="s">PAY AT COUNTER</div></div></div>' +
    '<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;margin-bottom:14px"><div><div style="color:var(--gold);font-size:10px;font-weight:700;letter-spacing:1.5px">YOUR POINTS</div><div style="font-size:24px;font-weight:800;color:var(--gold-bright);margin-top:4px">' + c.points + '</div></div></div>' +
    items + '</div></div>' + sticky;
};
window.addS = function(id) { sc[id] = (sc[id] || 0) + 1; render("snacks", {}); };
window.remS = function(id) { if (sc[id]) sc[id]--; if (sc[id] <= 0) delete sc[id]; render("snacks", {}); };
window.openSC = function() {
  var c = curC(); if (!c) return;
  var total = Object.keys(sc).reduce(function(s, id) { var a = ADD.find(function(x) { return x.id === id; }); return s + (a ? a.price * sc[id] : 0); }, 0);
  var ptsTotal = Object.keys(sc).reduce(function(s, id) { var a = ADD.find(function(x) { return x.id === id; }); return s + (a ? (a.points_price || 0) * sc[id] : 0); }, 0);
  if (total <= 0) return;
  var m = document.createElement("div");
  m.id = "scm"; m.className = "modal";
  m.innerHTML = '<div class="sheet"><h2>Send Order</h2><div class="s">Total: ₹' + total + (ptsTotal ? " · or " + ptsTotal + " pts" : "") + '</div><label>Note <span class="opt">(optional)</span></label><input id="snote" placeholder="e.g. extra ice"><div class="notice gold">📲 Order goes to admin. Pay or use points at counter.</div><button class="btn pink" onclick="submitSO()">Send Order →</button><button class="btn dark" style="margin-top:8px" onclick="document.getElementById(\'scm\').remove()">Cancel</button></div>';
  document.body.appendChild(m);
};
window.submitSO = function() {
  var c = curC(); if (!c) return;
  var note = document.getElementById("snote") ? document.getElementById("snote").value.trim() : "";
  var lines = Object.keys(sc).map(function(id) { var a = ADD.find(function(x) { return x.id === id; }); return a ? a.name + " × " + sc[id] : ""; }).filter(Boolean);
  var total = Object.keys(sc).reduce(function(s, id) { var a = ADD.find(function(x) { return x.id === id; }); return s + (a ? a.price * sc[id] : 0); }, 0);
  var ptsTotal = Object.keys(sc).reduce(function(s, id) { var a = ADD.find(function(x) { return x.id === id; }); return s + (a ? (a.points_price || 0) * sc[id] : 0); }, 0);
  var r = { id: "RQ" + Date.now().toString(36).toUpperCase().slice(-6), type: "snack", customerId: c.id, sessionId: null, customerName: c.name, items: lines, total: total, pointsUsed: ptsTotal, minutes: 0, status: "pending", note: note, createdAt: Date.now(), processedAt: 0 };
  upsertReq(r);
  document.getElementById("scm").remove();
  sc = {};
  alert("✅ Sent! Show at counter.");
  go("home");
};

/* ===================== TOURNAMENTS ===================== */
R.tournaments = function() {
  var c = curC(); if (!c) return R.landing();
  var open = TOURN.filter(function(t) { return t.status !== "done"; });
  var past = TOURN.filter(function(t) { return t.status === "done"; });
  return '<div class="screen"><div class="wrap">' +
    '<div class="brand"><div class="brand-icon">🏆</div><div class="brand-txt"><div class="g">Compete & Win</div><div class="n">Tournaments</div><div class="s">' + open.length + ' upcoming</div></div></div>' +
    (open.length ? open.map(function(t) { return tCrd(t); }).join("") : '<div class="empty"><div class="big">🏆</div><div class="msg">NO TOURNAMENTS</div></div>') +
    (past.length ? '<h2 style="margin-top:24px">Past</h2>' + past.slice(0, 3).map(function(t) { return tCrd(t, true); }).join("") : "") +
  '</div></div>';
};

function tCrd(t, dim) {
  var players = t.players || [];
  var f = players.length;
  var full = f >= (t.maxPlayers || 16);
  var sb2 = t.status === "done" ? '<span class="badge done">FINISHED</span>' : t.status === "live" ? '<span class="badge live">● LIVE</span>' : full ? '<span class="badge full">SOLD OUT</span>' : '<span class="badge open">● OPEN</span>';
  var dt = (t.date && t.time) ? new Date(t.date + "T" + t.time) : new Date();
  var ml = Math.max(0, dt - Date.now());
  var dl = Math.floor(ml / 86400000);
  var hl = Math.floor((ml % 86400000) / 3600000);
  var cd = t.status === "done" ? "Finished" : t.status === "live" ? "LIVE" : ml <= 0 ? "Soon" : dl > 0 ? dl + "d left" : hl + "h left";
  var header = t.bannerPic
    ? '<img src="' + t.bannerPic + '" style="width:100%;height:130px;object-fit:cover;display:block"><div style="background:var(--card2);padding:14px 18px;position:relative"><div style="position:absolute;top:10px;right:12px">' + sb2 + '</div><div style="font-size:16px;font-weight:800">' + t.name + '</div><div style="color:var(--cyan);font-size:12px;font-weight:700;margin-top:3px">🎮 ' + t.game + '</div></div>'
    : '<div style="background:linear-gradient(135deg,#1a1508,#0d0b05);padding:18px;position:relative"><div style="position:absolute;top:12px;right:12px">' + sb2 + '</div><div style="font-size:38px">' + (t.banner || "🏆") + '</div><div style="font-size:18px;font-weight:800;margin-top:8px">' + t.name + '</div><div style="color:var(--cyan);font-size:13px;font-weight:700;margin-top:4px">🎮 ' + t.game + '</div></div>';
  return '<div class="t-card" onclick="go(\'detail\',{id:\'' + t.id + '\'})">' + header +
    '<div style="padding:16px 18px 18px"><div class="grid2" style="margin-bottom:12px">' +
    '<div style="background:var(--card2);padding:10px;border-radius:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">DATE</div><div style="font-size:13px;font-weight:800;margin-top:4px">' + dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + '</div></div>' +
    '<div style="background:var(--card2);padding:10px;border-radius:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">SLOTS</div><div style="font-size:13px;font-weight:800;color:var(--cyan);margin-top:4px">' + f + '/' + (t.maxPlayers || 16) + '</div></div></div>' +
    '<div class="progress" style="margin:0"><div style="width:' + Math.round(f / (t.maxPlayers || 16) * 100) + '%"></div></div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:12px;align-items:center"><div style="font-size:12px;color:var(--muted);font-weight:700">⏰ ' + cd + '</div><div style="color:var(--gold);font-weight:800;font-size:13px">' + (dim ? "View →" : "Register →") + '</div></div></div></div>';
}

R.detail = function(p) {
  var t = getTid(p.id); if (!t) return '<div class="screen"><div class="wrap"><h2>Not found</h2></div></div>';
  var players = t.players || [];
  var f = players.length;
  var full = f >= (t.maxPlayers || 16);
  var dt = new Date(t.date + "T" + t.time);
  var c = curC();
  var already = c && players.find(function(pl) { return pl.customerId === c.id; });
  var prizes = [{ med: "🥇", label: "1ST", val: t.prize1 }, { med: "🥈", label: "2ND", val: t.prize2 }, { med: "🥉", label: "3RD", val: t.prize3 }, { med: "4️⃣", label: "4TH", val: t.prize4 }].filter(function(p2) { return p2.val; });
  var prizeHTML = prizes.length ? '<div class="card" style="background:#1a1508;border:2px solid var(--gold);margin-top:12px"><div style="text-align:center;margin-bottom:14px"><div style="color:var(--gold);font-size:12px;font-weight:800;letter-spacing:2px">🏆 PRIZES</div></div>' + prizes.map(function(p2) { return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(201,169,97,.08);border-radius:8px;margin-bottom:8px"><div style="font-size:24px">' + p2.med + '</div><div><div style="color:var(--gold);font-size:10px;font-weight:800">' + p2.label + '</div><div style="font-weight:700;font-size:14px">' + p2.val + '</div></div></div>'; }).join("") + '</div>' : "";
  var playerHTML = !f ? '<div style="text-align:center;padding:24px;color:var(--muted)"><div style="font-size:36px">👤</div><div style="font-weight:700;margin-top:8px">Be the first!</div></div>' : players.map(function(pl, i) {
    var init = (pl.name || "?").charAt(0).toUpperCase();
    var clr = ["#22d3ee", "#ec4899", "#c9a961", "#a78bfa", "#22c55e", "#fb923c"][i % 6];
    return '<div class="player-pill"><div style="width:36px;height:36px;border-radius:50%;background:' + clr + '22;border:2px solid ' + clr + ';color:' + clr + ';display:flex;align-items:center;justify-content:center;font-weight:800">' + init + '</div><div style="flex:1"><div style="font-weight:700">' + pl.name + '</div></div><span class="badge ' + (pl.paid ? "open" : "cash") + '">' + (pl.paid ? "Paid" : "Pending") + '</span></div>';
  }).join("");
  var action = "";
  if (t.status !== "done") {
    if (!curC()) action = '<div style="position:fixed;bottom:80px;left:0;right:0;background:rgba(21,24,33,0.95);padding:14px 20px;z-index:50"><button class="btn" style="width:100%" onclick="go(\'landing\')">Sign up to Register →</button></div>';
    else if (already) action = '<div style="position:fixed;bottom:80px;left:0;right:0;background:rgba(21,24,33,0.95);padding:16px 20px;z-index:50"><div style="text-align:center;color:var(--gold-bright);font-weight:800">✅ Registered — #' + already.id + '</div></div>';
    else if (full) action = '<div style="position:fixed;bottom:80px;left:0;right:0;background:rgba(21,24,33,0.95);padding:16px 20px;z-index:50"><div style="text-align:center;color:#f87171;font-weight:800">❌ Full</div></div>';
    else action = '<div style="position:fixed;bottom:80px;left:0;right:0;background:rgba(21,24,33,0.95);padding:14px 20px;z-index:50"><button class="btn pink" style="width:100%" onclick="openJ(\'' + t.id + '\')">Register →</button></div>';
  }
  return '<div class="screen"><div class="wrap" style="padding-bottom:120px"><a href="javascript:go(\'tournaments\')" style="color:var(--muted);font-weight:600;font-size:13px">← Tournaments</a><div class="t-hero" style="margin-top:12px;padding:0;overflow:hidden;border-radius:12px">' + (t.bannerPic ? '<img src="' + t.bannerPic + '" style="width:100%;height:180px;object-fit:cover;display:block">' : "") + '<div style="padding:28px 20px">' + (!t.bannerPic ? '<div style="font-size:52px">' + (t.banner || "🏆") + '</div>' : "") + '<div class="title">' + t.name + '</div><div class="game">🎮 ' + t.game + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px"><div style="background:rgba(201,169,97,.1);padding:10px;border-radius:8px;text-align:center"><div style="font-size:10px;color:var(--gold);font-weight:700">DATE</div><div style="font-size:14px;font-weight:700;margin-top:4px">' + dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + '</div></div><div style="background:rgba(34,211,238,.1);padding:10px;border-radius:8px;text-align:center"><div style="font-size:10px;color:var(--cyan);font-weight:700">TIME</div><div style="font-size:14px;font-weight:700;margin-top:4px">' + fmtTime(t.time) + '</div></div></div></div></div>' + prizeHTML + '<div class="card"><h2>👥 Players (' + f + '/' + (t.maxPlayers || 16) + ')</h2><div class="progress" style="margin:12px 0"><div style="width:' + Math.round(f / (t.maxPlayers || 16) * 100) + '%"></div></div>' + playerHTML + '</div></div></div>' + action;
};
window.openJ = function(tid) {
  var t = getTid(tid); var c = curC();
  if (!c) return alert("Sign in first");
  var alr = (t.players || []).find(function(pl) { return pl.customerId === c.id; });
  if (alr) return alert("❌ Already! Your #: " + alr.id);
  var m = document.createElement("div");
  m.id = "jm"; m.className = "modal";
  m.innerHTML = '<div class="sheet"><h2>Register · ' + t.name + '</h2><div class="s">' + t.game + '</div><div class="notice gold" style="margin-bottom:14px">✅ As <b>' + c.name + '</b><br>ID: <b style="color:var(--gold-bright)">' + c.id + '</b></div><label>Gamer Tag <span class="opt">(optional)</span></label><input id="jgt" maxlength="20"><label>Team Name <span class="opt">(optional)</span></label><input id="jtm" maxlength="20"><label style="display:flex;align-items:center;gap:10px;text-transform:none;font-size:13px;font-weight:600;margin-bottom:12px"><input type="checkbox" id="jagree" style="width:auto;margin:0;transform:scale(1.3);accent-color:var(--gold)"><span>I agree to the rules</span></label><button class="btn pink" onclick="submitJ(\'' + tid + '\')">Confirm</button><button class="btn dark" style="margin-top:8px" onclick="document.getElementById(\'jm\').remove()">Cancel</button></div>';
  document.body.appendChild(m);
};
window.submitJ = function(tid) {
  var t = getTid(tid); var c = curC();
  if (!c) return;
  t.players = t.players || [];
  if (t.players.find(function(pl) { return pl.customerId === c.id; })) return alert("❌ Already");
  if (!document.getElementById("jagree").checked) return alert("Agree to rules");
  var gt = document.getElementById("jgt").value.trim();
  var tm = document.getElementById("jtm").value.trim();
  var num, tries = 0;
  do { num = String(Math.floor(100 + Math.random() * 900)); tries++; if (tries > 500) break; } while (t.players.find(function(pl) { return pl.id === num; }));
  var pl = { id: num, name: c.name, gamerTag: gt, teamName: tm, method: "cash", paid: false, joinedAt: Date.now(), customerId: c.id };
  t.players.push(pl);
  upsertT(t);
  document.getElementById("jm").remove();
  alert("✅ Registered!\n\nYour #: " + num);
  go("ticket", { tid: tid, pid: pl.id });
};
R.ticket = function(p) {
  var t = getTid(p.tid); if (!t) return R.tournaments();
  var pl = (t.players || []).find(function(x) { return x.id === p.pid; });
  if (!pl) return R.tournaments();
  return '<div class="screen"><div class="wrap" style="max-width:460px"><div class="t-hero" style="border-radius:12px;padding:22px">' + (t.bannerPic ? '<img src="' + t.bannerPic + '" style="width:100%;height:100px;object-fit:cover;border-radius:8px">' : '<div style="font-size:40px">' + (t.banner || "🎫") + '</div>') + '<div style="color:var(--pink);font-size:11px;font-weight:700;letter-spacing:2px;margin-top:8px">OFFICIAL TICKET</div><div style="font-size:18px;font-weight:800;margin-top:4px">' + t.name + '</div></div><div class="id-card" style="margin-top:14px;padding:28px 20px"><div class="label">YOUR NUMBER</div><div class="idnum" style="font-size:70px;letter-spacing:8px">' + pl.id + '</div><div class="hint" style="color:var(--gold-bright);font-weight:700;margin-top:10px">' + pl.name + '</div></div><div class="notice gold">💵 Pay entry at counter</div><button class="btn dark" onclick="go(\'tournaments\')">← Back</button></div></div>';
};

/* ===================== SESSION ===================== */
R.session = function(p) {
  var s = getSess(p.id); if (!s) return '<div class="screen"><div class="wrap"><h2>Not found</h2></div></div>';
  var playHTML = "";
  if (s.status === "playing") playHTML = '<div class="card" style="text-align:center;padding:22px"><div style="color:var(--gold);font-size:11px;letter-spacing:2px;font-weight:700">' + (s.isMembership ? "MEMBERSHIP · TIME PLAYED" : "TIME REMAINING") + '</div><div class="timer-huge" id="stimer">--:--</div></div>';
  else playHTML = '<div class="notice">Status: ' + s.status + '</div>';
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'mybookings\')" style="color:var(--muted);font-weight:600;font-size:13px">← Back</a><h1 style="margin-top:20px">' + s.name + '</h1><p class="sub">' + s.id + '</p>' + playHTML + '<div class="card" style="margin-top:16px">' + (s.items || []).map(function(i) { return '<div style="padding:4px 0;color:#cbd5e1;font-size:14px">' + i + '</div>'; }).join("") + '</div></div></div>';
};
R.session.after = function(p) {
  var s = getSess(p.id);
  if (!s || s.status !== "playing" || !s.start) return;
  var el = document.getElementById("stimer");
  if (!el) return;
  var tick = function() {
    if (s.isMembership) {
      var p2 = Date.now() - s.start;
      el.textContent = String(Math.floor(p2 / 60000)).padStart(2, "0") + ":" + String(Math.floor((p2 % 60000) / 1000)).padStart(2, "0");
      el.className = "timer-huge"; return;
    }
    var l = s.end - Date.now();
    if (l <= 0) { el.textContent = "00:00"; el.className = "timer-huge over"; return; }
    el.textContent = String(Math.floor(l / 60000)).padStart(2, "0") + ":" + String(Math.floor((l % 60000) / 1000)).padStart(2, "0");
    el.className = "timer-huge" + (l < 5 * 60000 ? " over" : l < 15 * 60000 ? " warn" : "");
  };
  tick(); setInterval(tick, 1000);
};

/* ===================== LIVE SYNC ===================== */
function showLiveBadge(msg) {
  var el = document.getElementById("live-badge");
  if (!el) {
    el = document.createElement("div");
    el.id = "live-badge";
    el.style.cssText = "position:fixed;top:12px;left:50%;transform:translateX(-50%) translateY(-80px);background:linear-gradient(135deg,#c9a961,#e8d5a3);color:#111;padding:10px 20px;border-radius:20px;font-size:12px;font-weight:800;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.6);transition:transform .4s";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(0)"; }, 20);
  setTimeout(function() { el.style.transform = "translateX(-50%) translateY(-80px)"; }, 3000);
}
function isTypingInField() {
  var a = document.activeElement;
  if (!a) return false;
  var tag = (a.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}
function rtRefresh() {
  var wasTyping = isTypingInField();
  var wasInModal = !!document.querySelector(".modal");
  loadAll().then(function() {
    var c = curC();
    if (curR === "pending" && c && c.activated) {
      showLiveBadge("✅ Activated! Welcome.");
      setTimeout(function() { go("home"); }, 800);
      return;
    }
    if (wasTyping || wasInModal) return;
    if (curR) render(curR, {});
  }).catch(function(e) { console.error(e); });
}
function setupRealtime() {
  if (!sb) return;
  try { sb.removeAllChannels(); } catch(e) {}
  ["customers", "sessions", "tournaments", "requests", "addons", "settings"].forEach(function(t) {
    try {
      sb.channel("live-" + t).on("postgres_changes", { event: "*", schema: "public", table: t }, function(payload) {
        if (payload.eventType === "UPDATE" && t === "customers") {
          var newRow = payload.new || {}; var me = curC();
          if (me && newRow.id === me.id) {
            if (newRow.activated && !me.activated) showLiveBadge("✅ Account activated!");
            else if ((newRow.points || 0) !== (me.points || 0)) showLiveBadge("💰 Points updated");
          }
        }
        if (payload.eventType === "UPDATE" && t === "sessions") {
          var row = payload.new || {}; var me2 = curC();
          if (me2 && row.customer_id === me2.id) {
            if (row.status === "playing" && row.start_time) showLiveBadge("🎮 Session started!");
            else if (row.status === "ended") showLiveBadge("⏹ Session ended");
            else if (row.status === "paid") showLiveBadge("💰 Payment received");
          }
        }
        if (payload.eventType === "UPDATE" && t === "requests") {
          var rr = payload.new || {}; var me3 = curC();
          if (me3 && rr.customer_id === me3.id) {
            if (rr.status === "approved") showLiveBadge("✅ Order approved!");
            else if (rr.status === "done") showLiveBadge("🍟 Order delivered!");
          }
        }
        rtRefresh();
      }).subscribe();
    } catch(e) { console.error(e); }
  });
}

/* ===================== STARTUP ===================== */
document.getElementById("app").innerHTML = '<div class="screen"><div class="wrap"><div class="empty"><div class="big">⏳</div><div class="msg">LOADING</div></div></div></div>';
loadAll().then(function() {
  var c = curC();
  if (c) { if (!c.activated) go("pending"); else go("home"); }
  else if (isGuest()) go("guest_home");
  else go("landing");
  setupRealtime();
}).catch(function(e) {
  console.error("Load failed:", e);
  document.getElementById("app").innerHTML = '<div class="screen"><div class="wrap"><div class="empty"><div class="big">❌</div><div class="msg">CONNECTION FAILED</div><p style="color:var(--muted);margin-top:10px;font-size:13px">Check internet & refresh</p><button class="btn" style="max-width:280px;margin:20px auto 0" onclick="location.reload()">Retry</button></div></div></div>';
});
