var curR="",bk=null;
var ALL_PERMS=["floor","pay","requests","customers","menu","tournaments","reports","settings"];
var PERM_LABELS={floor:"🏠 Floor",pay:"💳 Payments",requests:"🔔 Requests",customers:"👥 Customers",menu:"🍟 Menu",tournaments:"🏆 Tournaments",reports:"📊 Reports",settings:"⚙ Settings"};
var PWD_MAX_AGE=90;
var PWD_HISTORY=5;

function getMe(){var u=DB.get("yondu_admin_session",null);if(!u)return null;return ADMINS.find(function(x){return x.username===u;})||null;}
function isAdmin(){return !!getMe();}
function can(p){var m=getMe();if(!m)return false;if(m.role==="owner")return true;return (m.perms||[]).indexOf(p)>=0;}
function isOwner(){var m=getMe();return m&&m.role==="owner";}
function ageDays(a){var c=a.password_changed_at||a.createdAt||0;if(!c)return 0;return Math.floor((Date.now()-c)/86400000);}
function isExpired(a){return ageDays(a)>=PWD_MAX_AGE;}

function toast(msg,type){
  var colors={success:"#22c55e",error:"#ef4444",info:"#22d3ee",warn:"#fb923c"};
  var el=document.createElement("div");
  el.style.cssText="position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);background:"+(colors[type]||colors.info)+";color:#fff;padding:12px 22px;border-radius:12px;font-weight:800;z-index:9999;box-shadow:0 12px 40px rgba(0,0,0,.5);font-size:14px;max-width:90%;text-align:center;transition:transform .3s";
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(function(){el.style.transform="translateX(-50%) translateY(0)";},20);
  setTimeout(function(){el.style.transform="translateX(-50%) translateY(-100px)";},2200);
  setTimeout(function(){el.remove();},2700);
}

function sheet(opts){
  var m=document.createElement("div");
  m.className="modal";
  var html="";
  (opts.fields||[]).forEach(function(f){
    if(f.type==="info"){html+='<div class="notice gold" style="margin-bottom:12px">'+f.value+'</div>';}
    else if(f.type==="select"){html+='<label>'+f.label+'</label><select id="'+f.id+'">';f.options.forEach(function(o){html+='<option value="'+o.value+'"'+(o.value===f.value?" selected":"")+'>'+o.label+'</option>';});html+='</select>';}
    else{html+='<label>'+f.label+'</label><input id="'+f.id+'" type="'+(f.type||"text")+'" value="'+(f.value||"")+'" placeholder="'+(f.placeholder||"")+'">';}
  });
  m.innerHTML='<div class="sheet"><h2>'+opts.title+'</h2>'+(opts.subtitle?'<div class="s">'+opts.subtitle+'</div>':"")+html+'<button class="btn '+(opts.danger?"danger":"")+'" id="sheet-ok" style="margin-top:8px">'+(opts.confirmText||"Save")+'</button><button class="btn dark" id="sheet-cancel" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  m.querySelector("#sheet-ok").onclick=function(){
    var vals={};
    m.querySelectorAll("input,select,textarea").forEach(function(el){if(el.id)vals[el.id]=el.value;});
    m.remove();if(opts.onConfirm)opts.onConfirm(vals);
  };
  m.querySelector("#sheet-cancel").onclick=function(){m.remove();};
}

function confirm2(opts){
  var m=document.createElement("div");
  m.className="modal";
  m.innerHTML='<div class="sheet"><h2>'+opts.title+'</h2>'+(opts.message?'<div class="s" style="white-space:pre-line">'+opts.message+'</div>':"")+'<button class="btn '+(opts.danger?"danger":"")+'" id="ok">'+(opts.yesText||"Yes")+'</button><button class="btn dark" id="no" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  m.querySelector("#ok").onclick=function(){m.remove();if(opts.onYes)opts.onYes();};
  m.querySelector("#no").onclick=function(){m.remove();};
}

var R={};
function go(r,p){curR=r;window.scrollTo(0,0);render(r,p||{});}
window.go=go;
function render(r,p){
  if(!isAdmin()&&r!=="login"&&r!=="claim_owner"){r="login";p={};}
  if(!ADMINS.length&&r!=="claim_owner"){r="claim_owner";p={};}
  curR=r;
  var app=document.getElementById("app");
  if(!app)return;
  var fn=R[r]||R.floor;
  app.innerHTML=fn(p);
  renderNav(r);
  if(R[r]&&R[r].after)R[r].after(p);
}
function renderNav(r){
  var nav=document.getElementById("nav");
  if(!isAdmin()||r==="login"||r==="claim_owner"){nav.style.display="none";return;}
  nav.style.display="flex";
  var pc=CUST.filter(function(c){return !c.activated;}).length;
  var pr=REQ.filter(function(x){return x.status==="pending";}).length;
  var pay=SESS.filter(function(s){return !s.paid&&s.status!=="ended";}).length;
  var h="";
  if(can("floor"))h+='<a href="javascript:go(\'floor\')" class="'+(r==="floor"||r==="station"?"on":"")+'"><span class="ic">🏠</span>Floor</a>';
  if(can("pay"))h+='<a href="javascript:go(\'payments\')" class="'+(r==="payments"?"on":"")+'"><span class="ic">💳</span>Pay'+(pay?'<span class="dot"></span>':"")+'</a>';
  if(can("requests"))h+='<a href="javascript:go(\'requests\')" class="'+(r==="requests"?"on":"")+'"><span class="ic">🔔</span>Reqs'+((pr+pc)?'<span class="dot"></span>':"")+'</a>';
  if(can("customers"))h+='<a href="javascript:go(\'customers\')" class="'+(r==="customers"?"on":"")+'"><span class="ic">👥</span>People</a>';
  h+='<a href="javascript:go(\'more\')" class="'+(r==="more"||r==="me"?"on":"")+'"><span class="ic">⚙️</span>More</a>';
  nav.innerHTML=h;
}

