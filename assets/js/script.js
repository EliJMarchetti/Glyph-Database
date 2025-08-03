/*  FULL FILE  – replace everything  */

;(async () => {
  /* always fetch a fresh JSON – never cached */
  const jsonUrl = `data/glyphs.json?ts=${Date.now()}`;
  const res     = await fetch(jsonUrl, { cache: 'no-store' });
  if (!res.ok) { console.error('Failed to load glyphs.json', res.status); return; }
  const glyphs = await res.json();

  /* controls & container */
  const levelFilter    = document.getElementById('levelFilter');
  const upToToggle     = document.getElementById('tierUpTo');
  const schoolFilters  = document.getElementById('schoolFilters');
  const searchInput    = document.getElementById('search');
  const searchToggle   = document.getElementById('searchTextToggle');
  const container      = document.getElementById('cardsContainer');

  /* populate Tier dropdown */
  for (let i = 0; i <= 12; i++) {
    const o = document.createElement('option');
    o.value = i;  o.textContent = `Tier ${i}`;
    levelFilter.appendChild(o);
  }
  levelFilter.value = 'all';

  /* school buttons */
  const schools = ['Harmony','Elemental','Celestial','Nature',
                   'Arcane','Mind','Chaos','Bane'];
  const schoolBtns = {};
  schools.forEach(s => {
    const b = document.createElement('button');
    b.className = 'school-button';
    b.textContent = s;
    b.onclick = () => { b.classList.toggle('active'); render(); };
    schoolFilters.appendChild(b);
    schoolBtns[s] = b;
  });

  /* ---------- RENDER ---------- */
  function render () {
    const tierSel   = levelFilter.value;
    const tierNum   = +tierSel;
    const upTo      = upToToggle.checked;

    const activeSchools =
      Object.entries(schoolBtns).filter(([_,b])=>b.classList.contains('active'))
                                .map(([s])=>s);

    const q         = searchInput.value.trim().toLowerCase();
    const deep      = searchToggle.checked;

    container.innerHTML = '';

    glyphs
      .filter(g => {
        /* keys may be lower-case – normalise once */
        const name   = g.Name   ?? g.name   ?? '';
        const school = g.School ?? g.school ?? '';
        const tier   = +g.Tier  ?? +g.tier  ?? 0;

        if (tierSel !== 'all') {
          if (upTo ? tier > tierNum : tier !== tierNum) return false;
        }
        if (activeSchools.length && !activeSchools.includes(school)) return false;
        if (q) {
          if (name.toLowerCase().includes(q)) return true;
          if (deep && Object.values(g).some(v=>String(v).toLowerCase().includes(q))) return true;
          return false;
        }
        return true;
      })
      .forEach(buildCard);
  }

  /* build one card */
  function buildCard (g) {
    const name   = g.Name   ?? g.name;
    const school = g.School ?? g.school;
    const tier   = g.Tier   ?? g.tier;
    const mana   = g.Points ?? g.points;

    const card   = document.createElement('div');
    card.className = 'card';

    /* header */
    const header = document.createElement('div');
    header.className = 'card-header';

    const info   = document.createElement('div');
    info.className = `info school-${school.toLowerCase()}`;
    info.innerHTML = `<b>${name}</b>`;

    const vsLabel = g.V ? 'V' : g.S ? 'S' : '';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      ${school}
      <span class="vs">${vsLabel}</span>
      • Tier ${tier}
      • ${mana} Mana
    `;

    header.append(info, meta);
    card.appendChild(header);

    /* body */
    const body = document.createElement('div');
    body.className = 'card-body';
    body.style.display = 'none';
    body.innerHTML = `
      <p>Casting Time: ${g['Casting Time'] ?? g.castingtime}</p>
      <p>Range: ${g.Range ?? g.range}</p>
      <p>Duration: ${g.Duration ?? g.duration}${g.Concentration ? ' (Concentration)' : ''}</p>
      <p>${g['New Text'] ?? g.text}</p>
      <hr>
      <p>${g['Higher Tiers'] ?? g.highertiers}</p>
    `;
    header.onclick = () => {
      const open = body.style.display === 'block';
      body.style.display = open ? 'none' : 'block';
      card.classList.toggle('open', !open);
    };

    card.appendChild(body);
    container.appendChild(card);
  }

  /* events */
  [levelFilter, upToToggle, searchInput, searchToggle]
    .forEach(el => el.addEventListener('input', render));

  render();
})();
