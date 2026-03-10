/* glyph-database front-end */

;(async () => {
  const res = await fetch(`data/glyphs.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    console.error('glyphs.json load-error', res.status);
    return;
  }

  const glyphs = await res.json();

  const body = document.body;
  const mobileToggle = document.getElementById('mobileHeaderToggle');
  const levelFilter = document.getElementById('levelFilter');
  const upToToggle = document.getElementById('tierUpTo');
  const includeCantripsToggle = document.getElementById('includeCantrips');
  const includeCantripsLabel = document.getElementById('includeCantripsLabel');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput = document.getElementById('search');
  const searchToggle = document.getElementById('searchTextToggle');
  const container = document.getElementById('cardsContainer');
  const mobileQuery = window.matchMedia('(max-width: 767px)');

  for (let i = 0; i <= 12; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Tier ${i}`;
    levelFilter.appendChild(option);
  }
  levelFilter.value = 'all';

  const schools = ['Harmony', 'Elemental', 'Nature', 'Celestial', 'Mind', 'Arcane', 'Chaos', 'Bane'];
  const schoolButtons = {};

  schools.forEach(school => {
    const button = document.createElement('button');
    button.className = `school-button school-${school.toLowerCase()}`;
    button.textContent = school;
    button.onclick = () => {
      button.classList.toggle('active');
      render();
    };
    schoolFilters.appendChild(button);
    schoolButtons[school] = button;
  });

  const get = (obj, wanted) => {
    const wantedKey = wanted.toLowerCase().trim();
    const foundKey = Object.keys(obj).find(key => key.toLowerCase().trim() === wantedKey);
    return foundKey ? obj[foundKey] : undefined;
  };

  function setMobileMenu(open) {
    const isMobile = mobileQuery.matches;
    const isOpen = isMobile && open;

    body.classList.toggle('mobile-menu-open', isOpen);
    body.classList.toggle('mobile-menu-closed', isMobile && !isOpen);
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
  }

  function syncTierOptions() {
    const enabled = upToToggle.checked && levelFilter.value !== 'all';
    includeCantripsToggle.disabled = !enabled;
    includeCantripsLabel.classList.toggle('is-disabled', !enabled);

    if (!enabled) {
      includeCantripsToggle.checked = false;
    }
  }

  function renderCard(glyph) {
    const name = get(glyph, 'Name') ?? '';
    const school = get(glyph, 'School') ?? '';
    const tier = +get(glyph, 'Tier') || 0;
    const mana = get(glyph, 'Points') || 0;

    const card = document.createElement('div');
    card.className = 'card';

    const head = document.createElement('div');
    head.className = 'card-header';

    const info = document.createElement('div');
    info.className = `info school-${school.toLowerCase()}`;
    info.innerHTML = `<b>${name}</b>`;

    const vs = get(glyph, 'V') ? 'V' : get(glyph, 'S') ? 'S' : '';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `${school}<span class="vs">${vs}</span> • Tier ${tier} • ${mana} Mana`;

    head.append(info, meta);
    card.appendChild(head);

    const body = document.createElement('div');
    body.className = 'card-body';
    body.style.display = 'none';
    body.innerHTML = `
      <p>Casting Time: ${get(glyph, 'Casting Time')}</p>
      <p>Range: ${get(glyph, 'Range')}</p>
      <p>Duration: ${get(glyph, 'Duration')}${get(glyph, 'Concentration') ? ' (Concentration)' : ''}</p>
      <p>${get(glyph, 'New Text')}</p><hr><p>${get(glyph, 'Higher Tiers')}</p>`;

    head.onclick = () => {
      const isOpen = body.style.display === 'block';
      body.style.display = isOpen ? 'none' : 'block';
      card.classList.toggle('open', !isOpen);
    };

    card.appendChild(body);
    container.appendChild(card);
  }

  function render() {
    const tierSel = levelFilter.value;
    const tierNum = +tierSel;
    const upTo = upToToggle.checked;
    const includeCantrips = includeCantripsToggle.checked;
    const activeSchools = Object.entries(schoolButtons)
      .filter(([, button]) => button.classList.contains('active'))
      .map(([school]) => school);
    const query = searchInput.value.trim().toLowerCase();
    const deepSearch = searchToggle.checked;

    container.innerHTML = '';

    glyphs
      .filter(glyph => {
        const tier = +get(glyph, 'Tier') || 0;
        const school = get(glyph, 'School') || '';

        if (tierSel !== 'all' && (upTo ? tier > tierNum : tier !== tierNum)) {
          return false;
        }

        if (tierSel !== 'all' && upTo && !includeCantrips && tier === 0) {
          return false;
        }

        if (activeSchools.length && !activeSchools.includes(school)) {
          return false;
        }

        if (query) {
          const name = (get(glyph, 'Name') || '').toLowerCase();
          if (name.includes(query)) {
            return true;
          }

          if (deepSearch && Object.values(glyph).some(value => String(value).toLowerCase().includes(query))) {
            return true;
          }

          return false;
        }

        return true;
      })
      .forEach(renderCard);
  }

  [includeCantripsToggle, searchInput, searchToggle].forEach(element => {
    element.oninput = render;
  });

  levelFilter.oninput = () => {
    syncTierOptions();
    render();
  };

  upToToggle.oninput = () => {
    syncTierOptions();
    render();
  };

  mobileToggle.onclick = () => {
    setMobileMenu(!body.classList.contains('mobile-menu-open'));
  };

  mobileQuery.addEventListener('change', event => {
    setMobileMenu(event.matches ? body.classList.contains('mobile-menu-open') : false);
  });

  setMobileMenu(false);
  syncTierOptions();
  render();
})();