R.claim_owner=function(){
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto"><div style="text-align:center;margin-bottom:24px"><div class="brand-icon" style="margin:0 auto 14px;width:70px;height:70px"></div><h1 style="font-size:22px;text-align:center;color:var(--gold)">CLAIM OWNER</h1></div><div class="notice gold">👑 First admin becomes Owner</div><label>Username</label><input id="oau" placeholder="owner"><label>Password</label><input id="oap" type="password"><label>Confirm</label><input id="oap2" type="password"><button class="btn" onclick="doClaim()">Create Owner</button></div></div>';
};
window.doClaim=function(){
  var u=document.getElementById("oau").value.trim().toLowerCase();
  var p=document.getElementById("oap").value;
  var p2=document.getElementById("oap2").value;
  if(!u||u.length<3)return toast("Username 3+","error");
  if(!p||p.length<6)return toast("Password 6+","error");
  if(p!==p2)return toast("Passwords don't match","error");
  loadAll().then(function(){
    if(ADMINS.length)return toast("Owner exists","error");
    var a={username:u,passHash:hashPin(p),role:"owner",perms:ALL_PERMS.slice(),createdAt:Date.now(),password_changed_at:Date.now(),password_history:"[]"};
    ADMINS=[a];
    sb.from("admins").upsert(denormA(a)).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      DB.set("yondu_admin_session",u);
      toast("✅ Owner created","success");
      go("floor");
    });
  });
};

R.login=function(){
  return '<div class="screen"><div class="wrap" style="max-width:420px;margin:40px auto"><div style="text-align:center;margin-bottom:24px"><div class="brand-icon" style="margin:0 auto 14px;width:70px;height:70px"></div><h1 style="font-size:22px;text-align:center;color:var(--gold)">YONDU</h1></div><label>Username</label><input id="au"><label>Password</label><input id="ap" type="password"><button class="btn" onclick="doLogin()">Sign In</button><button class="btn dark" style="margin-top:8px" onclick="location.href=\'index.html\'">← Back</button></div></div>';
};
window.doLogin=function(){
  var u=document.getElementById("au").value.trim().toLowerCase();
  var p=document.getElementById("ap").value;
  if(!u||!p)return toast("Enter credentials","error");
  loadAll().then(function(){
    if(!ADMINS.length){go("claim_owner");return;}
    var a=ADMINS.find(function(x){return x.username.toLowerCase()===u;});
    if(!a||hashPin(p)!==a.passHash)return toast("Wrong credentials","error");
    DB.set("yondu_admin_session",a.username);
    if(isExpired(a)){forceReset(a,true);return;}
    go("floor");
  });
};
window.doLogout=function(){
  confirm2({title:"Sign Out?",yesText:"Sign Out",danger:true,onYes:function(){DB.del("yondu_admin_session");go("login");}});
};

