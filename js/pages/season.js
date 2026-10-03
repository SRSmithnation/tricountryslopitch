window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

const year = (new URLSearchParams(location.search).get('y') || '2026').replace(/\D/g,'');

loadSeason(year)
.then(d=>{
  document.title = `${d.year} Season | Tri-County Slo-Pitch League`;
  document.getElementById('title').textContent = `${d.year} Season`;
  document.getElementById('sub').textContent = `${d.division} · ${d.teams.length} teams · ${d.games.length} games`;
  if (d.note) { const n=document.getElementById('notice'); n.hidden=false;
    n.innerHTML = `<strong>Incomplete record.</strong> ${esc(d.note)}`; }

  // --- standings computed from actual scores ---
  const played = d.games.filter(g=>g.home_score!=null && g.away_score!=null);
  const tbl = {};
  const seed = t => tbl[t] ||= {t, w:0, l:0, rf:0, ra:0};
  d.teams.forEach(seed);
  played.forEach(g=>{
    const h=seed(g.home), a=seed(g.away);
    h.rf+=g.home_score; h.ra+=g.away_score;
    a.rf+=g.away_score; a.ra+=g.home_score;
    if (g.home_score>g.away_score){h.w++;a.l++;} else if (g.away_score>g.home_score){a.w++;h.l++;}
  });
  const rows = Object.values(tbl)
    .map(x=>({...x, pct:(x.w+x.l)?x.w/(x.w+x.l):0, gp:x.w+x.l}))
    .sort((a,b)=> b.gp-a.gp || b.pct-a.pct || b.w-a.w || a.t.localeCompare(b.t));
  document.getElementById('standings').innerHTML = played.length
    ? rows.map((x,i)=>`<tr><td>${x.gp?`<span class="rank">${i+1}</span>`:'<span style="color:#9aa7bb">&ndash;</span>'}</td>
        <td class="team-name">${esc(x.t)}</td><td class="num">${x.w}</td><td class="num">${x.l}</td>
        <td class="num pct">${x.gp?x.pct.toFixed(3).replace(/^0/,''):'&ndash;'}</td>
        <td class="num">${x.gp?x.rf:'&ndash;'}</td><td class="num">${x.gp?x.ra:'&ndash;'}</td></tr>`).join('')
    : `<tr><td colspan="7"><div class="empty"><strong>No scores recorded</strong>
        Teams for this season are listed below, but no game results were recovered.</div></td></tr>`;

  // --- results grouped by day ---
  const days = new Map();
  d.games.forEach(g=>{ if(!days.has(g.date)) days.set(g.date,[]); days.get(g.date).push(g); });
  document.getElementById('days').innerHTML = days.size ? [...days.entries()].map(([date,gs])=>{
    const p = date.split('/'); const dt = new Date(p[2].length===4?+p[2]:2000+ +p[2], +p[0]-1, +p[1]);
    const wd = dt.toLocaleDateString('en-CA',{weekday:'long'});
    const nice = dt.toLocaleDateString('en-CA',{month:'long',day:'numeric'});
    const rows = gs.map(g=>{
      const has = g.home_score!=null && g.away_score!=null;
      const aw = has && g.away_score>g.home_score, hw = has && g.home_score>g.away_score;
      return `<li class="day__game">
        <div class="day__row">
          <div class="day__time">
            <span class="gid" title="Game ID">#${g.id}</span>
            <span class="day__clock">${esc((g.time||'').toUpperCase())}</span>
            ${has ? `<span class="day__score"${verifyTitle(g)}>${g.away_score}&ndash;${g.home_score}</span>` : ''}
          </div>
          <div>
            <div class="day__match">${esc(g.away)}${aw?'<span class="win-badge">W</span>':''}<span class="vs">at</span>${esc(g.home)}${hw?'<span class="win-badge">W</span>':''}</div>
            <div class="day__venue">${[esc(g.venue||''), verifyBadge(g)].filter(Boolean).join(' &middot; ')}</div>
          </div>
        </div></li>`;
    }).join('');
    return `<article class="day"><div class="day__head">
        <span class="day__date">${esc(wd)}, ${esc(nice)}</span>
        <span class="day__count">${gs.length} game${gs.length>1?'s':''}</span></div>
      <ul class="day__games">${rows}</ul></article>`;
  }).join('') : `<div class="empty"><strong>No games recorded</strong>No schedule was recovered for this season.</div>`;
})
.catch(()=>{ document.getElementById('title').textContent='Season not found';
  document.getElementById('days').innerHTML='<div class="empty"><strong>No record for that year</strong><a href="seasons.html">Back to all seasons</a></div>'; });
