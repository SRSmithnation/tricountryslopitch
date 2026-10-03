/* Shared helpers + chrome for the Tri-County Slo-Pitch site */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const stripNo = t => esc(String(t ?? '').replace(/^#?\d+\s*/, ''));
const clean = stripNo;   /* alias */
const toDate = d => { const p = String(d).split('/'); return new Date(p[2].length === 4 ? +p[2] : 2000 + +p[2], +p[0] - 1, +p[1]); };
const fmtDay = dt => dt.toLocaleDateString('en-CA', { weekday: 'long' });
const fmtDate = dt => dt.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });

/* group a games array into date-ordered day buckets */
function byDay(games) {
  const m = new Map();
  games.forEach(g => { if (!m.has(g.date)) m.set(g.date, []); m.get(g.date).push(g); });
  return [...m.entries()]
    .map(([date, gs]) => ({ date, games: gs, dt: toDate(date) }))
    .sort((a, b) => a.dt - b.dt);
}

/* standings computed from real scores only */
function standings(teams, games) {
  const t = {};
  const seed = n => t[n] ||= { team: n, w: 0, l: 0, tie: 0, rf: 0, ra: 0 };
  (teams || []).forEach(seed);
  games.forEach(g => {
    if (g.home_score == null || g.away_score == null) return;
    const h = seed(g.home), a = seed(g.away);
    h.rf += g.home_score; h.ra += g.away_score;
    a.rf += g.away_score; a.ra += g.home_score;
    if (g.home_score > g.away_score) { h.w++; a.l++; }
    else if (g.away_score > g.home_score) { a.w++; h.l++; }
    else { h.tie++; a.tie++; }
  });
  return Object.values(t)
    .map(x => ({ ...x, gp: x.w + x.l + x.tie, diff: x.rf - x.ra,
                 pct: (x.w + x.l + x.tie) ? (x.w + x.tie / 2) / (x.w + x.l + x.tie) : 0 }))
    /* Rank on win percentage, not games played. Teams with a game in hand must
       not drop below teams with more losses. Teams yet to play sort last. */
    .sort((a, b) => (b.gp ? 1 : 0) - (a.gp ? 1 : 0)
                 || b.pct - a.pct || b.diff - a.diff || b.w - a.w
                 || a.team.localeCompare(b.team));
}

/* shrink-on-scroll header */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const setH = () => document.documentElement.style.setProperty('--navh', nav.offsetHeight + 'px');
  /* Hysteresis: compact past 72px, expand again only under 24px. A single
     threshold makes the class flip-flop when you hover right on it. */
  let compact = false;
  const f = () => {
    const y = window.scrollY;
    if (!compact && y > 72) compact = true;
    else if (compact && y < 24) compact = false;
    nav.classList.toggle('nav--compact', compact);
    setH();
  };
  addEventListener('resize', setH);
  f(); addEventListener('scroll', f, { passive: true });
}

/* Season year rule, in ONE place:
   once today passes the 2nd game day of the latest season, the
   "current/registration" season rolls to the next year. */
let _seasonMeta = null;
function seasonMeta() {
  return _seasonMeta ||= fetch('data/seasons.json').then(r => r.json()).then(list => {
    const latest = Math.max(...list.map(s => s.year));
    return fetch(`data/seasons/${latest}.json`).then(r => r.json()).then(d => {
      const days = byDay(d.games || []);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const rolled = days.length >= 2 && today >= days[1].dt;
      return { latest, current: rolled ? latest + 1 : latest, rolled };
    });
  });
}

function initRegistrationYear() {
  const els = document.querySelectorAll('[data-reg-year]');
  if (!els.length) return;
  seasonMeta().then(m => els.forEach(el => el.textContent = m.current)).catch(() => {});
}

/* Contact links: use the Google Form if one is configured,
   otherwise fall back to a mailto: so the link is never dead. */
function initContactLinks() {
  const els = document.querySelectorAll('[data-contact]');
  if (!els.length) return;
  config().then(c => {
    const href = c.contact_form ? c.contact_form
               : (c.contact_email ? 'mailto:' + c.contact_email : null);
    if (!href) return;
    els.forEach(el => {
      el.href = href;
      if (/^https?:/i.test(href)) { el.target = '_blank'; el.rel = 'noopener'; }
    });
  }).catch(() => {});
}

/* Mobile menu — delegated from document so it cannot miss the element,
   and independent of when this script runs. */
