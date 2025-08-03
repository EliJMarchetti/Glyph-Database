// assets/js/script.js

;(async () => {
  // —— FORCE A FRESH JSON FETCH ——
  const jsonUrl = `data/glyphs.json?ts=${Date.now()}`;
  const res     = await fetch(jsonUrl, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`Failed to load ${jsonUrl}:`, res.status);
    return;
  }
  const glyphs = await res.json();

  // 1) Grab controls & container
  const levelFilter   = document.getElementById('levelFilter');
  const tierUpToToggle = document.getElementById('tierUpTo');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  // 2) Populate Tier dropdown (we already have one “All Glyphs” option)
  for (let i = 0; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Tier ${i}`;
    levelFilter.appendChild(opt);
  }
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
    const levelVal   = levelFilter.value;
    const tierNum    = +levelVal;
    let activeSchools = schools.filter(s => schoolBtns[s].classList.contains('active'));
    if (activeSchools.length === 0) activeSchools = schools.slice();

    const q         = searchInput.value.toLowerCase();
    const inDetails = searchToggle.checked;

    container.innerHTML = '';
    glyphs
      .filter(g => {
        // — tier logic: exact vs up-to —
        if (levelVal !== 'all') {
          if (tierUpToToggle.checked) {
            if (+g.Tier > tierNum) return false;
          } else {
            if (+g.Tier !== tierNum) return false;
          }
        }
        // — school filter —
        if (!activeSchools.includes(g.School)) return false;

        // — text search —
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

        // header with Name + meta
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

        header.append(info, meta);
        card.appendChild(header);

        // body with Casting Time, Range, Duration, Text, Higher Tiers
        const body = document.createElement('div');
        body.className = 'card-body';
        body.style.display = 'none';

        const ct    = document.createElement('p');
        ct.textContent = `Casting Time: ${g['Casting Time']}`;
        const range = document.createElement('p');
        range.textContent = `Range: ${g.Range}`;
        const dur   = document.createElement('p');
        dur.textContent = `Duration: ${g.Duration}` +
                          (g.Concentration ? ' (Concentration)' : '');
        const txt   = document.createElement('p');
        txt.textContent = g['New Text'];
        const hr    = document.createElement('hr');
        const high  = document.createElement('p');
        high.textContent = g['Higher Tiers'];

        body.append(ct, range, dur, txt, hr, high);
        card.appendChild(body);

        // toggle open/close
        header.addEventListener('click', () => {
          const isOpen = body.style.display === 'block';
          body.style.display = isOpen ? 'none' : 'block';
          card.classList.toggle('open', !isOpen);
        });

        container.appendChild(card);
      });
  }

  // 5) Wire up controls (now including tierUpToToggle)
  levelFilter.addEventListener('change', render);
  tierUpToToggle.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);

  // 6) Initial draw
  render();

  // 7) Mobile-only: manual header dropdown
  if (window.innerWidth < 768) {
    const headerEl = document.querySelector('header');
    const toggle   = document.getElementById('mobileHeaderToggle');

    // start un-collapsed
    document.body.classList.remove('collapsed');
    // keep cards pushed below header
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
