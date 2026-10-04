window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

const renderTeams = d => {
    document.getElementById('sub').textContent = `${d.year} ${d.division} · ${d.teams.length} teams`;
    const st = standings(d.teams, d.games);
    const ord = n => n + (['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4] || 'th');
    const rank = Object.fromEntries(st.map((x,i)=>[x.team, x.gp?i+1:null]));
    document.getElementById('cards').innerHTML = d.teams.map((t,i)=>{
      const s = st.find(x=>x.team===t) || {gp:0,w:0,l:0};
      const gs = d.games.filter(g=>g.home===t||g.away===t);
      const next = gs[0];
      return `<article class="teamcard">
        <div class="teamcard__top">
          <span class="teamcard__no">${(d.team_numbers && d.team_numbers[t]) || i+1}</span>
          <span class="teamcard__name">${esc(t)}</span>
          ${rank[t]?`<span class="teamcard__rank" title="Position in the standings">${ord(rank[t])}</span>`:''}
        </div>
        <div class="teamcard__stats">
          <div><b>${s.gp||0}</b>Games</div>
          <div><b>${s.gp?s.w:'&ndash;'}</b>Won</div>
          <div><b>${s.gp?s.l:'&ndash;'}</b>Lost</div>
        </div>
        <div class="teamcard__foot">
          ${gs.length?`${gs.length} fixture${gs.length>1?'s':''} in ${d.year}`:'No fixtures'}
          <a href="schedule.html">View schedule &rarr;</a>
        </div>
      </article>`;
    }).join('');
  };

loadSeason(null, renderTeams).then(renderTeams);
