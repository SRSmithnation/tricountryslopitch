window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

const renderHome = season => {
  const g = season.games;

  const tnums = season.team_numbers || {};
  document.getElementById('teams').innerHTML = season.teams.map(t=>`
    <div class="team"><div class="team__no">${esc(tnums[t] ?? '')}</div><div class="team__name">${esc(t)}</div></div>`).join('');

  const rows = standings(season.teams, g);
  const played = g.filter(x => x.home_score != null).length;
  const sub = document.getElementById('std-sub');
  if (sub) sub.textContent = played
    ? `${season.year} regular season · ${played} of ${g.length} games recorded`
    : `${season.year} regular season · no scores recorded yet`;
  document.getElementById('standings-body').innerHTML = rows.slice(0,5).map((x,i)=>`
    <tr><td>${x.gp?`<span class="rank">${i+1}</span>`:'<span class="dash">&ndash;</span>'}</td>
      <td class="team-name">${esc(x.team)}</td>
      <td class="num">${x.gp?x.w:'<span class="dash">&ndash;</span>'}</td>
      <td class="num">${x.gp?x.l:'<span class="dash">&ndash;</span>'}</td>
      <td class="num pct">${x.gp?x.pct.toFixed(3).replace(/^0/,''):'<span class="dash">&ndash;</span>'}</td></tr>`).join('');
  const today = new Date(); today.setHours(0,0,0,0);

  const days = new Map();
  g.forEach(x => { if(!days.has(x.date)) days.set(x.date, []); days.get(x.date).push(x); });
  const all = [...days.entries()].map(([date,games])=>({date, games, dt:toDate(date)}))
                                 .sort((a,b)=>a.dt-b.dt);

  const block = ({date,games,dt}, showVenue=true) => {
    const wd = dt.toLocaleDateString('en-CA',{weekday:'long'});
    const nice = dt.toLocaleDateString('en-CA',{month:'long',day:'numeric'});
    const rows = games.map(x=>{
      const has = x.away_score != null && x.home_score != null;
      return `
        <li class="day__game">
          <div class="day__row">
            <div class="day__time">
              <span class="day__clock">${esc(x.time.toUpperCase())}</span>
              ${has ? `<span class="day__score">${x.away_score}&ndash;${x.home_score}</span>` : ''}
            </div>
            <div>
              <div class="day__match">${clean(x.away)}${has&&x.away_score>x.home_score?'<span class="win-badge">W</span>':''}<span class="vs">at</span>${clean(x.home)}${has&&x.home_score>x.away_score?'<span class="win-badge">W</span>':''}</div>
              ${showVenue ? `<div class="day__venue">${esc(x.venue)}</div>` : ''}
            </div>
          </div>
        </li>`; }).join('');
    return `<article class="day"><div class="day__head">
        <span class="day__date">${esc(wd)}, ${esc(nice)}</span>
        <span class="day__count">${games.length} game${games.length>1?'s':''}</span></div>
      <ul class="day__games">${rows}</ul></article>`;
  };

  const upcoming = all.filter(d=>d.dt>=today).slice(0,3);

  document.getElementById('days-upcoming').innerHTML = upcoming.map(block).join('');
  seasonMeta().then(m => {
    const sub = document.getElementById('up-sub');
    if (upcoming.length) { sub.textContent = `${m.latest} Sunday Co-Ed season`; }
    else {
      sub.textContent = `${m.current} season — schedule to be announced`;
      document.getElementById('days-upcoming').innerHTML =
        `<div class="empty"><strong>The ${m.latest} season has finished</strong>
          The ${m.current} schedule will be posted here. <a href="seasons.html">Browse past seasons</a></div>`;
    }
  });

};

const navEl = document.querySelector('.nav');
const onScroll = () => navEl.classList.toggle('nav--compact', window.scrollY > 40);
onScroll();
addEventListener('scroll', onScroll, {passive:true});

const hs = document.getElementById('home-sub');
const hn = document.getElementById('home-sub-note');
hs.addEventListener('submit', async e => {
  e.preventDefault();
  const cfg = await config();
  if (!cfg.subscribe_endpoint) {
    hn.textContent = 'Sign-up is not connected yet.'; hn.className = 'form__note form__note--err'; return;
  }
  const btn = hs.querySelector('button');
  btn.disabled = true; hn.className = 'form__note'; hn.textContent = 'Signing you up…';
  try {
    await fetch(cfg.subscribe_endpoint, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ email: hs.elements.email.value.trim(),
                             hp: hs.elements.hp.value.trim(),
                             consent: hs.elements.consent.checked, source: 'homepage' })
    });
    hs.reset();
    hn.textContent = "You're on the list. See you Sunday.";
    hn.className = 'form__note form__note--ok';
  } catch (err) {
    hn.textContent = 'Something went wrong. Please try again.';
    hn.className = 'form__note form__note--err';
  } finally { btn.disabled = false; }
});

const paintHome = d => {
  renderHome(d);
  const bar = document.getElementById('scorebar');
  if (bar) bar.innerHTML = scoreStrip(d);
};
loadSeason(null, paintHome).then(paintHome);
sponsorRow().then(html => {
  const row = document.getElementById('sponsor-row');
  if (row) row.innerHTML = html;
});
