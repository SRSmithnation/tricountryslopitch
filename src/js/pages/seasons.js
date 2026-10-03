window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

fetch('data/seasons.json').then(r=>r.json()).then(list=>{
  const partial = list.filter(s=>!s.complete).length;
  document.getElementById('notice').innerHTML =
    `<strong>Records are incomplete.</strong> ${partial} of ${list.length} seasons are missing games or scores. `+
    `The league's previous website was shut down and only some data could be recovered.`;
  document.getElementById('seasons').innerHTML = list.map(s=>`
    <a class="season" href="season.html?y=${s.year}">
      <div class="season__yr">${s.year}</div>
      <div class="season__div">${esc(s.division)}</div>
      <div class="season__facts">
        <div><b>${s.teams}</b>Teams</div>
        <div><b>${s.games}</b>Games</div>
        <div><b>${s.with_scores}</b>Scores</div>
      </div>
      ${s.complete?'':'<span class="flag">Partial record</span>'}
    </a>`).join('');
});
