// assets/js/script.js

(async () => {
  // —— FORCE A FRESH JSON FETCH ——
  // give the URL a changing query-string so the browser (and GitHub Pages CDN) can’t cache it
  const jsonUrl = `data/glyphs.json?ts=${Date.now()}`;
  const res     = await fetch(jsonUrl, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`Failed to load ${jsonUrl}:`, res.status);
    return;
  }
  const glyphs = await res.json();

  // 1) Grab controls & container
  const levelFilter   = document.getElementById('levelFilter');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  // 2) Populate Tier dropdown
  //    (we already have one <option value="all"> in HTML)
  for (let i = 0; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Tier ${i}`;
    levelFilter.appendChild(opt);
  }
  // ensure it’s reset on load
  levelFilter.value = 'all';

  // 3) Build school filter buttons
  const schools = ['Harmony','Elemental','Celestial','Nature','Arcane','Mind','Chaos','Bane'];
  const schoolBtns = {};
  schools.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'school-button';
    btn.textContent = s;
    schoolFilters.appendChild(btn);
    schoolBtns[s] = btn;
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      render();
    });
  });

  // 4) Render function
  function render() {
    const levelVal = levelFilter.value;
    let activeSchools = schools.filter(s => schoolBtns[s].classList.contains('active'));
    if (activeSchools.length === 0) activeSchools = [...schools];

    const q         = searchInput.value.toLowerCase();
    const inDetails = searchToggle.checked;

    container.innerHTML = '';
    glyphs
      .filter(g => {
        if (levelVal !== 'all' && +g.Tier !== +levelVal) return false;
        if (!activeSchools.includes(g.School))             return false;
        if (q) {
          if (g.Name.toLowerCase().includes(q)) return true;
          if (inDetails && Object.values(g).some(v =>
            String(v).toLowerCase().includes(q)
          )) return true;
          return false;
        }
        return true;
      })
      .forEach(g => {
        // build card
        const card = document.createElement('div');
        card.className = 'card';

        // header
        const header = document.createElement('div');
        header.className = 'card-header';

        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `<b>${g.Name}</b>`;

        const vsLabel = g.V ? 'V' : g.S ? 'S' : '';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `
          ${g.School}
          <span class="vs">${vsLabel}</span>
          • Tier ${g.Tier}
          • ${g.Points} Mana
        `;

        header.appendChild(info);
        header.appendChild(meta);
        card.appendChild(header);

        // body
        const body = document.createElement('div');
        body.className = 'card-body';
        body.style.display = 'none';
        const ct   = document.createElement('p');
        ct.textContent = `Casting Time: ${g['Casting Time']}`;
        const dur  = document.createElement('p');
        dur.textContent = `Duration: ${g.Duration}${g.Concentration ? ' (Concentration)' : ''}`;
        const txt  = document.createElement('p');
        txt.textContent = g['New Text'];
        const hr   = document.createElement('hr');
        const high = document.createElement('p');
        high.textContent = g['Higher Tiers'];
        body.append(ct, dur, txt, hr, high);

        header.addEventListener('click', () => {
          const isOpen = body.style.display === 'block';
          body.style.display = isOpen ? 'none' : 'block';
          card.classList.toggle('open', !isOpen);
        });

        card.appendChild(body);
        container.appendChild(card);
      });
  }

  // 5) Wire up controls
  levelFilter.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);

  // 6) Initial draw
  render();

  // 7) Mobile-only: manual header dropdown
  if (window.innerWidth < 768) {
    const headerEl = document.querySelector('header');
    const toggle   = document.getElementById('mobileHeaderToggle');

    // no “collapsed” class on load
    document.body.classList.remove('collapsed');
    // push glyph list down by header height
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
