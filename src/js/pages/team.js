const params = new URLSearchParams(location.search);
const wanted = (params.get('t') || '').trim();

const render = d => {
  const canon = canonicalTeam(wanted, d.teams);
  const team = d.teams.includes(wanted) ? wanted : (canon.matched ? canon.name : null);

  if (!team) {
    document.getElementById('team-title').textContent = 'Team not found';
    document.getElementById('teamhead').innerHTML =
      `<div class="empty"><strong>Not in this season</strong>
        ${wanted ? `No team called &ldquo;${esc(wanted)}&rdquo; in the ${d.year} season. ` : ''}
        <a href="teams.html">See every team</a></div>`;
    ['team-results', 'team-fixtures'].forEach(id => document.getElementById(id).innerHTML = '');
    ['fixtures-head', 'team-form', 'team-splits'].forEach(id => {
      const el = document.getElementById(id); if (el) el.remove();
    });
    return;
  }

  document.title = `${team} | Tri-County Slo-Pitch League`;
  document.getElementById('team-title').textContent = team;
  const mine = d.games.filter(g => g.home === team || g.away === team);
  const played = mine.filter(g => g.home_score != null && g.away_score != null && g.verify !== 'disputed')
    .sort((a, b) => a.iso.localeCompare(b.iso));
  const rows = standings(d.teams, d.games);
  const me = rows.find(r => r.team === team) || { w: 0, l: 0, t: 0, gp: 0, rf: 0, ra: 0, diff: 0, pct: 0 };
  const place = rows.findIndex(r => r.team === team) + 1;
  const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - n % 10 != 10) * (n % 10 < 4) * n % 10] || 'th');
  const num = (d.team_numbers || {})[team];

  document.getElementById('team-no').textContent = num ?? '';
  document.getElementById('team-sub').textContent =
    `${d.year} ${d.division}${me.gp ? ` \u00b7 ${ord(place)} in the league` : ''}`;
  document.getElementById('team-stats').innerHTML = `
    <div><b>${me.w}&ndash;${me.l}${me.t ? '&ndash;' + me.t : ''}</b><span>Record</span></div>
    <div><b>${me.gp}</b><span>Played</span></div>
    <div><b>${me.diff >= 0 ? '+' : ''}${me.diff}</b><span>Run diff</span></div>`;

  const fmt = iso => new Date(iso + 'T00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
  document.getElementById('team-results').innerHTML = played.length
    ? played.slice().reverse().map(g => {
        const home = g.home === team;
        const mineScore = home ? g.home_score : g.away_score;
        const theirs = home ? g.away_score : g.home_score;
        const opp = home ? g.away : g.home;
        const res = mineScore > theirs ? 'W' : mineScore < theirs ? 'L' : 'T';
        return `<tr>
          <td>${esc(fmt(g.iso))}</td>
          <td>${home ? '' : '<span class="at">at</span> '}${esc(stripNo(opp))}</td>
          <td class="num">${mineScore}&ndash;${theirs}</td>
          <td class="num"><span class="res res--${res.toLowerCase()}">${res}</span></td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="4">No results yet this season.</td></tr>`;

  const today = new Date().toISOString().slice(0, 10);
  const fixtures = mine.filter(g => g.home_score == null && g.iso >= today)
    .sort((a, b) => a.iso.localeCompare(b.iso));
  const missing = mine.filter(g => g.home_score == null && g.iso < today);
  const head = document.getElementById('fixtures-head');
  if (fixtures.length) {
    head.textContent = 'Still to play';
    document.getElementById('team-fixtures').innerHTML = fixtures.map(g => `<tr>
      <td>${esc(fmt(g.iso))}</td><td>${esc((g.time || '').toUpperCase())}</td>
      <td>${g.home === team ? '' : '<span class="at">at</span> '}${esc(stripNo(g.home === team ? g.away : g.home))}</td>
      <td>${esc(g.venue || '')}</td></tr>`).join('');
  } else if (missing.length) {
    head.textContent = 'Awaiting scores';
    document.getElementById('team-fixtures').innerHTML = missing.map(g => `<tr>
      <td>${esc(fmt(g.iso))}</td><td>${esc((g.time || '').toUpperCase())}</td>
      <td>${g.home === team ? '' : '<span class="at">at</span> '}${esc(stripNo(g.home === team ? g.away : g.home))}</td>
      <td>${esc(g.venue || '')}</td></tr>`).join('');
  } else {
    head.remove();
    document.getElementById('team-fixtures').closest('.card').remove();
  }

  const last5 = played.slice(-5).map(g => {
    const home = g.home === team;
    const m = home ? g.home_score : g.away_score, t = home ? g.away_score : g.home_score;
    return m > t ? 'W' : m < t ? 'L' : 'T';
  });
  let streak = '';
  if (last5.length) {
    const seq = played.slice().reverse().map(g => {
      const home = g.home === team;
      const m = home ? g.home_score : g.away_score, t = home ? g.away_score : g.home_score;
      return m > t ? 'W' : m < t ? 'L' : 'T';
    });
    let n = 1; while (n < seq.length && seq[n] === seq[0]) n++;
    streak = seq[0] + n;
  }
  document.getElementById('team-form').innerHTML = `<h3>Form</h3>
    ${last5.length
      ? `<p class="formdots">${last5.map(r => `<span class="res res--${r.toLowerCase()}">${r}</span>`).join('')}</p>
         <p>Last ${last5.length} game${last5.length === 1 ? '' : 's'}, oldest first.
            Current streak <b>${streak}</b>.</p>`
      : '<p>No games played yet.</p>'}`;

  const homeG = played.filter(g => g.home === team);
  const awayG = played.filter(g => g.away === team);
  const rec = gs => {
    let w = 0, l = 0, t = 0;
    gs.forEach(g => {
      const mine2 = g.home === team ? g.home_score : g.away_score;
      const th = g.home === team ? g.away_score : g.home_score;
      if (mine2 > th) w++; else if (mine2 < th) l++; else t++;
    });
    return `${w}&ndash;${l}${t ? '&ndash;' + t : ''}`;
  };
  document.getElementById('team-splits').innerHTML = `<h3>Splits</h3>
    <p>Home <b>${rec(homeG)}</b> &middot; Away <b>${rec(awayG)}</b></p>
    <p>Runs for <b>${me.rf}</b> &middot; against <b>${me.ra}</b></p>`;
};

loadSeason(null, render).then(render);