R.floor=function(){
  if(!can("floor"))return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var now=Date.now();
  var playing=SESS.filter(function(s){return s.status==="playing";});
  var pend=CUST.filter(function(c){return !c.activated;}).length;
  var pendReq=REQ.filter(function(r){return r.status==="pending";}).length;
  var col=SESS.filter(function(s){return !s.paid&&s.status!=="ended";}).length;
  var today=new Date().setHours(0,0,0,0);
  var tSess=SESS.filter(function(s){return s.createdAt>=today;});
  var tRev=tSess.reduce(function(t,s){return t+(s.paid?s.total:0);},0);
  var busy={};
  playing.forEach(function(s){if(s.stationId)busy[s.stationId]=s;});
  var stations=STA.map(function(st){
    var s=busy[st.id];
    if(s){
      var l=s.end?(s.end-now):0;
      var m=Math.max(0,Math.floor(l/60000));
      var sec=Math.max(0,Math.floor((l%60000)/1000));
      var cls=s.isMembership?"":(l<5*60000?"over":l<15*60000?"warn":"");
      var display=s.isMembership?String(Math.floor((now-s.start)/60000)).padStart(2,"0")+":"+String(Math.floor(((now-s.start)%60000)/1000)).padStart(2,"0"):String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0");
      return '<div class="station playing" onclick="go(\'station\',{id:\''+st.id+'\'})"><div class="st-h"><div class="st-nm">'+st.name+'</div><span class="pill busy">'+(s.isMembership?"🎫":"● PLAYING")+'</span></div><div class="status">'+s.name+' · '+s.items.join(" · ")+'</div><div class="time '+cls+'" data-s="'+s.id+'">'+display+'</div></div>';
    }
    return '<div class="station free" onclick="startAt(\''+st.id+'\')"><div class="st-h"><div class="st-nm">'+st.name+'</div><span class="pill free">● FREE</span></div><div class="status">Ready</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><div><h1 style="font-size:22px;margin:0">Live Floor</h1><p class="sub" style="margin:4px 0 0">'+playing.length+' playing · '+tSess.length+' today</p></div><button class="btn sm" onclick="go(\'newsale\')">+ Sale</button></div>'+((pend+pendReq)>0?'<div class="notice orange" onclick="go(\'requests\')" style="cursor:pointer">🔔 '+pend+' signups · '+pendReq+' requests → tap</div>':"")+'<div class="grid4" style="margin-bottom:16px"><div class="stat"><div class="v">₹'+tRev+'</div><div class="l">Today</div></div><div class="stat"><div class="v" style="color:var(--cyan)">'+playing.length+'</div><div class="l">Playing</div></div><div class="stat"><div class="v" style="color:var(--pink)">'+col+'</div><div class="l">Collect</div></div><div class="stat"><div class="v" style="color:var(--green)">'+pend+'</div><div class="l">Pending</div></div></div><div class="sec-label">Stations</div>'+stations+'</div></div>';
};
R.floor.after=function(){
  setInterval(function(){
    if(curR!=="floor")return;
    var now=Date.now();
    document.querySelectorAll("[data-s]").forEach(function(el){
      var s=getSess(el.dataset.s);
      if(!s||!s.end)return;
      var l=s.end-now;
      if(l<=0){el.textContent="00:00";el.className="time over";return;}
      el.textContent=String(Math.floor(l/60000)).padStart(2,"0")+":"+String(Math.floor((l%60000)/1000)).padStart(2,"0");
      el.className="time"+(l<5*60000?" over":l<15*60000?" warn":"");
    });
  },1000);
};

window.startAt=function(stId){
  loadAll().then(function(){
    var all=SESS.filter(function(s){return !s.stationId&&s.status!=="ended"&&s.expId!=="snacks";});
    if(!all.length)return toast("No pending sessions","error");
    var options=all.slice(0,20).map(function(s){return {value:s.id,label:s.id+" — "+s.name+" ("+(s.paid?"PAID":"unpaid")+")"};});
    var st=STA.find(function(x){return x.id===stId;});
    sheet({title:"▶ Start Session",subtitle:"Station: "+(st?st.name:""),fields:[{id:"sessid",label:"Pick a booking",type:"select",options:options,value:options[0].value}],confirmText:"▶ Start Now",onConfirm:function(v){
      var s=all.find(function(x){return x.id===v.sessid;});
      if(!s)return;
      s.paid=true;s.status="playing";s.stationId=stId;s.start=Date.now();s.end=Date.now()+(s.minutes||60)*60000;
      sb.from("sessions").upsert(denormS(s)).then(function(){
        toast("✅ Started","success");
        go("station",{id:stId});
      });
    }});
  });
};

R.station=function(p){
  var st=STA.find(function(x){return x.id===p.id;});
  var s=SESS.find(function(x){return x.stationId===p.id&&x.status==="playing";});
  if(!st)return '<div class="screen"><div class="wrap"><h2>Not found</h2></div></div>';
  if(!s)return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted)">← Floor</a><h1 style="margin-top:20px">'+st.name+'</h1><div class="notice">Free</div></div></div>';
  var c=s.customerId?CUST.find(function(x){return x.id===s.customerId;}):null;
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted);font-size:13px">← Floor</a><h1 style="margin-top:20px">'+st.name+'</h1><p class="sub">'+s.name+(c?" · "+c.id:"")+'</p><div class="card" style="text-align:center;padding:24px"><div class="timer-huge" id="ast">--:--</div></div><div class="card">'+(s.items||[]).map(function(i){return '<div style="padding:4px 0">'+i+'</div>';}).join("")+(s.total>0?'<div style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px;font-weight:800"><span>Total: </span><span style="color:var(--gold-bright)">₹'+s.total+'</span></div>':"")+'</div><button class="btn dark" onclick="aAdd(\''+s.id+'\')">🍟 Add Snacks</button><button class="btn dark" style="margin-top:8px" onclick="aExt(\''+s.id+'\')">⏱ Add Time</button><button class="btn orange" style="margin-top:8px" onclick="aEnd(\''+s.id+'\')">⏹ End</button></div></div>';
};
R.station.after=function(p){
  var s=SESS.find(function(x){return x.stationId===p.id&&x.status==="playing";});
  if(!s)return;
  var el=document.getElementById("ast");
  if(!el)return;
  var tick=function(){
    if(s.isMembership){var p2=Date.now()-s.start;el.textContent=String(Math.floor(p2/60000)).padStart(2,"0")+":"+String(Math.floor((p2%60000)/1000)).padStart(2,"0");el.className="timer-huge";return;}
    if(!s.end)return;
    var l=s.end-Date.now();
    if(l<=0){el.textContent="00:00";el.className="timer-huge over";return;}
    el.textContent=String(Math.floor(l/60000)).padStart(2,"0")+":"+String(Math.floor((l%60000)/1000)).padStart(2,"0");
    el.className="timer-huge"+(l<5*60000?" over":l<15*60000?" warn":"");
  };
  tick();setInterval(tick,1000);
};

window.aAdd=function(sid){
  var opts=ADD.map(function(a){return {value:a.id,label:a.name+" — ₹"+a.price};});
  opts.push({value:"__custom",label:"✏ Custom"});
  sheet({title:"🍟 Add Snacks",fields:[{id:"pick",label:"Item",type:"select",options:opts,value:opts[0].value},{id:"cname",label:"Custom name",type:"text"},{id:"cprice",label:"Custom ₹",type:"number"},{id:"qty",label:"Qty",type:"number",value:"1"}],confirmText:"Add",onConfirm:function(v){
    var qty=Math.max(1,parseInt(v.qty)||1);
    var name,price;
    if(v.pick==="__custom"){name=(v.cname||"").trim();price=parseInt(v.cprice)||0;if(!name||!price)return toast("Enter name & price","error");}
    else{var a=ADD.find(function(x){return x.id===v.pick;});if(!a)return;name=a.name;price=a.price;}
    var s=getSess(sid);if(!s)return;
    for(var i=0;i<qty;i++)s.items.push(name);
    s.total+=price*qty;
    sb.from("sessions").upsert(denormS(s)).then(function(){toast("✅ Added","success");render("station",{id:s.stationId});});
  }});
};

