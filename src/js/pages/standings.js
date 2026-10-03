window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

loadSeason().then(d=>{
    document.getElementById('sub').textContent = `${d.year} ${d.division}`;
    const rows = standings(d.teams, d.games);
    const played = d.games.filter(g=>g.home_score!=null).length;
    if (!played) { const n=document.getElementById('notice'); n.hidden=false;
      n.innerHTML = `<strong>No scores recorded yet.</strong> Teams are listed below. Standings will calculate automatically once game results are added.`; }
    document.getElementById('body').innerHTML = rows.map((x,i)=>`
      <tr><td>${x.gp?`<span class="rank">${i+1}</span>`:'<span class="dash">&ndash;</span>'}</td>
        <td class="team-name">${esc(x.team)}</td>
        <td class="num">${x.gp||'<span class="dash">&ndash;</span>'}</td>
        <td class="num">${x.gp?x.w:'<span class="dash">&ndash;</span>'}</td>
        <td class="num">${x.gp?x.l:'<span class="dash">&ndash;</span>'}</td>
        <td class="num pct">${x.gp?x.pct.toFixed(3).replace(/^0/,''):'<span class="dash">&ndash;</span>'}</td>
        <td class="num">${x.gp?x.rf:'<span class="dash">&ndash;</span>'}</td>
        <td class="num">${x.gp?x.ra:'<span class="dash">&ndash;</span>'}</td>
        <td class="num">${x.gp?(x.diff>0?'+':'')+x.diff:'<span class="dash">&ndash;</span>'}</td></tr>`).join('');
  });

loadSeason().then(d => {
  const played = d.games.filter(g => g.home_score != null && g.away_score != null);
  const teams = d.teams.slice();
  if (!played.length) return;

  const rec = {};
  teams.forEach(a => { rec[a] = {}; teams.forEach(b => { if (a !== b) rec[a][b] = { w: 0, l: 0, t: 0 }; }); });
  played.forEach(g => {
    if (!rec[g.home] || !rec[g.home][g.away]) return;
    const h = rec[g.home][g.away], a = rec[g.away][g.home];
    if (g.home_score > g.away_score) { h.w++; a.l++; }
    else if (g.away_score > g.home_score) { a.w++; h.l++; }
    else { h.t++; a.t++; }
  });

  const short = n => n.split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
  document.getElementById('h2h-head').innerHTML =
    '<tr><th></th>' + teams.map(t => `<th class="num" title="${esc(t)}">${esc(short(t))}</th>`).join('') + '</tr>';
  document.getElementById('h2h-body').innerHTML = teams.map(a => {
    const cells = teams.map(b => {
      if (a === b) return '<td class="h2h-self"></td>';
      const r = rec[a][b];
      if (!(r.w + r.l + r.t)) return '<td class="num dash">&ndash;</td>';
      const cls = r.w > r.l ? 'h2h-win' : r.l > r.w ? 'h2h-loss' : 'h2h-even';
      return `<td class="num ${cls}" title="${esc(a)} vs ${esc(b)}">${r.w}&ndash;${r.l}${r.t ? '&ndash;' + r.t : ''}</td>`;
    }).join('');
    return `<tr><th class="h2h-team">${esc(a)}</th>${cells}</tr>`;
  }).join('');

  const days = [...new Set(played.map(g => g.iso))].sort();
  const series = {}; teams.forEach(t => series[t] = []);
  days.forEach((day, i) => {
    standings(teams, played.filter(g => g.iso <= day)).forEach((row, idx) => {
      if (row.gp) series[row.team][i] = idx + 1;
    });
  });

  const PAL = ['#0F264F', '#C1A25D', '#214B6E', '#8a9bb5', '#6b8f71', '#9b5f5f', '#7a6ca0'];
  const W = 760, H = 300, P = { t: 18, r: 132, b: 34, l: 34 };
  const x = i => P.l + (days.length > 1 ? i * (W - P.l - P.r) / (days.length - 1) : 0);
  const y = pos => P.t + (pos - 1) * (H - P.t - P.b) / Math.max(1, teams.length - 1);
  const fmtDay = iso => new Date(iso + 'T00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

  let svg = `<svg viewBox="0 0 ${W} ${H}" class="svgchart" role="img" aria-label="League position after each game day">`;
  for (let p = 1; p <= teams.length; p++) {
    svg += `<line x1="${P.l}" y1="${y(p)}" x2="${W - P.r}" y2="${y(p)}" class="grid"/>`;
    svg += `<text x="${P.l - 9}" y="${y(p) + 4}" class="axis" text-anchor="end">${p}</text>`;
  }
  days.forEach((dd, i) => {
    svg += `<text x="${x(i)}" y="${H - 12}" class="axis" text-anchor="middle">${fmtDay(dd)}</text>`;
  });
  teams.forEach((t, ti) => {
    const pts = series[t].map((p, i) => p ? `${x(i)},${y(p)}` : null).filter(Boolean);
    if (!pts.length) return;
    const c = PAL[ti % PAL.length];
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    pts.forEach(pt => { const [cx, cy] = pt.split(','); svg += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${c}"/>`; });
    const lp = series[t].filter(Boolean).pop();
    svg += `<text x="${W - P.r + 10}" y="${y(lp) + 4}" class="serieslabel" fill="${c}">${esc(t)}</text>`;
  });
  svg += '</svg>';
  document.getElementById('chart-pos').innerHTML = svg;

  const rows = standings(teams, played).filter(r => r.gp);
  const max = Math.max(...rows.map(r => Math.max(r.rf, r.ra)));
  document.getElementById('chart-runs').innerHTML = rows.map(r => `
    <div class="runrow">
      <span class="runrow__team">${esc(r.team)}</span>
      <span class="runrow__bars">
        <span class="bar bar--for" style="width:${(r.rf / max * 100).toFixed(1)}%"><b>${r.rf}</b></span>
        <span class="bar bar--against" style="width:${(r.ra / max * 100).toFixed(1)}%"><b>${r.ra}</b></span>
      </span>
      <span class="runrow__diff ${r.diff >= 0 ? 'pos' : 'neg'}">${r.diff >= 0 ? '+' : ''}${r.diff}</span>
    </div>`).join('') +
    '<p class="legend"><span class="key key--for"></span> runs for &nbsp; <span class="key key--against"></span> runs against</p>';
});
