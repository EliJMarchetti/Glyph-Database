(async () => {
  // 1) Load the glyph data
  const res    = await fetch('data/glyphs.json');
  const glyphs = await res.json();

  // 2) Grab our controls & container
  const levelFilter   = document.getElementById('levelFilter');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  // 3) Populate level dropdown with "All Glyphs" + "Tier X"
  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All Glyphs';
  levelFilter.appendChild(allOpt);
  for (let i = 0; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Tier ${i}`;
    levelFilter.appendChild(opt);
  }

  // 4) Build the school filter buttons (toggle-style)
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

  // 5) The render function: filter & draw cards
  function render() {
    const levelVal = levelFilter.value;

    // which schools are active?
    let activeSchools = schools.filter(s => schoolBtns[s].classList.contains('active'));
    if (activeSchools.length === 0) {
      activeSchools = [...schools]; // none active → all
    }

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
        // build each card
        const card = document.createElement('div');
        card.className = 'card';

        // card header
        const header = document.createElement('div');
        header.className = 'card-header';

        // info (Name)
        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `<b>${g.Name}</b>`;

        // meta (School, V/S, Tier, Mana)
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

        // card body (collapsed by default)
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
        card.appendChild(body);

        // toggle open/close on header click
        header.addEventListener('click', () => {
          const isOpen = body.style.display === 'block';
          body.style.display = isOpen ? 'none' : 'block';
          card.classList.toggle('open', !isOpen);
        });

        container.appendChild(card);
      });
  }

  // 6) Wire up filters & controls to re-render
  levelFilter.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);
  Object.values(schoolBtns).forEach(btn => btn.addEventListener('click', render));

  // 7) Initial draw
  render();

  // 8) Mobile-only: hide/show filter row on scroll
  if (window.innerWidth < 768) {
    const filterRow = document.getElementById('schoolFilters');
    let lastScroll  = container.scrollTop;
    container.addEventListener('scroll', () => {
      const st = container.scrollTop;
      filterRow.style.transform = st > lastScroll ? 'translateY(-100%)' : 'translateY(0)';
      lastScroll = st;
    });
  }
})();