function initMenu() {
  const close = () => {
    document.body.classList.remove('menu-open');
    document.getElementById('nav-toggle')?.setAttribute('aria-expanded', 'false');
  };
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('#nav-toggle');
    if (btn) {
      e.preventDefault();
      const open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      return;
    }
    if (e.target.closest?.('#nav-menu a')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('resize', () => { if (innerWidth > 880) close(); });
}

function boot() {
  [initNav, initMenu, initRegistrationYear, initContactLinks].forEach(fn => {
    try { fn(); } catch (err) { console.error('init failed:', fn.name, err); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();


/* ------------------------------------------------------------------
   Season loading.
   Source of truth is the JSON in this repo. If a published Google
   Sheet is configured, its scores are merged in on top (matched on
   game ID). If the sheet is unreachable or malformed, the page still
   renders from JSON — the site never depends on Google being up.
------------------------------------------------------------------- */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim());
  return rows.filter(r => r.some(v => v.trim()))
             .map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const num = v => { const n = Number(String(v).trim()); return Number.isFinite(n) && String(v).trim() !== '' ? n : null; };

let _config = null;
const config = () => _config ||= fetch('data/config.json').then(r => r.json()).catch(() => ({}));

function loadSeason(year) {
  return config().then(cfg => {
    const base = year
      ? Promise.resolve(year)
      : fetch('data/seasons.json').then(r => r.json()).then(l => Math.max(...l.map(s => s.year)));
    return base.then(y => fetch(`data/seasons/${y}.json`).then(r => r.json()).then(d => {
      const isCurrent = !year || +year === +cfg.current_season;
      if (!isCurrent || !cfg.scores_csv) return { ...d, scoreSource: 'repo' };

      const get = url => url ? fetch(url).then(r => { if (!r.ok) throw 0; return r.text(); }).catch(() => null) : Promise.resolve(null);
      return Promise.all([get(cfg.scores_csv), get(cfg.responses_csv), get(cfg.teams_csv)]).then(([gTxt, rTxt, tTxt]) => {
        /* Teams from the sheet when published, so adding a team means
           typing a row rather than editing JSON. Repo data is the fallback. */
        if (tTxt) {
          const canon = d.teams.slice();          // names already known from the repo
          const rows = parseCsv(tTxt)
            .filter(r => (r.Team || '').trim())
            .map(r => ({ name: canonicalTeam(r.Team, canon).name, no: num(r['#']) }));
          if (rows.length) {
            rows.sort((a, b) => (a.no ?? 999) - (b.no ?? 999) || a.name.localeCompare(b.name));
            d.teams = rows.map(r => r.name);
            d.team_numbers = {};
            rows.forEach((r, i) => d.team_numbers[r.name] = r.no ?? i + 1);
            d.teamSource = 'sheet';
          }
        }
        if (!gTxt && !rTxt) return { ...d, scoreSource: 'repo-fallback' };

        /* 1. admin overrides from the Games tab — always win */
        const admin = new Map();
        if (gTxt) parseCsv(gTxt).forEach(r => {
          const a = num(r['Away Score']), h = num(r['Home Score']);
          if (a !== null && h !== null) admin.set(String(r.ID), { a, h, status: r.Status || 'Final' });
        });

        /* 2. captain reports, newest per reporting team */
        const reports = new Map();
        if (rTxt) parseCsv(rTxt).forEach(r => {
          const id = String(r['Game ID'] || '').trim();
          const a = num(r['Away Score']), h = num(r['Home Score']);
          if (!id || a === null || h === null) return;
          const who = (r['Reporting Team'] || r['Your Team'] || '').trim() || '(unnamed)';
          if (!reports.has(id)) reports.set(id, new Map());
          reports.get(id).set(who, { a, h, status: r.Status || 'Final', at: r.Timestamp || '' });
        });

        let confirmed = 0, unconfirmed = 0, disputed = 0, overridden = 0, locked = 0;
        d.games.forEach(g => {
          const id = String(g.id);
          /* scores already recorded in the repo (from league score sheets)
             are official and cannot be overwritten by captain reports */
          if (g.verify === 'official' && g.home_score != null) { locked++; return; }
          if (admin.has(id)) {
            const v = admin.get(id);
            g.away_score = v.a; g.home_score = v.h; g.status = v.status;
            g.verify = 'official'; overridden++; return;
          }
          const byTeam = reports.get(id);
          if (!byTeam || !byTeam.size) return;
          /* A game can only be reported by the two teams playing it. This stops
             an unrelated submission manufacturing a confirmation, or forcing a
             dispute on a score that both real teams already agreed. */
          const playing = [g.home, g.away].map(normalizeName);
          const valid = [...byTeam.entries()].filter(([who]) =>
            playing.includes(normalizeName(who)));
          const ignored = byTeam.size - valid.length;
          if (ignored) console.warn(`Game ${g.id}: ignored ${ignored} report(s) from teams not in this game.`);
          if (!valid.length) return;
          const vals = valid.map(([, v]) => v);
          const distinct = new Set(vals.map(v => `${v.a}-${v.h}`));
          if (distinct.size > 1) { g.verify = 'disputed'; g.reports = vals; disputed++; return; }
          const v = vals[0];
          g.away_score = v.a; g.home_score = v.h; g.status = v.status;
          if (valid.length >= 2) { g.verify = 'confirmed'; confirmed++; }
          else { g.verify = 'unconfirmed'; unconfirmed++; }
        });
        return { ...d, scoreSource: 'sheet', stats: { confirmed, unconfirmed, disputed, overridden, locked } };
      });
    }));
  });
}


/* Verification badge for a game's score provenance */
/* Only the exceptions get a badge. An official or confirmed score is the
   expected case, so badging it everywhere carries no information. */
const VERIFY = {
  unconfirmed: ['Unconfirmed', 'v-unconf',    'Reported by one team only — not yet confirmed'],
  disputed:    ['Disputed',    'v-disputed',  'Teams reported different scores — not published']
};
const VERIFY_TITLE = {
  official:  'Entered by the league',
  confirmed: 'Reported by both teams and matching'
};
function verifyBadge(g) {
  const v = VERIFY[g.verify];
  return v ? `<span class="vbadge ${v[1]}" title="${v[2]}">${v[0]}</span>` : '';
}
function verifyTitle(g) {
  const t = VERIFY_TITLE[g.verify];
  return t ? ` title="${t}"` : '';
}
function scoreCell(g, showBadge = true) {
  if (g.verify === 'disputed') return '<span class="vbadge v-disputed" title="Teams reported different scores">Disputed</span>';
  if (g.away_score == null || g.home_score == null) return '';
  return `<span class="score"${verifyTitle(g)}>${g.away_score}&ndash;${g.home_score}</span>${showBadge ? verifyBadge(g) : ''}`;
}


/* Per-game score-report link, with the Game ID prefilled.
   Falls back to the plain form if no prefill base is configured. */
function reportUrl(cfg, game) {
  const f = cfg.score_form_fields || {};
  if (cfg.score_form_prefill && f.game_id) {
    return `${cfg.score_form_prefill}&${f.game_id}=${encodeURIComponent(game.id)}`;
  }
  return cfg.score_form || '#';
}


/* ------------------------------------------------------------------
   Team-name safety.
   Names typed into the spreadsheet are free text, so a typo could
   invent a team. These map a typed name back to the canonical one
   from the repo data, and only accept a genuinely new name when it
   is not close to an existing team.
------------------------------------------------------------------- */
function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/^#?\d+\s*/, '')      // leading team number
    .replace(/[^a-z0-9]+/g, ' ')    // punctuation to spaces
    .trim()
    .replace(/\s+/g, ' ');
}

function editDistance(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/* Returns {name, matched, typo} — matched is the canonical name when the
   input is an exact or near match, otherwise the input is treated as new. */
function canonicalTeam(input, known) {
  const raw = String(input || '').trim();
  if (!raw) return { name: raw, matched: null, typo: false };
  const n = normalizeName(raw);
  for (const k of known) {
    if (normalizeName(k) === n) return { name: k, matched: k, typo: normalizeName(raw) !== normalizeName(k) };
  }
  // allow 1 edit per 6 characters, min 1, max 3
  const budget = Math.max(1, Math.min(3, Math.floor(n.length / 6)));
  let best = null, bestD = Infinity;
  for (const k of known) {
    const d = editDistance(n, normalizeName(k));
    if (d < bestD) { bestD = d; best = k; }
  }
  if (best && bestD <= budget) {
    console.warn(`Team name "${raw}" looks like a typo for "${best}" — using "${best}".`);
    return { name: best, matched: best, typo: true };
  }
  return { name: raw, matched: null, typo: false };
}
