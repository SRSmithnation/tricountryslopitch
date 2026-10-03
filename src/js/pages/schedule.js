window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

let SEASON = null, CFG = {};
config().then(c=>{ CFG=c; if(c.score_form) document.getElementById('report-link').href=c.score_form; });
const render = () => {
  const pick = document.getElementById('team-filter').value;
  const games = SEASON.games.filter(g => !pick || g.home === pick || g.away === pick);
  const days = byDay(games);
  document.getElementById('days').innerHTML = days.length ? days.map(({games:gs, dt}) => `
    <article class="day">
      <div class="day__head">
        <span class="day__date">${esc(fmtDay(dt))}, ${esc(fmtDate(dt))}</span>
        <span class="day__count">${gs.length} game${gs.length>1?'s':''}</span>
      </div>
      <ul class="day__games">${gs.map(g => {
        const has = g.home_score != null && g.away_score != null;
        const tag = has ? 'div' : 'a';
        const useModal = !has && CFG && CFG.score_endpoint;
        const attrs = has ? ''
          : useModal ? ` href="#" data-report="${esc(String(g.id))}" title="Report the score for game ${g.id}"`
          : ` href="${reportUrl(CFG, g)}" target="_blank" rel="noopener" title="Report the score for game ${g.id}"`;
        return `<li class="day__game${has ? '' : ' day__game--report'}">
          <${tag} class="day__row"${attrs}>
            <div class="day__time">
              <span class="gid" title="Game ID">#${g.id}</span>
              <span class="day__clock">${esc((g.time||'').toUpperCase())}</span>
              ${has ? `<span class="day__score"${verifyTitle(g)}>${g.away_score}&ndash;${g.home_score}</span>` : ''}
            </div>
            <div>
              <div class="day__match">${stripNo(g.away)}${has&&g.away_score>g.home_score?'<span class="win-badge">W</span>':''}<span class="vs">at</span>${stripNo(g.home)}${has&&g.home_score>g.away_score?'<span class="win-badge">W</span>':''}</div>
              <div class="day__venue">${[esc(g.venue||''), verifyBadge(g)].filter(Boolean).join(' &middot; ')}</div>
            </div>
          </${tag}></li>`; }).join('')}</ul>
    </article>`).join('') : `<div class="empty"><strong>No games</strong>Nothing scheduled for that selection.</div>`;
  document.getElementById('sub').textContent =
    `${SEASON.year} ${SEASON.division} · ${games.length} game${games.length===1?'':'s'} · ${days.length} game day${days.length===1?'':'s'}`;
};
loadSeason().then(d=>{
    SEASON = d;
    document.getElementById('team-filter').insertAdjacentHTML('beforeend',
      d.teams.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join(''));
    document.getElementById('team-filter').addEventListener('change', render);
    render();
  });

document.addEventListener('click', e => {
  const link = e.target.closest('[data-report]');
  if (!link) return;
  e.preventDefault();
  const id = link.getAttribute('data-report');
  const game = SEASON && SEASON.games.find(g => String(g.id) === id);
  if (game) openScoreModal(game, CFG, link);
});
