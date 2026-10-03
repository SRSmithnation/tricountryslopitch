window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

const maps = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ', Kitchener Waterloo, Ontario');

loadSeason().then(season => {
  const counts = {};
  season.games.forEach(g => counts[g.venue] = (counts[g.venue]||0)+1);
  const list = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  document.getElementById('sub').textContent =
    `${season.year} season · ${list.length} diamond${list.length===1?'':'s'} in use`;
  document.getElementById('current-venues').innerHTML = list.map(([v,n])=>`
    <article class="teamcard">
      <div class="teamcard__top"><span class="teamcard__name">${esc(v)}</span></div>
      <div class="teamcard__stats"><div><b>${n}</b>Games</div></div>
      <div class="teamcard__foot">Kitchener, ON
        <a href="${maps(v)}" target="_blank" rel="noopener">Directions &rarr;</a></div>
    </article>`).join('');
});