window.aExt=function(sid){
  sheet({title:"⏱ Add Time",fields:[{id:"min",label:"Minutes",type:"number",value:"30"},{id:"rate",label:"Rate ₹",type:"number",value:"100"},{id:"pl",label:"Players",type:"number",value:"1"}],confirmText:"Add Time",onConfirm:function(v){
    var add=parseInt(v.min)||0;if(!add)return toast("Enter minutes","error");
    var amt=(parseInt(v.rate)||0)*(parseInt(v.pl)||1);
    var s=getSess(sid);if(!s)return;
    s.end=Math.max(Date.now(),s.end||Date.now())+add*60000;
    s.minutes=(s.minutes||0)+add;s.total+=amt;
    sb.from("sessions").upsert(denormS(s)).then(function(){toast("✅ +"+add+"min","success");render("station",{id:s.stationId});});
  }});
};

window.aEnd=function(sid){
  var s=getSess(sid);if(!s)return;
  confirm2({title:"End Session?",message:"Total: ₹"+s.total,yesText:"End",danger:true,onYes:function(){
    s.status="ended";
    sb.from("sessions").upsert(denormS(s)).then(function(){toast("✅ Ended","success");go("floor");});
  }});
};

R.payments=function(){
  if(!can("pay"))return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var all=SESS.filter(function(s){return !s.paid&&s.status!=="ended";});
  var cards=all.length?all.map(function(s){
    var c=s.customerId?CUST.find(function(x){return x.id===s.customerId;}):null;
    return '<div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><div><div style="font-weight:800">'+s.name+'</div>'+(c?'<div style="color:var(--cyan);font-size:12px">'+c.id+'</div>':"")+'<div style="color:var(--muted);font-size:13px;margin-top:4px">'+s.items.join(" · ")+'</div></div><span class="badge '+s.method+'">'+s.method.toUpperCase()+'</span></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"><div style="font-size:22px;font-weight:800;color:var(--gold-bright)">₹'+s.total+'</div><button class="btn sm" onclick="collect(\''+s.id+'\')">Collect</button></div></div>';
  }).join(""):'<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:22px">Payments</h1><p class="sub">Collect cash → assign station</p>'+cards+'</div></div>';
};
window.collect=function(sid){
  var s=getSess(sid);if(!s)return;
  var c=s.customerId?CUST.find(function(x){return x.id===s.customerId;}):null;
  sheet({title:"💰 Collect ₹"+s.total,fields:[{id:"method",label:"Method",type:"select",options:[{value:"cash",label:"💵 Cash"},{value:"upi",label:"📱 UPI"},{value:"points",label:"🎁 Points"+(c?" ("+c.points+")":"")}],value:"cash"}],confirmText:"✅ Confirm",onConfirm:function(v){
    var m=v.method;
    if(m==="points"){if(!c)return toast("No customer","error");if(c.points<s.total)return toast("Not enough points","error");}
    s.paid=true;s.method=m;
    var tasks=[sb.from("sessions").upsert(denormS(s))];
    if(c){
      if(m==="points"){c.points-=s.total;}
      else{c.points=(c.points||0)+Math.floor(s.total/RR);c.totalSpent=(c.totalSpent||0)+s.total;c.visits=(c.visits||0)+1;}
      tasks.push(sb.from("customers").upsert(denormC(c)));
    }
    Promise.all(tasks).then(function(){toast("✅ Collected","success");render("payments",{});});
  }});
};

R.requests=function(){
  if(!can("requests"))return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var pr=REQ.filter(function(r){return r.status==="pending";});
  var pa=CUST.filter(function(c){return !c.activated;});
  var aHTML=pa.length?'<div class="sec-label urgent">⏳ Signups ('+pa.length+')</div>'+pa.map(function(c){
    return '<div class="card" style="border-left:4px solid var(--orange)"><div style="display:flex;gap:12px;align-items:center;margin-bottom:12px"><div class="avatar">'+c.name.charAt(0).toUpperCase()+'</div><div><div style="font-weight:700">'+c.name+'</div><div style="color:var(--cyan);font-size:15px;font-weight:800;letter-spacing:2px">'+c.id+'</div></div></div><button class="btn green" onclick="activateCust(\''+c.id+'\')">✅ Activate</button></div>';
  }).join(""):"";
  var rHTML=pr.length?'<div class="sec-label urgent">🔔 Requests ('+pr.length+')</div>'+pr.map(function(r){
    return '<div class="card" style="border-left:4px solid var(--pink)"><div style="font-weight:700">'+r.customerName+'</div><div style="color:var(--muted);font-size:13px;margin:8px 0">'+(r.items||[]).join(" · ")+'</div><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:20px;font-weight:800;color:var(--gold-bright)">₹'+r.total+'</div><div style="display:flex;gap:6px"><button class="btn danger xs" onclick="rejectReq(\''+r.id+'\')">✕</button><button class="btn sm" onclick="approveReq(\''+r.id+'\')">Approve</button></div></div></div>';
  }).join(""):"";
  return '<div class="screen"><div class="wrap"><h1 style="font-size:22px">Requests</h1>'+((!pr.length&&!pa.length)?'<div class="empty"><div class="big">✓</div><div class="msg">ALL CLEAR</div></div>':"")+aHTML+rHTML+'</div></div>';
};
window.activateCust=function(cid){
  var c=CUST.find(function(x){return x.id===cid;});
  if(!c)return toast("Not found","error");
  var np=(c.points||0)+50;
  var nc=(c.credit||0)+30;
  sb.from("customers").update({activated:true,points:np,credit:nc}).eq("id",cid).select().then(function(res){
    if(res.error)return toast("❌ "+res.error.message,"error");
    if(!res.data||!res.data.length)return toast("⚠️ 0 rows","error");
    c.activated=true;c.points=np;c.credit=nc;
    toast("✅ "+c.name+" activated","success");
    render(curR,{});
  });
};
window.approveReq=function(rid){
  var r=REQ.find(function(x){return x.id===rid;});
  if(!r)return;
  sb.from("requests").update({status:"approved",processed_at:Date.now()}).eq("id",rid).select().then(function(res){
    if(res.error)return toast("❌ "+res.error.message,"error");
    r.status="approved";
    toast("✅ Approved","success");
    render("requests",{});
  });
};
window.rejectReq=function(rid){
  confirm2({title:"Reject?",yesText:"Reject",danger:true,onYes:function(){
    sb.from("requests").update({status:"rejected",processed_at:Date.now()}).eq("id",rid).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      var r=REQ.find(function(x){return x.id===rid;});
      if(r)r.status="rejected";
      toast("Rejected","warn");
      render("requests",{});
    });
  }});
};

