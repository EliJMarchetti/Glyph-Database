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
  const tierUpToToggle = document.getElementById('tierUpTo');       // NEW
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  // 2) Populate Tier dropdown
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
    btn.type      = 'button';
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
    // TIER FILTER: exact vs up-to
    const tierNum = +levelVal;
    // active schools
    let activeSchools = schools.filter(s => schoolBtns[s].classList.contains('active'));
    if (activeSchools.length === 0) activeSchools = [...schools];

    const q         = searchInput.value.toLowerCase();
    const inDetails = searchToggle.checked;

    container.innerHTML = '';
    glyphs
      .filter(g => {
        // tier logic
        if (levelVal !== 'all') {
          if (tierUpToToggle.checked) {
            // up-to mode
            if (+g.Tier > tierNum) return false;
          } else {
            // exact mode
            if (+g.Tier !== tierNum) return false;
          }
        }
        // school filter
        if (!activeSchools.includes(g.School)) return false;
        // text search
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
        // build each card…
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
        header.append(info, meta);
        card.appendChild(header);

        // body
        const body = document.createElement('div');
        body.className = 'card-body';
        body.style.display = 'none';
        ['Casting Time','Duration','New Text','Higher Tiers'].forEach((key, i) => {
          const el = document.createElement(i<2?'p':'p');
          el.textContent = i===0
            ? `Casting Time: ${g['Casting Time']}`
            : i===1
              ? `Duration: ${g.Duration}${g.Concentration? ' (Concentration)':''}`
              : i===2
                ? g['New Text']
                : g['Higher Tiers'];
          body.appendChild(el);
          if (i===2) body.appendChild(document.createElement('hr'));
        });
        header.addEventListener('click', () => {
          const open = body.style.display==='block';
          body.style.display = open? 'none':'block';
          card.classList.toggle('open', !open);
        });
        card.appendChild(body);

        container.appendChild(card);
      });
  }

  // 5) Wire up controls
  levelFilter.addEventListener('change', render);
  tierUpToToggle.addEventListener('change', render);     // NEW
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);

  // 6) Initial draw
  render();

  // 7) Mobile-only: header toggle…
  if (window.innerWidth < 768) {
    const headerEl = document.querySelector('header');
    const toggle   = document.getElementById('mobileHeaderToggle');
    document.body.classList.remove('collapsed');
    function setOffset() {
      container.style.marginTop = headerEl.offsetHeight + 'px';
    }
    setOffset(); window.addEventListener('resize', setOffset);

    toggle.addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▲' : '▼';
      container.style.marginTop = collapsed ? '0' : headerEl.offsetHeight + 'px';
    });
  }
})();
