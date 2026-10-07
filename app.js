window.YONDU_APP_CONFIG = {
  supabaseUrl: 'https://murcilacjeoemdgrfwpl.supabase.co',
  supabaseKey: 'sb_publishable_7exYurU_LMovVH8jHysPmg_YaY76aci',
  cafePhone: '+91 90000 00000',
  currency: 'INR',
  pointsPerRupee: 1 / 20,
  pointsPerHour: 1000,
  maxPoints: 10000,
  refBonus: 50,
  birthdayBonus: 100,
  defaultInstagram: 'https://instagram.com/yondugamingcafe',
  defaultGoogleReview: 'https://g.page'
};

window.escapeHtml = function(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

window.safeText = function(value) {
  return window.escapeHtml(String(value ?? ''));
};

window.getAppConfig = function() {
  return window.YONDU_APP_CONFIG || {};
};

window.getSafeLocalStorageValue = function(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

window.setSafeLocalStorageValue = function(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Could not write localStorage:', e);
  }
};

window.addEventListener('DOMContentLoaded', function() {
  const nav = document.getElementById('nav');
  if (nav) {
    nav.setAttribute('aria-label', 'Main app navigation');
  }
});
