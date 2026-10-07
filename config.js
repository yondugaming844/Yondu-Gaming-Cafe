/* YONDU CONFIG */

var SB_URL = "https://murcilacjeoemdgrfwpl.supabase.co";
var SB_KEY = "sb_publishable_7exYurU_LMovVH8jHysPmg_YaY76aci";
var sb = null;
try { sb = window.supabase.createClient(SB_URL, SB_KEY); } catch(e) { console.error(e); }

var RR = 20, POINTS_MAX = 10000, POINTS_PER_HOUR = 1000, REF_BONUS = 50, BDAY_BONUS = 100;
var YEARS_MS = 365 * 24 * 60 * 60 * 1000;
var CAFE_PHONE = "+91 90000 00000";

var STA_DEF = [
  { id: "ps5-1", name: "PS5 · 1" },{ id: "ps5-2", name: "PS5 · 2" },
  { id: "ps5-3", name: "PS5 · 3" },{ id: "ps5-4", name: "PS5 · 4" },
  { id: "race-1", name: "Racing Simulator" }
];
var EXP_DEF = [
  { id: "ps5old", name: "PS5 · Older Games", from: 60, prices: { 30: 60, 60: 100, 120: 200, 180: 250 }, sub: "Timeless classics" },
  { id: "ps5new", name: "PS5 · New Games", from: 80, prices: { 30: 80, 60: 140, 120: 280, 180: 380 }, sub: "Latest AAA titles" },
  { id: "racing", name: "Racing Simulator", from: 200, prices: { 60: 200, 180: 550 }, durs: [60, 180], sub: "Wheel · Pedals" },
  { id: "member", name: "PS5 Monthly Membership", from: 2300, fixed: 2300, sub: "30 hours PS5" },
  { id: "racemem", name: "Racing Membership", from: 3000, fixed: 3000, sub: "30 hours racing" }
];
var ADD_DEF = [
  { id: "water", name: "Water Bottle", price: 20, points_price: 20, photo: "" },
  { id: "soft", name: "Soft Drink", price: 40, points_price: 40, photo: "" },
  { id: "juice", name: "Fresh Juice", price: 50, points_price: 50, photo: "" },
  { id: "coffee", name: "Coffee", price: 40, points_price: 40, photo: "" },
  { id: "tea", name: "Tea", price: 20, points_price: 20, photo: "" },
  { id: "energy", name: "Energy Drink", price: 125, points_price: 125, photo: "" },
  { id: "chips", name: "Chips", price: 30, points_price: 30, photo: "" },
  { id: "samosa", name: "Samosa", price: 20, points_price: 20, photo: "" },
  { id: "sand", name: "Sandwich", price: 60, points_price: 60, photo: "" },
  { id: "fries", name: "French Fries", price: 80, points_price: 80, photo: "" }
];
var CAFE_INFO = { hours: "Mon-Sun · 10:00 AM - 11:00 PM", address: "Vadodara, Gujarat", phone: CAFE_PHONE };

var CUST = [], SESS = [], TOURN = [], REQ = [], STA = [], EXP = [], ADD = [], ADMINS = [];
var SETTINGS = null;

function hashPin(p) {
  var h = 5381, s = "ysalt" + p + "ysalt";
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return "h" + (h >>> 0).toString(36);
}
function checkPin(p, h) { return hashPin(p) === h; }

function readImageFile(file, cb) {
  if (!file) return cb(null);
  if (!file.type || file.type.indexOf("image/") !== 0) { alert("Please choose an image file"); return cb(null); }
  if (file.size > 5 * 1024 * 1024) { alert("Image too large (max 5MB)"); return cb(null); }
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var max = 256, w = img.width, h = img.height;
      if (w >= h && w > max) { h = Math.round(h * max / w); w = max; }
      else if (h > w && h > max) { w = Math.round(w * max / h); h = max; }
      var cvs = document.createElement("canvas");
      cvs.width = w; cvs.height = h;
      cvs.getContext("2d").drawImage(img, 0, 0, w, h);
      try { cb(cvs.toDataURL("image/jpeg", 0.8)); } catch(err) { cb(null); }
    };
    img.onerror = function() { alert("Could not read image"); cb(null); };
    img.src = e.target.result;
  };
  reader.onerror = function() { alert("Could not read file"); cb(null); };
  reader.readAsDataURL(file);
}

function fmtTime(t) { if (!t) return "--"; var p = String(t).split(":"); var hh = parseInt(p[0], 10); var ap = hh >= 12 ? "PM" : "AM"; var h12 = hh % 12 || 12; return h12 + ":" + p[1] + " " + ap; }
function money(n) { return "₹" + (Number(n) || 0).toLocaleString("en-IN"); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function getGR() { return localStorage.getItem("yondu_google_review") || "https://g.page"; }
function getIG() { return localStorage.getItem("yondu_instagram") || "https://instagram.com/yondugamingcafe"; }

var DB = {
  get: function(k, d) { try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch(e) { return d; } },
  set: function(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} },
  del: function(k) { try { localStorage.removeItem(k); } catch(e) {} }
};

