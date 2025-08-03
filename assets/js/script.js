/* assets/js/script.js
   (full file – copy / overwrite) */

;(async () => {
  /* 0 ) always fetch fresh JSON – never cached */
  const jsonUrl = `data/glyphs.json?ts=${Date.now()}`;
  const res     = await fetch(jsonUrl, { cache: 'no-store' });
  if (!res.ok) { console.error('Failed to load glyphs.json', res.status); return; }
  const glyphs = await res.json();

  /* 1 ) controls & container */
  const levelFilter     = document.getElementById('levelFilter');
  const tierUpToToggle  = document.getElementById('tierUpTo');
  const schoolFilters   = document.getElementById('schoolFilters');
  const searchInput     = document.getElementById('search');
  const searchToggle    = document.getElementById('searchTextToggle');
  const container       = document.getElementById('cardsContainer');

  /* 2 ) tier dropdown */
  for (let i = 0; i <= 12; i++) {
    const o = document.createElement('option');
    o.value = i;  o.textContent = `Tier ${i}`;
    levelFilter.appendChild(o);
  }
  levelFilter.value = 'all';

  /* 3 ) school buttons */
  const schools = ['Harmony','Elemental','Celestial','Nature',
                   'Arcane','Mind','Chaos','Bane'];
  const schoolBtns = {};
  schools.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'school-button';
    btn.textContent = s;
    btn.addEventListener('click', () => { btn.classList.toggle('active'); render(); });
    schoolFilters.appendChild(btn);
    schoolBtns[s] = btn;
  });

  /* 4 ) RENDER */
  function render () {
    const tierSel     = levelFilter.value;
    const tierNum     = +tierSel;
    const upTo        = tierUpToToggle.checked;
    const activeSch   = Object.entries(schoolBtns)
                              .filter(([_,b]) => b.classList.contains('active'))
                              .map(([s]) => s);
    const q           = searchInput.value.trim().toLowerCase();
    const searchBody  = searchToggle.checked;

    container.innerHTML = '';

    glyphs
      .filter(g => {
        /* --- normalise keys coming from JSON ---------------- */
        const name   = g.Name  ?? g.name  ?? '';
        const school = g.School?? g.school?? '';
        const tier   = +g.Tier ?? +g.tier ?? 0;

        /* tier filter */
        if (tierSel !== 'all') {
          if (upTo ? tier > tierNum : tier !== tierNum) return false;
        }
        /* school filter */
        if (activeSch.length && !activeSch.includes(school)) return false;
        /* text search */
        if (q) {
          if (name.toLowerCase().includes(q)) return true;
          if (searchBody &&
              Object.values(g).some(v => String(v).toLowerCase().includes(q))) return true;
          return false;
        }
        return true;
      })
      .forEach(g => buildCard(g));
  }

  /* helper: build one card */
  function buildCard (g) {
    const name   = g.Name   ?? g.name   ?? '???';
    const school = g.School ?? g.school ?? 'Unknown';
    const tier   = g.Tier   ?? g.tier   ?? '?';

    const card   = document.createElement('div');
    card.className = 'card';

    /* ---------- header ---------- */
    const header = document.createElement('div');
    header.className = 'card-header';

    const info   = document.createElement('div');
    const schoolKey = school.toLowerCase().replace(/\s+/g,'-');
    info.className  = `info school-${schoolKey}`;
    info.innerHTML  = `<b>${name}</b>`;

    const vsLabel = g.V ? 'V' : g.S ? 'S' : '';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      ${school}
      <span class="vs">${vsLabel}</span>
      • Tier ${tier}
      • ${g.Points ?? g.points ?? '?'} Mana
    `;
    header.append(info, meta);
    card.appendChild(header);

    /* ---------- body ---------- */
    const body = document.createElement('div');
    body.className = 'card-body';
    body.style.display = 'none';
    body.innerHTML = `
      <p>Casting Time: ${g['Casting Time'] ?? g.castingtime ?? '?'}</p>
      <p>Range: ${g.Range ?? g.range ?? '?'}</p>
      <p>Duration: ${g.Duration ?? g.duration ?? '?'}${g.Concentration ? ' (Concentration)' : ''}</p>
      <p>${g['New Text'] ?? g.text ?? ''}</p>
      <hr>
      <p>${g['Higher Tiers'] ?? g.highertiers ?? ''}</p>
    `;
    header.addEventListener('click', () => {
      const open = body.style.display === 'block';
      body.style.display = open ? 'none' : 'block';
      card.classList.toggle('open', !open);
    });

    card.appendChild(body);
    container.appendChild(card);
  }

  /* 5 ) wire up controls */
  [levelFilter, tierUpToToggle, searchInput, searchToggle]
    .forEach(el => el.addEventListener('input', render));

  render();
})();
