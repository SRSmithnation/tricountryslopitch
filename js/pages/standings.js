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