function normC(r) { return { id: r.id, name: r.name, phone: r.phone || "", birthday: r.birthday || "", pinHash: r.pin_hash, points: r.points || 0, pointsSpent: r.points_spent || 0, ps5Hours: r.ps5_hours || 0, raceHours: r.race_hours || 0, totalSpent: Number(r.total_spent) || 0, visits: r.visits || 0, activated: !!r.activated, vip: !!r.vip, banned: !!r.banned, profilePic: r.profile_pic || "", credit: r.credit || 0, creditUsed: !!r.credit_used, referrals: r.referrals || 0, referredBy: r.referred_by || null, birthdayAwarded: r.birthday_awarded || 0, lastActivity: r.last_activity || 0, pointsExpiredAt: r.points_expired_at || 0, createdAt: r.created_at || Date.now() }; }
function denormC(c) { return { id: c.id, name: c.name, phone: c.phone || null, birthday: c.birthday || null, pin_hash: c.pinHash, points: c.points || 0, points_spent: c.pointsSpent || 0, ps5_hours: c.ps5Hours || 0, race_hours: c.raceHours || 0, total_spent: c.totalSpent || 0, visits: c.visits || 0, activated: !!c.activated, vip: !!c.vip, banned: !!c.banned, profile_pic: c.profilePic || null, credit: c.credit || 0, credit_used: !!c.creditUsed, referrals: c.referrals || 0, referred_by: c.referredBy || null, birthday_awarded: c.birthdayAwarded || 0, last_activity: c.lastActivity || 0, points_expired_at: c.pointsExpiredAt || 0, created_at: c.createdAt || Date.now() }; }

function normS(r) { var items = []; try { items = JSON.parse(r.items || "[]"); } catch(e) {} return { id: r.id, name: r.name, phone: r.phone || "", expId: r.exp_id, expName: r.exp_name, items: items, total: Number(r.total) || 0, minutes: r.minutes || 0, players: r.players || 1, method: r.method || "cash", paid: !!r.paid, status: r.status || "pending", stationId: r.station_id || null, start: r.start_time || null, end: r.end_time || null, customerId: r.customer_id || null, pointsEarned: r.points_earned || 0, isMembership: !!r.is_membership, createdAt: r.created_at || Date.now() }; }
function denormS(s) { return { id: s.id, name: s.name, phone: s.phone || null, exp_id: s.expId || null, exp_name: s.expName || null, items: JSON.stringify(s.items || []), total: s.total || 0, minutes: s.minutes || 0, players: s.players || 0, method: s.method || "cash", paid: !!s.paid, status: s.status || "pending", station_id: s.stationId || null, start_time: s.start || null, end_time: s.end || null, customer_id: s.customerId || null, points_earned: s.pointsEarned || 0, is_membership: !!s.isMembership, created_at: s.createdAt || Date.now() }; }

function normT(r) { var p = [], b = [], w = []; try { p = JSON.parse(r.players || "[]"); } catch(e) {} try { b = JSON.parse(r.bracket || "[]"); } catch(e) {} try { w = JSON.parse(r.winners || "[]"); } catch(e) {} return { id: r.id, name: r.name, game: r.game, date: r.date || "", time: (r.time || "").slice(0, 5), entryFee: r.entry_fee || 0, maxPlayers: r.max_players || 16, winnersCount: r.winners_count || 3, banner: r.banner || "🏆", bannerPic: r.banner_pic || "", description: r.description || "", prize1: r.prize1 || "", prize2: r.prize2 || "", prize3: r.prize3 || "", prize4: r.prize4 || "", rules: r.rules || "", status: r.status || "open", players: p, bracket: b, winners: w, winner: r.winner || null, createdAt: r.created_at || Date.now() }; }
function denormT(t) { return { id: t.id, name: t.name, game: t.game, date: t.date || null, time: t.time || null, entry_fee: t.entryFee || 0, max_players: t.maxPlayers || 16, winners_count: t.winnersCount || 3, banner: t.banner || "🏆", banner_pic: t.bannerPic || null, description: t.description || null, prize1: t.prize1 || null, prize2: t.prize2 || null, prize3: t.prize3 || null, prize4: t.prize4 || null, rules: t.rules || null, status: t.status || "open", players: JSON.stringify(t.players || []), bracket: JSON.stringify(t.bracket || []), winners: JSON.stringify(t.winners || []), winner: t.winner || null, created_at: t.createdAt || Date.now() }; }

