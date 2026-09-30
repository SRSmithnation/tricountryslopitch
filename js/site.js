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
