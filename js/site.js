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
    .sort((a, b) => b.gp - a.gp || b.pct - a.pct || b.diff - a.diff || a.team.localeCompare(b.team));
}

/* shrink-on-scroll header */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const f = () => nav.classList.toggle('nav--compact', window.scrollY > 40);
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

document.addEventListener('DOMContentLoaded', () => { initNav(); initRegistrationYear(); });


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
    const target = year || null;
    const base = target
      ? Promise.resolve(target)
      : fetch('data/seasons.json').then(r => r.json()).then(l => Math.max(...l.map(s => s.year)));
    return base.then(y => fetch(`data/seasons/${y}.json`).then(r => r.json()).then(d => {
      const live = cfg.scores_csv && (!target || +target === +cfg.current_season);
      if (!live) return { ...d, scoreSource: 'repo' };
      return fetch(cfg.scores_csv).then(r => { if (!r.ok) throw 0; return r.text(); })
        .then(txt => {
          const byId = new Map(parseCsv(txt).map(r => [String(r.ID), r]));
          let merged = 0;
          d.games.forEach(g => {
            const r = byId.get(String(g.id)); if (!r) return;
            const a = num(r['Away Score']), h = num(r['Home Score']);
            if (a !== null && h !== null) { g.away_score = a; g.home_score = h; merged++; }
            if (r.Status) g.status = r.Status;
            if (r.Notes) g.notes = r.Notes;
          });
          return { ...d, scoreSource: 'sheet', merged };
        })
        .catch(() => ({ ...d, scoreSource: 'repo-fallback' }));
    }));
  });
}
