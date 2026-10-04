window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

const directions = a => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(a);

Promise.all([
  loadSeason(),
  fetch('data/venues.json').then(r => r.json()).catch(() => ({}))
]).then(([season, places]) => {
  const find = v => Object.values(places)
    .find(p => (p.match || []).some(m => v.toLowerCase().includes(m.toLowerCase())));
  const counts = {};
  season.games.forEach(g => counts[g.venue] = (counts[g.venue]||0)+1);
  const list = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  document.getElementById('sub').textContent =
    `${season.year} season · ${list.length} diamond${list.length===1?'':'s'} in use`;
  document.getElementById('current-venues').innerHTML = list.map(([v,n]) => {
    const p = find(v);
    const where = p && p.address ? p.address : 'Kitchener, ON';
    const link = p && p.address
      ? `<a href="${directions(p.address)}" target="_blank" rel="noopener">Directions &rarr;</a>`
      : '';
    return `<article class="teamcard">
      <div class="teamcard__top"><span class="teamcard__name">${esc(v)}</span></div>
      <div class="teamcard__stats"><div><b>${n}</b>Games</div></div>
      <div class="teamcard__foot"><span class="venue__addr">${esc(where)}</span>${link}</div>
    </article>`;
  }).join('');
});