R.customers=function(){
  if(!can("customers"))return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var cs=CUST.slice().sort(function(a,b){return b.totalSpent-a.totalSpent;});
  var list=cs.length?cs.map(function(c){
    var badge=!c.activated?'<span class="badge pending">Pending</span>':c.banned?'<span class="badge banned">Banned</span>':c.vip?'<span class="badge vip">VIP</span>':'<span class="badge open">Active</span>';
    return '<div class="card"><div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><div class="avatar">'+c.name.charAt(0).toUpperCase()+'</div><div style="flex:1"><div style="display:flex;justify-content:space-between"><div style="font-weight:700">'+c.name+'</div>'+badge+'</div><div style="color:var(--cyan);font-size:13px;font-weight:700;margin-top:3px">'+c.id+'</div></div></div><div class="grid4" style="gap:8px;margin-bottom:10px"><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">POINTS</div><div style="font-weight:800;color:var(--gold-bright)">'+c.points+'</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">SPENT</div><div style="font-weight:800">₹'+c.totalSpent+'</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">VISITS</div><div style="font-weight:800">'+c.visits+'</div></div><div style="background:var(--card2);border-radius:6px;padding:8px;text-align:center"><div style="font-size:9px;color:var(--muted);font-weight:700">HOURS</div><div style="font-weight:800;color:var(--cyan)">'+(c.ps5Hours||0)+'·'+(c.raceHours||0)+'</div></div></div><div style="display:flex;gap:6px;flex-wrap:wrap">'+(!c.activated?'<button class="btn green xs" onclick="activateCust(\''+c.id+'\')">✅</button>':"")+'<button class="btn dark xs" onclick="editPts(\''+c.id+'\')">💰</button><button class="btn dark xs" onclick="editHrs(\''+c.id+'\')">🎫</button><button class="btn dark xs" onclick="resetPin(\''+c.id+'\')">🔑</button><button class="btn dark xs" onclick="togVIP(\''+c.id+'\')">'+(c.vip?"★":"☆")+'</button><button class="btn '+(c.banned?"dark":"danger")+' xs" onclick="togBan(\''+c.id+'\')">'+(c.banned?"✓":"🚫")+'</button></div></div>';
  }).join(""):'<div class="empty"><div class="msg">NONE</div></div>';
  return '<div class="screen"><div class="wrap"><h1 style="font-size:22px">Customers</h1><p class="sub">'+cs.length+' total</p><input placeholder="🔍 Search" oninput="filtC(this.value)"><div id="cl">'+list+'</div></div></div>';
};
window.filtC=function(q){
  var s=q.toLowerCase().trim();
  document.querySelectorAll("#cl .card").forEach(function(el){
    el.style.display=(!s||el.textContent.toLowerCase().indexOf(s)>=0)?"":"none";
  });
};
window.editPts=function(cid){
  var c=CUST.find(function(x){return x.id===cid;});if(!c)return;
  sheet({title:"💰 Points",subtitle:c.name,fields:[{id:"p",label:"Points",type:"number",value:String(c.points||0)}],onConfirm:function(v){
    var n=parseInt(v.p)||0;
    sb.from("customers").update({points:n}).eq("id",cid).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      c.points=n;toast("✅","success");render("customers",{});
    });
  }});
};
window.editHrs=function(cid){
  var c=CUST.find(function(x){return x.id===cid;});if(!c)return;
  sheet({title:"🎫 Hours",subtitle:c.name,fields:[{id:"p5",label:"PS5",type:"number",value:String(c.ps5Hours||0)},{id:"rc",label:"Racing",type:"number",value:String(c.raceHours||0)}],onConfirm:function(v){
    var p=parseFloat(v.p5)||0,r=parseFloat(v.rc)||0;
    sb.from("customers").update({ps5_hours:p,race_hours:r}).eq("id",cid).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      c.ps5Hours=p;c.raceHours=r;toast("✅","success");render("customers",{});
    });
  }});
};
window.resetPin=function(cid){
  var c=CUST.find(function(x){return x.id===cid;});if(!c)return;
  var p=String(Math.floor(1000+Math.random()*9000));
  sheet({title:"🔑 New PIN",subtitle:c.name,fields:[{type:"info",value:"PIN: <b style=\'font-size:22px;color:var(--gold-bright);letter-spacing:4px\'>"+p+"</b>"}],confirmText:"Confirm",onConfirm:function(){
    sb.from("customers").update({pin_hash:hashPin(p)}).eq("id",cid).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      c.pinHash=hashPin(p);toast("✅ PIN: "+p,"success");render("customers",{});
    });
  }});
};
window.togVIP=function(cid){
  var c=CUST.find(function(x){return x.id===cid;});if(!c)return;
  var nv=!c.vip;
  sb.from("customers").update({vip:nv}).eq("id",cid).then(function(res){
    if(res.error)return toast("❌ "+res.error.message,"error");
    c.vip=nv;toast(nv?"⭐ VIP":"Removed","success");render("customers",{});
  });
};
window.togBan=function(cid){
  var c=CUST.find(function(x){return x.id===cid;});if(!c)return;
  confirm2({title:(c.banned?"Unban":"Ban")+" "+c.name+"?",danger:!c.banned,onYes:function(){
    var nb=!c.banned;
    sb.from("customers").update({banned:nb}).eq("id",cid).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      c.banned=nb;toast("Updated","success");render("customers",{});
    });
  }});
};

