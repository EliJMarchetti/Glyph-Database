// assets/js/script.js

;(async () => {
  // 0) Fetch fresh JSON (no cache)
  const url   = `data/glyphs.json?ts=${Date.now()}`;
  const resp  = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) {
    console.error(`Failed to load ${url}:`, resp.status);
    return;
  }
  const glyphs = await resp.json();

  // 1) Controls & container
  const levelFilter   = document.getElementById('levelFilter');
  const tierUpToToggle = document.getElementById('tierUpTo');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  // 2) Populate Tier dropdown
  for (let i = 0; i <= 12; i++) {
    const o = document.createElement('option');
    o.value       = i;
    o.textContent = `Tier ${i}`;
    levelFilter.appendChild(o);
  }
  levelFilter.value = 'all';

  // 3) Build school buttons
  const schools = ['Harmony','Elemental','Celestial','Nature','Arcane','Mind','Chaos','Bane'];
  const schoolBtns = {};
  schools.forEach(s => {
    const btn = document.createElement('button');
    btn.type        = 'button';
    btn.className   = 'school-button';
    btn.textContent = s;
    schoolFilters.appendChild(btn);
    schoolBtns[s] = btn;
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      render();
    });
  });

  // 4) Render
  function render() {
    const lvl    = levelFilter.value;
    const numLvl = +lvl;
    let active   = schools.filter(s => schoolBtns[s].classList.contains('active'));
    if (active.length === 0) active = schools.slice();

    const q  = searchInput.value.toLowerCase();
    const det = searchToggle.checked;

    container.innerHTML = '';
    glyphs
      .filter(g => {
        // tier filter
        if (lvl !== 'all') {
          if (tierUpToToggle.checked) {
            if (+g.Tier > numLvl) return false;
          } else {
            if (+g.Tier !== numLvl) return false;
          }
        }
        // school filter
        if (!active.includes(g.School)) return false;
        // text search
        if (q) {
          const nameMatches = g.Name.toLowerCase().includes(q);
          const detailMatches = det && Object.values(g).some(v =>
            String(v).toLowerCase().includes(q)
          );
          return nameMatches || detailMatches;
        }
        return true;
      })
      .forEach(g => {
        // card
        const card = document.createElement('div');
        card.className = 'card';

        // header
        const hdr = document.createElement('div');
        hdr.className = 'card-header';
        const info = document.createElement('div');
        // normalize school name → lowercase, spaces → hyphens
        const schoolKey = g.School
        ? g.School.toLowerCase().replace(/\s+/g,'-')
        : 'unknown';
        info.className = `info school-${schoolKey}`;
        info.innerHTML = `<b>${g.Name}</b>`;
        info.classList.add(`school-${g.School.toLowerCase()}`);
        const vs = g.V ? 'V' : g.S ? 'S' : '';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `
          ${g.School}
          <span class="vs">${vs}</span>
          • Tier ${g.Tier}
          • ${g.Points} Mana
        `;
        hdr.append(info, meta);
        card.appendChild(hdr);

        // body
        const body = document.createElement('div');
        body.className = 'card-body';
        body.style.display = 'none';

        const pCT    = document.createElement('p');
        pCT.textContent = `Casting Time: ${g['Casting Time'] || '—'}`;
        const pRange = document.createElement('p');
        pRange.textContent = `Range: ${g.Range || '—'}`;
        const pDur   = document.createElement('p');
        pDur.textContent = `Duration: ${g.Duration || '—'}` +
                            (g.Concentration ? ' (Concentration)' : '');
        const pTxt   = document.createElement('p');
        pTxt.textContent = g['New Text'] || '';
        const hr     = document.createElement('hr');
        const pHigh  = document.createElement('p');
        pHigh.textContent = g['Higher Tiers'] || '';

        body.append(pCT, pRange, pDur, pTxt, hr, pHigh);
        card.appendChild(body);

        // toggle
        hdr.addEventListener('click', () => {
          const open = body.style.display === 'block';
          body.style.display = open ? 'none' : 'block';
          card.classList.toggle('open', !open);
        });

        container.appendChild(card);
      });
  }

  // 5) Wire up controls
  levelFilter.addEventListener('change', render);
  tierUpToToggle.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);

  // 6) First draw
  render();

  // 7) Mobile header toggle
  if (window.innerWidth < 768) {
    const headerEl = document.querySelector('header');
    const toggle   = document.getElementById('mobileHeaderToggle');
    document.body.classList.remove('collapsed');

    function setOffset() {
      container.style.marginTop = headerEl.offsetHeight + 'px';
    }
    setOffset();
    window.addEventListener('resize', setOffset);

    toggle.addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▲' : '▼';
      container.style.marginTop = collapsed ? '0' : headerEl.offsetHeight + 'px';
    });
  }
})();