function normE(r) { var prices = {}, durs = null; try { prices = JSON.parse(r.prices || "{}"); } catch(e) {} try { if (r.durs) durs = JSON.parse(r.durs); } catch(e) {} return { id: r.id, name: r.name, color: r.color, from: r.from_price, fixed: r.fixed_price, prices: prices, durs: durs, sub: r.sub }; }
function normReq(r) { var items = []; try { items = JSON.parse(r.items || "[]"); } catch(e) {} return { id: r.id, type: r.type, customerId: r.customer_id, sessionId: r.session_id, customerName: r.customer_name, items: items, total: r.total || 0, pointsUsed: r.points_used || 0, minutes: r.minutes || 0, status: r.status || "pending", note: r.note || "", createdAt: r.created_at || 0, processedAt: r.processed_at || 0 }; }
function denormReq(r) { return { id: r.id, type: r.type, customer_id: r.customerId, session_id: r.sessionId || null, customer_name: r.customerName, items: JSON.stringify(r.items || []), total: r.total || 0, points_used: r.pointsUsed || 0, minutes: r.minutes || 0, status: r.status || "pending", note: r.note || null, created_at: r.createdAt || Date.now(), processed_at: r.processedAt || null }; }

function normA(r) { var p = []; try { p = JSON.parse(r.perms || "[]"); } catch(e) {} return { username: r.username, passHash: r.pass_hash, role: r.role || "admin", perms: p, createdAt: r.created_at || 0, password_changed_at: r.password_changed_at || 0, password_history: r.password_history || "[]" }; }
function denormA(a) { return { username: a.username, pass_hash: a.passHash, role: a.role || "admin", perms: JSON.stringify(a.perms || []), created_at: a.createdAt || Date.now(), password_changed_at: a.password_changed_at || 0, password_history: a.password_history || "[]" }; }

function syncTable(table, newArr, oldArr, denorm) {
  if (!sb) return;
  var oldMap = {};
  oldArr.forEach(function(x) { oldMap[x.id] = x; });
  var toUpsert = newArr.filter(function(x) { var o = oldMap[x.id]; return !o || JSON.stringify(o) !== JSON.stringify(x); }).map(denorm);
  var newIds = {};
  newArr.forEach(function(x) { newIds[x.id] = true; });
  var toDel = oldArr.filter(function(x) { return !newIds[x.id]; }).map(function(x) { return x.id; });
  if (toUpsert.length) sb.from(table).upsert(toUpsert).then(function(res) { if (res.error) console.error(res.error); });
  if (toDel.length) sb.from(table).delete().in("id", toDel).then(function(res) { if (res.error) console.error(res.error); });
}

function loadAll() {
  if (!sb) return Promise.reject(new Error("No Supabase"));
  return Promise.all([
    sb.from("customers").select("*"),
    sb.from("sessions").select("*").order("created_at", { ascending: false }).limit(500),
    sb.from("tournaments").select("*"),
    sb.from("stations").select("*"),
    sb.from("experiences").select("*"),
    sb.from("addons").select("*"),
    sb.from("requests").select("*").order("created_at", { ascending: false }).limit(300),
    sb.from("admins").select("*"),
    sb.from("settings").select("*").eq("id", "main").maybeSingle()
  ]).then(function(results) {
    CUST = (results[0].data || []).map(normC);
    SESS = (results[1].data || []).map(normS);
    TOURN = (results[2].data || []).map(normT);
    STA = (results[3].data || []).map(function(r) { return { id: r.id, name: r.name }; });
    EXP = (results[4].data || []).map(normE);
    ADD = (results[5].data || []).map(function(r) { return { id: r.id, name: r.name, price: r.price, points_price: r.points_price || 0, photo: r.photo || "" }; });
    REQ = (results[6].data || []).map(normReq);
    ADMINS = (results[7].data || []).map(normA);
    if (!STA.length) STA = STA_DEF.slice();
    if (!ADD.length) ADD = ADD_DEF.slice();
    var sRow = results[8] && results[8].data;
    if (sRow && sRow.data && Object.keys(sRow.data).length) { applySettings(sRow.data); }
    else { var def = defaultSettings(); applySettings(def); sb.from("settings").upsert({ id: "main", data: def }); }
    if (!EXP.length) EXP = EXP_DEF.slice();
  });
}