R.more=function(){
  var me=getMe();
  var h="";
  if(can("menu"))h+='<div class="card click" onclick="go(\'menu\')"><div style="font-weight:700">🍟 Menu</div><div class="sub" style="font-size:13px">'+ADD.length+' items</div></div>';
  if(can("tournaments"))h+='<div class="card click" onclick="go(\'tourneys\')"><div style="font-weight:700">🏆 Tournaments</div></div>';
  if(can("reports"))h+='<div class="card click" onclick="go(\'reports\')"><div style="font-weight:700">📊 Reports</div></div>';
  if(can("settings"))h+='<div class="card click" onclick="go(\'settings\')"><div style="font-weight:700">⚙ Settings</div></div>';
  if(isOwner())h+='<div class="card click" onclick="go(\'admin_users\')" style="border:2px solid var(--gold)"><div style="font-weight:700">👑 Staff ('+ADMINS.length+')</div></div>';
  h+='<div class="card click" onclick="go(\'me\')"><div style="font-weight:700">🧑 My Account</div></div>';
  return '<div class="screen"><div class="wrap"><h1>More</h1><p class="sub">'+(me&&me.role==="owner"?"👑 Owner":"Staff")+' · '+(me?me.username:"")+'</p>'+h+'<button class="btn dark" style="margin-top:20px" onclick="location.href=\'index.html\'">← Customer App</button><button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button></div></div>';
};

R.menu=function(){
  if(!can("menu"))return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var list=ADD.map(function(a){
    return '<div class="snack-row"><div class="snack-photo">🍽️</div><div class="snack-info"><div class="snack-name">'+a.name+'</div><div class="snack-sub">₹'+a.price+'</div></div><div style="display:flex;gap:6px"><button class="btn dark xs" onclick="editItem(\''+a.id+'\')">✏</button><button class="btn danger xs" onclick="delItem(\''+a.id+'\')">✕</button></div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">Menu</h1><button class="btn" onclick="addItem()">+ Add</button><div style="margin-top:16px">'+list+'</div></div></div>';
};
window.addItem=function(){
  sheet({title:"➕ New Item",fields:[{id:"n",label:"Name"},{id:"p",label:"Price ₹",type:"number"},{id:"pp",label:"Points",type:"number"}],confirmText:"Create",onConfirm:function(v){
    var n=(v.n||"").trim();if(!n)return toast("Enter name","error");
    var p=parseInt(v.p)||0;if(!p)return toast("Enter price","error");
    var pp=parseInt(v.pp)||p;
    var id="i"+Date.now().toString(36);
    var item={id:id,name:n,price:p,points_price:pp,photo:""};
    sb.from("addons").insert(item).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      ADD=ADD.concat([item]);toast("✅ Added","success");render("menu",{});
    });
  }});
};
window.editItem=function(id){
  var a=ADD.find(function(x){return x.id===id;});if(!a)return;
  sheet({title:"✏ Edit",fields:[{id:"n",label:"Name",value:a.name},{id:"p",label:"Price",type:"number",value:String(a.price)}],onConfirm:function(v){
    var n=(v.n||"").trim();var p=parseInt(v.p)||0;
    sb.from("addons").update({name:n,price:p,points_price:p}).eq("id",id).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      a.name=n;a.price=p;a.points_price=p;toast("✅","success");render("menu",{});
    });
  }});
};
window.delItem=function(id){
  var a=ADD.find(function(x){return x.id===id;});if(!a)return;
  confirm2({title:"Delete "+a.name+"?",danger:true,onYes:function(){
    sb.from("addons").delete().eq("id",id).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      ADD=ADD.filter(function(x){return x.id!==id;});toast("🗑","success");render("menu",{});
    });
  }});
};

R.tourneys=function(){
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">Tournaments</h1><div class="empty"><div class="big">🏆</div><div class="msg">COMING SOON</div></div></div></div>';
};

R.reports=function(){
  var tr=SESS.reduce(function(t,s){return t+(s.paid?s.total:0);},0);
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">Reports</h1><div class="stat"><div class="v">₹'+tr+'</div><div class="l">Total Revenue</div></div><div class="stat" style="margin-top:10px"><div class="v">'+CUST.length+'</div><div class="l">Customers</div></div><div class="stat" style="margin-top:10px"><div class="v">'+SESS.length+'</div><div class="l">Sessions</div></div></div></div>';
};

R.settings=function(){
  if(!can("settings"))return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var s=(SETTINGS&&SETTINGS.cafe)||{};
  var l=(SETTINGS&&SETTINGS.loyalty)||{};
  return '<div class="screen"><div class="wrap" style="max-width:560px"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">Settings</h1><div class="sec-label">📍 Café</div><div class="card"><label>Phone</label><input id="s_phone" value="'+(s.phone||"")+'"><label>Hours</label><input id="s_hours" value="'+(s.hours||"")+'"><label>Address</label><input id="s_addr" value="'+(s.address||"")+'"></div><div class="sec-label">💰 Loyalty</div><div class="card"><div class="grid2"><div><label>₹ per point</label><input id="s_rr" type="number" value="'+(l.RR||20)+'"></div><div><label>Points per free hour</label><input id="s_pph" type="number" value="'+(l.POINTS_PER_HOUR||1000)+'"></div></div></div><button class="btn" onclick="saveSettings2()">💾 Save</button></div></div>';
};
window.saveSettings2=function(){
  var s={
    cafe:{phone:document.getElementById("s_phone").value.trim(),hours:document.getElementById("s_hours").value.trim(),address:document.getElementById("s_addr").value.trim()},
    loyalty:{RR:parseInt(document.getElementById("s_rr").value)||20,POINTS_PER_HOUR:parseInt(document.getElementById("s_pph").value)||1000,REF_BONUS:50,BDAY_BONUS:100},
    experiences:(SETTINGS&&SETTINGS.experiences)||EXP
  };
  saveSettings(s).then(function(res){
    if(res&&res.error)return toast("❌ "+res.error.message,"error");
    toast("✅ Saved","success");
  });
};

