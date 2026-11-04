/* HICHAM SPONSORING — consentement, pixels, GA4 et statistiques first-party.
   Aucun secret ici. Chargé en defer : ne bloque pas l'affichage. */
(function () {
  'use strict';
  var W = window, D = document, C = W.HS_CONFIG || {};
  var K = { c: 'hs_consent', v: 'hs_vid', f: 'hs_ft', l: 'hs_lt', s: 'hs_ses', n: 'hs_notrack' };

  function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function hex(n) {
    var a = new Uint8Array(n / 2), s = '', i;
    if (W.crypto && W.crypto.getRandomValues) W.crypto.getRandomValues(a);
    else for (i = 0; i < a.length; i++) a[i] = Math.random() * 256;
    for (i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2);
    return s;
  }

  // Exclure ses propres visites : ouvrir le site avec ?notrack=1 (réactiver : ?notrack=0)
  if (/[?&]notrack=1(&|$)/.test(location.search)) set(K.n, 1);
  if (/[?&]notrack=0(&|$)/.test(location.search)) del(K.n);
  if (get(K.n)) return;

  var req = C.consentRequired !== false, cs = get(K.c) || null;
  function okA() { return !req || !!(cs && cs.a); }
  function okM() { return !req || !!(cs && cs.m); }

  /* ---------- Provenance ---------- */
  function mapSrc(s) {
    if (/^(fb|facebook|meta|an|msg)$/.test(s)) return 'facebook';
    if (/^(ig|instagram)$/.test(s)) return 'instagram';
    if (/^google/.test(s)) return 'google';
    if (/^(chatgpt|openai)/.test(s)) return 'chatgpt';
    if (/^(wa|whatsapp)/.test(s)) return 'whatsapp';
    if (/^tiktok/.test(s)) return 'tiktok';
    return '';
  }
  function mapHost(h) {
    if (!h) return '';
    if (/(^|\.)(facebook|fb)\.com$/.test(h)) return 'facebook';
    if (/(^|\.)instagram\.com$/.test(h)) return 'instagram';
    if (/(^|\.)google\.[a-z.]+$/.test(h)) return 'google';
    if (/^(chatgpt\.com|chat\.openai\.com|openai\.com)$/.test(h)) return 'chatgpt';
    if (/(^|\.)(whatsapp\.com)$|^wa\.me$/.test(h)) return 'whatsapp';
    if (/(^|\.)tiktok\.com$/.test(h)) return 'tiktok';
    return '';
  }
  function classify() {
    var q = new URLSearchParams(location.search);
    function g(k) { return (q.get(k) || '').toLowerCase().slice(0, 80); }
    var a = { src: g('utm_source'), med: g('utm_medium'), cmp: g('utm_campaign'), cnt: g('utm_content'), trm: g('utm_term') };
    var rh = '';
    try { rh = new URL(D.referrer).hostname.replace(/^www\./, ''); } catch (e) {}
    if (rh === location.hostname.replace(/^www\./, '')) rh = '';
    a.ref = rh.slice(0, 80);
    a.ch = mapSrc(a.src) || mapHost(rh) ||
      (q.get('oppref') ? 'chatgpt' : '') ||
      ((q.get('gclid') || q.get('gbraid') || q.get('wbraid')) ? 'google' : '') ||
      (q.get('fbclid') ? 'facebook' : '') ||
      ((a.src || rh) ? 'other' : 'direct');
    return a;
  }
  function pick(c) { return { ch: c.ch, src: c.src, med: c.med, cmp: c.cmp }; }

  function session() {
    var n = Date.now(), s = get(K.s), cur = classify(), ex = cur.ch !== 'direct';
    var fresh = !s || n - s.last > 1800000 ||
      (ex && s.a && (s.a.ch !== cur.ch || s.a.src !== cur.src || s.a.cmp !== cur.cmp || s.a.ref !== cur.ref));
    if (fresh) {
      s = { id: hex(20), a: cur, last: n };
      if (!get(K.f)) set(K.f, pick(cur));            // première source : écrite une seule fois
      if (ex || !get(K.l)) set(K.l, pick(cur));      // dernière source connue (hors direct)
    }
    s.last = n; set(K.s, s);
    return s;
  }
  function vid() { var v = get(K.v); if (!v) { v = hex(24); set(K.v, v); } return v; }

  function dev() {
    var u = navigator.userAgent || '';
    if (/iPad|Tablet/i.test(u) || (/Android/i.test(u) && !/Mobile/i.test(u))) return 'tablet';
    return /Mobi|iPhone|Android/i.test(u) ? 'mobile' : 'desktop';
  }
  var TZ = { 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Africa/Casablanca': 'MA', 'Africa/Tripoli': 'LY', 'Africa/Cairo': 'EG',
    'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Berlin': 'DE', 'Europe/London': 'GB',
    'Europe/Istanbul': 'TR', 'America/Toronto': 'CA', 'America/Montreal': 'CA', 'America/New_York': 'US', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA' };
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
  function cty() { // approximatif : fuseau horaire, à défaut région de la langue du navigateur
    var m = (navigator.language || '').match(/-([A-Za-z]{2})$/);
    return TZ[tz()] || (m ? m[1].toUpperCase() : '');
  }

  /* ---------- Plateformes ---------- */
  var sa = 0, sm = 0, ga = 0, last = {};
  var MN = { whatsapp_click: 'WhatsApp_Click', phone_click: 'Phone_Click', maps_click: 'Maps_Click' };
  function isContact(t) { return t === 'whatsapp_click' || t === 'phone_click'; }

  function initMeta() {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(W, D, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    W.fbq('init', C.meta.pixelId);
  }
  function initOai() { // code officiel fourni, + consent (API documentée de l'SDK)
    !function (w, d, s, u) {
      if (w.oaiq) return; var q = function () { q.q.push(arguments); }; q.q = []; w.oaiq = q;
      var j = d.createElement(s); j.async = 1; j.src = u; var f = d.getElementsByTagName(s)[0]; f.parentNode.insertBefore(j, f);
    }(W, D, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
    W.oaiq('consent', true);
    W.oaiq('init', { pixelId: C.openai.pixelId, debug: !!C.openai.debug });
  }
  function initGA() {
    var id = C.ga4 && C.ga4.measurementId;
    if (!/^G-[A-Z0-9]{6,}$/.test(id || '')) return;
    W.dataLayer = W.dataLayer || [];
    W.gtag = function () { W.dataLayer.push(arguments); };
    var s = D.createElement('script'); s.async = 1; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id; D.head.appendChild(s);
    W.gtag('js', new Date()); W.gtag('config', id, { anonymize_ip: true }); // envoie page_view automatiquement
    ga = 1;
  }

  // Meta + ChatGPT Ads (consentement "publicité")
  function mk(t, label, id) {
    if (C.meta && C.meta.pixelId && W.fbq) {
      if (t === 'page_view') W.fbq('track', 'PageView');
      else { W.fbq('trackCustom', MN[t]); if (isContact(t)) W.fbq('track', 'Contact'); }
    }
    if (C.openai && C.openai.pixelId && W.oaiq) {
      if (t === 'page_view') W.oaiq('measure', 'page_viewed', { type: 'contents' }, { event_id: id });
      else if (isContact(t)) W.oaiq('measure', 'lead_created', { type: 'customer_action' }, { event_id: id });
      else W.oaiq('measure', 'custom', { type: 'custom' }, { custom_event_name: 'maps_click', event_id: id });
    }
  }

  // Statistiques first-party : écriture REST (pas de SDK Firebase sur le site public => léger, et keepalive survit à la navigation)
  function fp(t, label, id) {
    var f = C.firebase;
    if (!f || !f.projectId || !f.apiKey) return null;
    var s = session(), a = s.a, ft = get(K.f) || {}, lt = get(K.l) || {};
    var ev = { t: t, vid: vid(), sid: s.id, pg: location.pathname.slice(0, 120), el: label || '',
      ch: a.ch, src: a.src, med: a.med, cmp: a.cmp, cnt: a.cnt, trm: a.trm, ref: a.ref,
      fch: ft.ch, fsrc: ft.src, fmed: ft.med, fcmp: ft.cmp, lch: lt.ch, lsrc: lt.src, lmed: lt.med, lcmp: lt.cmp,
      dev: dev(), cty: cty(), lg: (navigator.language || '').slice(0, 12), tz: tz().slice(0, 40) };
    var fields = {}, k;
    for (k in ev) if (ev[k]) fields[k] = { stringValue: String(ev[k]).slice(0, 100) };
    var db = 'projects/' + f.projectId + '/databases/(default)/documents';
    return fetch('https://firestore.googleapis.com/v1/' + db + ':commit?key=' + encodeURIComponent(f.apiKey), {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes: [{ update: { name: db + '/events/' + id, fields: fields },
        updateTransforms: [{ fieldPath: 'ts', setToServerValue: 'REQUEST_TIME' }], currentDocument: { exists: false } }] })
    }).catch(function () {});
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function track(t, label) { // un seul envoi par plateforme, anti-doublon 1,5 s
    var n = Date.now(); if (last[t] && n - last[t] < 1500) return null; last[t] = n;
    var id = hex(20), ps = [];
    if (sm) mk(t, label, id);
    if (sa) {
      if (ga && W.gtag) W.gtag('event', MN[t], { link_location: label });
      var p = fp(t, label, id); if (p) ps.push(p);
    }
    if (!ps.length && sm) ps.push(wait(150));
    return ps.length ? Promise.all(ps) : null;
  }

  function start() {
    if (okA() && !sa) { sa = 1; initGA(); fp('page_view', '', hex(20)); }
    if (okM() && !sm) {
      sm = 1;
      if (C.meta && C.meta.pixelId) initMeta();
      if (C.openai && C.openai.pixelId) initOai();
      mk('page_view', '', hex(20));
    }
  }

  /* ---------- Clics : WhatsApp / téléphone / Maps (délégation, aucun lien existant modifié) ---------- */
  function place(a) {
    if (a.classList.contains('wa-float')) return 'float';
    return a.closest('header') ? 'nav' : a.closest('.hero') ? 'hero' : a.closest('.band') ? 'band' :
      a.closest('#payment') ? 'payment' : a.closest('#location') ? 'location' : a.closest('footer') ? 'footer' : 'other';
  }
  D.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || (!sa && !sm)) return;
    var h = a.getAttribute('href') || '', t = null;
    if (/^tel:/i.test(h)) t = 'phone_click';
    else if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\//i.test(h) || /^whatsapp:/i.test(h)) t = 'whatsapp_click';
    else if (/^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps|maps\.google\.)/i.test(h)) t = 'maps_click';
    if (!t) return;
    var p = track(t, place(a));
    // Lien ouvert dans le même onglet : on laisse (max 400 ms) l'envoi partir avant de quitter la page
    var same = !a.target || a.target === '_self';
    if (p && same && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && !a.hasAttribute('download')) {
      e.preventDefault();
      Promise.race([p, wait(400)]).then(function () { location.href = a.href; });
    }
  }, true);

  /* ---------- Bannière de consentement (FR / AR) ---------- */
  var T = {
    fr: { t: 'Vos choix sur les cookies', p: 'Nous mesurons l’audience du site et l’efficacité de nos publicités. Les statistiques sont anonymes ; la publicité (Meta, ChatGPT Ads) n’est activée que si vous l’acceptez.',
      s: 'Statistiques d’audience', a: 'Publicité et mesure des campagnes', ok: 'Tout accepter', no: 'Tout refuser', cu: 'Personnaliser', sv: 'Enregistrer', mg: 'Gérer les cookies' },
    ar: { t: 'خياراتك بخصوص ملفات تعريف الارتباط', p: 'نقيس عدد زوار الموقع وفعالية إعلاناتنا. الإحصائيات مجهولة الهوية، ولا يتم تفعيل الإعلانات (Meta وChatGPT Ads) إلا بموافقتك.',
      s: 'إحصائيات الزيارات', a: 'الإعلانات وقياس الحملات', ok: 'قبول الكل', no: 'رفض الكل', cu: 'تخصيص', sv: 'حفظ', mg: 'إدارة ملفات تعريف الارتباط' }
  };
  var box = null, open = false, custom = false, pa = false, pm = false, mg = null;
  function L() { return D.documentElement.lang === 'ar' ? 'ar' : 'fr'; }
  function el(tag, cls, txt) { var e = D.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }

  function purge(a, m) {
    var ck = [];
    if (a) { del(K.v); del(K.f); del(K.l); del(K.s); ck.push('_ga', '_gid'); D.cookie.split(';').forEach(function (c) { var n = c.split('=')[0].trim(); if (/^_ga/.test(n)) ck.push(n); }); }
    if (m) ck.push('_fbp', '_fbc');
    ck.forEach(function (n) {
      [location.hostname, '.' + location.hostname, ''].forEach(function (d) {
        D.cookie = n + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/' + (d ? ';domain=' + d : '');
      });
    });
  }
  function decide(a, m) {
    var prev = cs || {};
    cs = { a: !!a, m: !!m, ts: Date.now(), v: 1 }; set(K.c, cs);
    if ((prev.a && !a) || (prev.m && !m)) { purge(prev.a && !a, prev.m && !m); location.reload(); return; }
    open = false; if (box) { box.remove(); box = null; }
    start();
  }
  function render() {
    if (!open) return;
    var t = T[L()];
    if (!box) { box = el('div', 'hs-cb'); box.setAttribute('role', 'dialog'); D.body.appendChild(box); }
    box.dir = D.documentElement.dir || 'ltr'; box.setAttribute('aria-label', t.t); box.textContent = '';
    box.appendChild(el('b', '', t.t)); box.appendChild(el('p', '', t.p));
    if (custom) {
      [['s', 'pa'], ['a', 'pm']].forEach(function (r) {
        var lb = el('label'), cb = D.createElement('input'); cb.type = 'checkbox';
        cb.checked = r[1] === 'pa' ? pa : pm;
        cb.onchange = function () { if (r[1] === 'pa') pa = cb.checked; else pm = cb.checked; };
        lb.appendChild(cb); lb.appendChild(el('span', '', t[r[0]])); box.appendChild(lb);
      });
    }
    var row = el('div', 'hs-row');
    var no = el('button', 'hs-btn', t.no), ok = el('button', 'hs-btn p', t.ok), cu = el('button', 'hs-btn', custom ? t.sv : t.cu);
    no.type = ok.type = cu.type = 'button';
    no.onclick = function () { decide(false, false); };
    ok.onclick = function () { decide(true, true); };
    cu.onclick = function () { if (custom) decide(pa, pm); else { custom = true; render(); } };
    row.appendChild(no); row.appendChild(ok); row.appendChild(cu); box.appendChild(row);
  }
  function injectUI() {
    var st = el('style'); st.textContent =
      '.hs-cb{position:fixed;left:16px;right:16px;bottom:16px;max-width:560px;margin:auto;z-index:50;background:#fff;color:#12233d;border:1px solid #e5edf7;border-radius:18px;padding:18px 20px;box-shadow:0 18px 50px #08265340;font:14px/1.55 Inter,system-ui,-apple-system,"Segoe UI",Arial,sans-serif}' +
      '.hs-cb b{display:block;color:#082653;font-size:16px;margin-bottom:4px}.hs-cb p{margin:0 0 10px;color:#5a6c85}' +
      '.hs-cb label{display:flex;gap:9px;align-items:center;margin:6px 0;font-weight:650;color:#082653}' +
      '.hs-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}' +
      '.hs-btn{flex:1;min-width:110px;padding:11px 14px;border-radius:11px;font:inherit;font-weight:800;cursor:pointer;border:1px solid #cbdcf2;background:#fff;color:#082653}' +
      '.hs-btn.p{background:#0756c9;border-color:#0756c9;color:#fff}' +
      '.hs-mg{background:none;border:0;padding:0;color:#0756c9;font:inherit;font-weight:700;cursor:pointer;text-decoration:underline}';
    D.head.appendChild(st);
    var fi = D.querySelector('.footer-inner');
    if (fi) {
      mg = el('button', 'hs-mg', T[L()].mg); mg.type = 'button';
      mg.onclick = function () { pa = !!(cs && cs.a); pm = !!(cs && cs.m); open = true; custom = true; render(); };
      fi.appendChild(mg);
    }
    new MutationObserver(function () { render(); if (mg) mg.textContent = T[L()].mg; })
      .observe(D.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    if (req && !cs) { open = true; render(); }
  }

  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { injectUI(); start(); });
  else { injectUI(); start(); }
})();