function saveC(a) { var old = CUST; CUST = a; syncTable("customers", a, old, denormC); }
function saveS(a) { var old = SESS; SESS = a; syncTable("sessions", a, old, denormS); }
function saveT(a) { var old = TOURN; TOURN = a; syncTable("tournaments", a, old, denormT); }
function getSess(id) { return SESS.find(function(s) { return s.id === id; }); }
function getTid(id) { return TOURN.find(function(t) { return t.id === id; }); }
function upsertS(s) { var a = SESS.slice(); var i = a.findIndex(function(x) { return x.id === s.id; }); if (i >= 0) a[i] = s; else a.unshift(s); saveS(a); }
function upsertT(t) { var a = TOURN.slice(); var i = a.findIndex(function(x) { return x.id === t.id; }); if (i >= 0) a[i] = t; else a.unshift(t); saveT(a); }
function upsertReq(r) { var a = REQ.slice(); var i = a.findIndex(function(x) { return x.id === r.id; }); if (i >= 0) a[i] = r; else a.unshift(r); REQ = a; syncTable("requests", a, [], denormReq); }
function saveAdmins(arr) {
  if (!sb) return Promise.resolve();
  return sb.from("admins").delete().neq("username", "__never__").then(function() { if (arr.length) return sb.from("admins").insert(arr.map(denormA)); }).catch(function(e) { console.error(e); });
}

function newCID() { for (var i = 0; i < 200; i++) { var id = String(Math.floor(100000 + Math.random() * 900000)); if (!CUST.find(function(c) { return c.id === id; })) return id; } return String(Date.now()).slice(-6); }
function newBID() { return "YN" + Date.now().toString(36).toUpperCase().slice(-6); }
function newTID() { return "T" + Date.now().toString(36).toUpperCase().slice(-5); }
function findC(n) { var c = String(n).trim().toUpperCase().replace(/\s/g, ""); return CUST.find(function(x) { return x.id.toUpperCase() === c; }); }
function dursOf(id) { var e = EXP.find(function(x) { return x.id === id; }); return e && e.durs ? e.durs : [30, 60, 120, 180]; }

function checkExpiry(c) {
  var now = Date.now(), last = c.lastActivity || c.createdAt;
  if (now - last > YEARS_MS) {
    if (!c.pointsExpiredAt || now - c.pointsExpiredAt > YEARS_MS) {
      c.points = (c.points || 0) - 1000; c.pointsExpiredAt = now; return true;
    }
  }
  return false;
}
var BADGES = [
  { id: "first", em: "🌟", name: "First Timer", check: function(c) { return c.visits >= 1; } },
  { id: "reg", em: "🎮", name: "Regular", check: function(c) { return c.visits >= 5; } },
  { id: "big", em: "💎", name: "Big Spender", check: function(c) { return c.totalSpent >= 5000; } },
  { id: "ref", em: "🤝", name: "Referrer", check: function(c) { return (c.referrals || 0) >= 1; } },
  { id: "loyal", em: "👑", name: "Loyalty", check: function(c) { return c.visits >= 25; } }
];
function unlockedBadges(c) { return BADGES.filter(function(b) { try { return b.check(c); } catch(e) { return false; } }); }
function checkBday(c) { if (!c || !c.birthday) return false; if (c.birthdayAwarded === new Date().getFullYear()) return false; return new Date(c.birthday).getMonth() === new Date().getMonth(); }
function awardBday(c) { c.points = Math.min(POINTS_MAX, (c.points || 0) + BDAY_BONUS); c.credit = (c.credit || 0) + 60; c.birthdayAwarded = new Date().getFullYear(); var a = CUST.slice(); var i = a.findIndex(function(x) { return x.id === c.id; }); if (i >= 0) a[i] = c; saveC(a); }

function defaultSettings() {
  return {
    cafe: { hours: "Mon-Sun · 10:00 AM - 11:00 PM", address: "Vadodara, Gujarat", phone: "+91 90000 00000" },
    loyalty: { RR: 20, POINTS_PER_HOUR: 1000, REF_BONUS: 50, BDAY_BONUS: 100 },
    experiences: JSON.parse(JSON.stringify(EXP_DEF))
  };
}
function applySettings(s) {
  if (!s) return;
  SETTINGS = s;
  if (s.cafe) { CAFE_INFO.hours = s.cafe.hours || CAFE_INFO.hours; CAFE_INFO.address = s.cafe.address || CAFE_INFO.address; CAFE_INFO.phone = s.cafe.phone || CAFE_INFO.phone; CAFE_PHONE = CAFE_INFO.phone; }
  if (s.loyalty) { if (s.loyalty.RR) RR = s.loyalty.RR; if (s.loyalty.POINTS_PER_HOUR) POINTS_PER_HOUR = s.loyalty.POINTS_PER_HOUR; if (s.loyalty.REF_BONUS != null) REF_BONUS = s.loyalty.REF_BONUS; if (s.loyalty.BDAY_BONUS != null) BDAY_BONUS = s.loyalty.BDAY_BONUS; }
  if (s.experiences && s.experiences.length) { EXP = JSON.parse(JSON.stringify(s.experiences)); }
}
function saveSettings(s) { SETTINGS = s; applySettings(s); if (!sb) return Promise.resolve({ error: null }); return sb.from("settings").upsert({ id: "main", data: s }); }