function forceReset(admin,isExpired){
  var m=document.createElement("div");
  m.className="modal";
  m.innerHTML='<div class="sheet"><h2>'+(isExpired?"🔐 Expired":"🔑 Reset")+'</h2><div class="s">New password for '+admin.username+'</div><label>New password</label><input id="np" type="password"><label>Confirm</label><input id="np2" type="password"><button class="btn" id="sv">Save</button>'+(isExpired?"":'<button class="btn dark" id="cx" style="margin-top:8px">Cancel</button>')+'</div>';
  document.body.appendChild(m);
  m.querySelector("#sv").onclick=function(){
    var np=m.querySelector("#np").value;
    var cf=m.querySelector("#np2").value;
    if(np.length<6)return toast("6+ chars","error");
    if(np!==cf)return toast("Don't match","error");
    var nh=hashPin(np);
    if(nh===admin.passHash)return toast("Can't reuse","error");
    var hist=[];
    try{hist=JSON.parse(admin.password_history||"[]");}catch(e){}
    if(hist.indexOf(nh)>=0)return toast("Recently used","error");
    hist.unshift(admin.passHash);
    hist=hist.slice(0,PWD_HISTORY);
    var updated=Object.assign({},admin,{passHash:nh,password_history:JSON.stringify(hist),password_changed_at:Date.now()});
    sb.from("admins").upsert(denormA(updated)).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      ADMINS=ADMINS.map(function(x){return x.username===admin.username?updated:x;});
      m.remove();toast("✅ Updated","success");
      if(isExpired)go("floor");else render(curR,{});
    });
  };
  var cx=m.querySelector("#cx");
  if(cx)cx.onclick=function(){m.remove();};
}

R.me=function(){
  var me=getMe();
  if(!me)return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var age=ageDays(me);
  var daysLeft=Math.max(0,PWD_MAX_AGE-age);
  var color=daysLeft>30?"var(--green)":daysLeft>10?"var(--orange)":"var(--red)";
  var perms=me.role==="owner"?ALL_PERMS:(me.perms||[]);
  var permHTML=ALL_PERMS.map(function(p){
    var has=perms.indexOf(p)>=0;
    return '<div class="perm-item" style="cursor:default;'+(has?'border-color:var(--gold);background:#1f1a10':'opacity:.4')+'"><span>'+PERM_LABELS[p]+'</span><span style="margin-left:auto;color:'+(has?'var(--green)':'var(--muted)')+'">'+(has?"✓":"—")+'</span></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">My Account</h1><div style="text-align:center;margin:20px 0"><div class="avatar avatar-lg" style="margin:0 auto;font-size:36px">'+(me.role==="owner"?"👑":"🧑")+'</div><div style="font-size:22px;font-weight:800;margin-top:14px">'+me.username+'</div><div style="color:'+(me.role==="owner"?"var(--gold)":"var(--cyan)")+';font-size:11px;font-weight:800;letter-spacing:2px;margin-top:6px">'+(me.role==="owner"?"👑 OWNER":"STAFF")+'</div></div><div class="sec-label">🔐 Password</div><div class="card"><div style="display:flex;justify-content:space-between"><div><div style="font-weight:700">Age: '+age+' days</div><div style="color:var(--muted);font-size:12px">Max: 90 days</div></div><div style="text-align:right"><div style="font-size:22px;font-weight:800;color:'+color+'">'+daysLeft+'</div><div style="color:var(--muted);font-size:10px;font-weight:700">DAYS LEFT</div></div></div><button class="btn dark" style="margin-top:12px" onclick="forceReset(getMe(),false)">🔑 Change</button></div><div class="sec-label">🛡 Permissions</div><div class="perm-grid">'+permHTML+'</div>'+(me.role==="owner"?'<button class="btn dark" style="margin-top:20px" onclick="go(\'admin_users\')">👑 Staff Accounts</button>':"")+'<button class="btn danger" style="margin-top:8px" onclick="doLogout()">Sign Out</button></div></div>';
};

R.admin_users=function(){
  if(!isOwner())return '<div class="screen"><div class="wrap"><div class="empty"><div class="msg">NO ACCESS</div></div></div></div>';
  var me=getMe();
  var list=ADMINS.map(function(a){
    var isMe=a.username===me.username;
    return '<div class="card"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><div><div style="font-weight:700">'+a.username+(a.role==="owner"?" 👑":"")+'</div><div style="color:var(--muted);font-size:12px">'+(a.role==="owner"?"Owner":"Staff")+'</div></div>'+(isMe?'<span class="badge vip">YOU</span>':"")+'</div>'+(isMe?'<div class="notice gold" style="margin:0;font-size:12px">This is you</div>':'<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn dark xs" onclick="editPerm(\''+a.username+'\')">🛡 Perms</button><button class="btn dark xs" onclick="chPwd(\''+a.username+'\')">🔑 Pwd</button><button class="btn danger xs" onclick="rmAdmin(\''+a.username+'\')">🗑</button></div>')+'</div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'more\')" style="color:var(--muted)">← More</a><h1 style="margin-top:20px">👑 Staff</h1><p class="sub">'+ADMINS.length+' total</p><button class="btn" onclick="addAdmin()">+ Add</button><div style="margin-top:16px">'+list+'</div></div></div>';
};
window.addAdmin=function(){
  sheet({title:"➕ New Staff",fields:[{id:"u",label:"Username"},{id:"p",label:"Password",type:"password"}],confirmText:"Create",onConfirm:function(v){
    var u=(v.u||"").trim().toLowerCase();
    var p=v.p||"";
    if(!u||u.length<3)return toast("Username 3+","error");
    if(!p||p.length<6)return toast("Password 6+","error");
    if(ADMINS.find(function(x){return x.username.toLowerCase()===u;}))return toast("Taken","error");
    var a={username:u,passHash:hashPin(p),role:"admin",perms:ALL_PERMS.slice(),createdAt:Date.now(),password_changed_at:Date.now(),password_history:"[]"};
    sb.from("admins").insert(denormA(a)).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      ADMINS=ADMINS.concat([a]);toast("✅ Created","success");render("admin_users",{});
    });
  }});
};
window.editPerm=function(u){
  var a=ADMINS.find(function(x){return x.username===u;});if(!a)return;
  var m=document.createElement("div");
  m.className="modal";
  m.innerHTML='<div class="sheet"><h2>🛡 Permissions</h2><div class="perm-grid">'+ALL_PERMS.map(function(p){return '<label class="perm-item"><input type="checkbox" id="pm_'+p+'"'+((a.perms||[]).indexOf(p)>=0?" checked":"")+'><span>'+PERM_LABELS[p]+'</span></label>';}).join("")+'</div><button class="btn" id="sv">Save</button><button class="btn dark" id="cx" style="margin-top:8px">Cancel</button></div>';
  document.body.appendChild(m);
  m.querySelector("#sv").onclick=function(){
    var perms=ALL_PERMS.filter(function(p){return m.querySelector("#pm_"+p).checked;});
    if(!perms.length)return toast("Keep 1","error");
    var u2=Object.assign({},a,{perms:perms});
    sb.from("admins").upsert(denormA(u2)).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      ADMINS=ADMINS.map(function(x){return x.username===u?u2:x;});
      m.remove();toast("✅","success");render("admin_users",{});
    });
  };
  m.querySelector("#cx").onclick=function(){m.remove();};
};
window.chPwd=function(u){
  sheet({title:"🔑 New Password",subtitle:u,fields:[{id:"p",label:"Password",type:"password"}],onConfirm:function(v){
    var p=v.p||"";if(p.length<6)return toast("6+ chars","error");
    var a=ADMINS.find(function(x){return x.username===u;});if(!a)return;
    var u2=Object.assign({},a,{passHash:hashPin(p),password_changed_at:Date.now()});
    sb.from("admins").upsert(denormA(u2)).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      ADMINS=ADMINS.map(function(x){return x.username===u?u2:x;});
      toast("✅","success");render("admin_users",{});
    });
  }});
};
window.rmAdmin=function(u){
  confirm2({title:"Remove "+u+"?",danger:true,onYes:function(){
    sb.from("admins").delete().eq("username",u).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      ADMINS=ADMINS.filter(function(x){return x.username!==u;});toast("🗑","success");render("admin_users",{});
    });
  }});
};

