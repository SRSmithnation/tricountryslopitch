fetch('data/seasons.json').then(r=>r.json()).then(l=>{
  const latest=Math.max(...l.map(s=>s.year));
  return fetch(`data/seasons/${latest}.json`).then(r=>r.json());
}).then(d=>{
  document.getElementById('f-teams').textContent=d.teams.length;
  document.getElementById('f-games').textContent=d.games.length;
  const days=[...new Set(d.games.map(g=>g.iso))].sort();
  document.getElementById('f-days').textContent=days.length;
  const mon=i=>new Date(i+'T00:00').toLocaleDateString('en-CA',{month:'short'});
  document.getElementById('f-span').textContent=days.length?`${mon(days[0])}–${mon(days[days.length-1])}`:'–';
}).catch(()=>{});
