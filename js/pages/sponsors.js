window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

fetch('data/sponsors.json').then(r=>r.json()).then(d=>{
  if (d.status === 'unconfirmed') {
    const n = document.getElementById('notice');
    n.hidden = false;
    n.innerHTML = '<strong>This list is being rebuilt.</strong> These businesses supported the league ' +
      'through its previous website. We are confirming who is continuing for the coming season.';
  }
  const initials = n => esc(String(n).replace(/[^A-Za-z0-9 ]/g,'').split(/\s+/)
                        .filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join(''));
  const card = s => {
    const inner = `
      <div class="sponsor__logo">${s.logo
        ? `<img src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy">`
        : `<span class="sponsor__mono">${initials(s.name)}</span>`}</div>
      <div class="sponsor__body">
        <b>${esc(s.name)}</b>
        <span>${esc(s.what || '')}</span>
        ${s.team ? `<span class="sponsor__team">Sponsors ${esc(s.team)}</span>` : ''}
        <span class="sponsor__meta">${[esc(s.where||''), esc(s.phone||'')].filter(Boolean).join(' &middot; ')}</span>
      </div>`;
    return s.url
      ? `<a class="sponsor" href="${esc(s.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="sponsor">${inner}</div>`;
  };
  const put = (id, list) => {
    const el = document.getElementById(id);
    el.innerHTML = (list && list.length)
      ? list.map(card).join('')
      : '<div class="empty"><strong>No sponsors listed yet</strong>Could your business be the first?</div>';
  };
  put('league', d.league);
  put('team', d.team);
});

/* Sponsors render in one of two shapes:
   - banner  : wide artwork (roughly 2:1 or wider), shown full width
   - logo    : squarish mark, shown in a tile beside the name
   Nothing renders when there are no sponsors, so the page stays clean. */
fetch('data/sponsors.json').then(r => r.json()).then(d => {
  const league = d.league || [], team = d.team || [];
  if (!league.length && !team.length) return;

  const banner = s => {
    const img = `<img src="${esc(s.banner)}" alt="${esc(s.name)}" loading="lazy">`;
    return `<div class="sbanner">${s.url
      ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${img}</a>` : img}
      <span class="sbanner__cap">${esc(s.name)}${s.where ? ' &middot; ' + esc(s.where) : ''}</span>
    </div>`;
  };
  const initials = n => esc(String(n).replace(/[^A-Za-z0-9 ]/g,'').split(/\s+/)
                      .filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join(''));
  const tile = s => {
    const inner = `
      <div class="sponsor__logo">${s.logo
        ? `<img src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy">`
        : `<span class="sponsor__mono">${initials(s.name)}</span>`}</div>
      <div class="sponsor__body">
        <b>${esc(s.name)}</b>
        <span>${esc(s.what || '')}</span>
        ${s.team ? `<span class="sponsor__team">Sponsors ${esc(s.team)}</span>` : ''}
      </div>`;
    return s.url ? `<a class="sponsor" href="${esc(s.url)}" target="_blank" rel="noopener">${inner}</a>`
                 : `<div class="sponsor">${inner}</div>`;
  };

  const section = (title, list) => {
    if (!list.length) return '';
    const banners = list.filter(s => s.banner).map(banner).join('');
    const tiles   = list.filter(s => !s.banner);
    return `<h3 class="subhead">${esc(title)}</h3>${banners}` +
           (tiles.length ? `<div class="sponsors">${tiles.map(tile).join('')}</div>` : '');
  };

  document.getElementById('sponsor-live').innerHTML =
    section('League sponsors', league) + section('Team sponsors', team);
});