R.newsale=function(){
  if(!bk)bk={exp:null,time:null,players:1};
  var e=EXP.find(function(x){return x.id===bk.exp;});
  var expCards=EXP.map(function(x){
    return '<div class="card click '+(bk.exp===x.id?"selected":"")+'" onclick="pickE(\''+x.id+'\')"><div style="font-weight:700">'+x.name+'</div><div style="color:var(--muted);font-size:12px;margin-top:4px">'+(x.fixed?"₹"+x.fixed:"From ₹"+x.from)+'</div></div>';
  }).join("");
  return '<div class="screen"><div class="wrap"><a href="javascript:go(\'floor\')" style="color:var(--muted)">← Floor</a><h1 style="margin-top:20px">New Sale</h1>'+expCards+(e?'<button class="btn" style="margin-top:20px" onclick="saveSale()">Save & Continue</button>':"")+'</div></div>';
};
window.pickE=function(id){bk.exp=id;render("newsale",{});};
window.saveSale=function(){
  var e=EXP.find(function(x){return x.id===bk.exp;});if(!e)return;
  sheet({title:"💾 New Sale",subtitle:e.name,fields:[{id:"n",label:"Customer name",value:"Walk-in"}],onConfirm:function(v){
    var total=e.fixed||0;
    var s={id:"YN"+Date.now().toString(36).toUpperCase().slice(-6),name:(v.n||"Walk-in").trim(),phone:"",expId:e.id,expName:e.name,items:[e.name],total:total,minutes:1800,players:1,method:"cash",paid:false,status:"pending",createdAt:Date.now(),customerId:null,isMembership:true};
    sb.from("sessions").insert(denormS(s)).then(function(res){
      if(res.error)return toast("❌ "+res.error.message,"error");
      SESS=[s].concat(SESS);bk=null;toast("✅ Saved","success");go("payments");
    });
  }});
};

function setupRealtime(){
  if(!sb)return;
  try{sb.removeAllChannels();}catch(e){}
  ["customers","sessions","requests"].forEach(function(t){
    try{
      sb.channel("adm-"+t).on("postgres_changes",{event:"*",schema:"public",table:t},function(){
        loadAll().then(function(){if(curR)render(curR,{});});
      }).subscribe();
    }catch(e){console.error(e);}
  });
}

document.getElementById("app").innerHTML='<div class="screen"><div class="wrap"><div class="empty"><div class="big">⏳</div><div class="msg">LOADING</div></div></div></div>';
loadAll().then(function(){
  if(!ADMINS.length)go("claim_owner");
  else if(isAdmin())go("floor");
  else go("login");
  setupRealtime();
}).catch(function(e){
  console.error(e);
  document.getElementById("app").innerHTML='<div class="screen"><div class="wrap"><div class="empty"><div class="big">❌</div><div class="msg">CONNECTION FAILED</div><button class="btn" style="margin-top:20px" onclick="location.reload()">Retry</button></div></div></div>';
});
