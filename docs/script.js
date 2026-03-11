/* glyph-database front-end */

;(async () => {
  const res = await fetch(`glyphs.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    console.error('glyphs.json load-error', res.status);
    return;
  }

  const glyphs = await res.json();

  const STATE_KEY = 'glyphDatabaseState.v2';
  const TOTAL_PAGES = 2;
  const SCHOOLS = ['Harmony', 'Elemental', 'Nature', 'Celestial', 'Mind', 'Arcane', 'Chaos', 'Bane'];
  const SCHOOL_COLORS = {
    Harmony: '#ffffff',
    Elemental: '#cc0000',
    Nature: '#00aa00',
    Celestial: '#4b0082',
    Mind: '#cccc00',
    Arcane: '#cc00cc',
    Chaos: '#00cccc',
    Bane: '#888888'
  };

  const body = document.body;
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const glyphMap = new Map();

  glyphs.forEach(glyph => {
    glyphMap.set(get(glyph, 'Name') ?? '', glyph);
  });

  const elements = {
    mobileToggle: document.getElementById('mobileHeaderToggle'),
    pageOneHeader: document.getElementById('pageOneHeader'),
    pageTwoHeader: document.getElementById('pageTwoHeader'),
    levelFilter: document.getElementById('levelFilter'),
    upToToggle: document.getElementById('tierUpTo'),
    includeCantripsToggle: document.getElementById('includeCantrips'),
    includeCantripsLabel: document.getElementById('includeCantripsLabel'),
    schoolFilters: document.getElementById('schoolFilters'),
    searchInput: document.getElementById('search'),
    searchToggle: document.getElementById('searchTextToggle'),
    container: document.getElementById('cardsContainer'),
    pagePrev: document.getElementById('pagePrev'),
    pageNext: document.getElementById('pageNext'),
    pageStatus: document.getElementById('pageStatus'),
    pageDots: document.getElementById('pageDots'),
    manaReadout: document.getElementById('manaReadout'),
    manaBarButton: document.getElementById('manaBarButton'),
    manaBarFill: document.getElementById('manaBarFill'),
    manaBarLabel: document.getElementById('manaBarLabel'),
    manaBarEditor: document.getElementById('manaBarEditor'),
    manaMaxInput: document.getElementById('manaMaxInput'),
    manaStepInput: document.getElementById('manaStepInput'),
    manaDecreaseBtn: document.getElementById('manaDecreaseBtn'),
    manaIncreaseBtn: document.getElementById('manaIncreaseBtn'),
    longRestButton: document.getElementById('longRestButton')
  };

  const schoolButtons = {};
  let longRestTimer = null;
  let longRestFrame = null;
  let longRestActive = false;
  let longRestStartedAt = 0;

  const defaultState = {
    currentPage: 0,
    headerOpen: false,
    prepared: [],
    openCards: [],
    filters: {
      query: '',
      searchDetails: false,
      tier: 'all',
      upTo: false,
      includeCantrips: false,
      schools: []
    },
    mana: {
      current: 7,
      max: 7,
      step: 1
    }
  };

  let state = sanitizeState(loadState());

  populateTierFilter();
  buildSchoolButtons();
  bindEvents();
  setMobileMenu(state.headerOpen);
  render();

  function get(obj, wanted) {
    const wantedKey = wanted.toLowerCase().trim();
    const foundKey = Object.keys(obj).find(key => key.toLowerCase().trim() === wantedKey);
    return foundKey ? obj[foundKey] : undefined;
  }

  function sanitizeState(rawState) {
    const merged = {
      ...defaultState,
      ...rawState,
      filters: {
        ...defaultState.filters,
        ...(rawState?.filters || {})
      },
      mana: {
        ...defaultState.mana,
        ...(rawState?.mana || {})
      }
    };

    const prepared = Array.isArray(merged.prepared) ? merged.prepared : [];
    const openCards = Array.isArray(merged.openCards) ? merged.openCards : [];
    const schools = Array.isArray(merged.filters.schools) ? merged.filters.schools : [];

    merged.currentPage = clampNumber(merged.currentPage, 0, TOTAL_PAGES - 1, 0);
    merged.headerOpen = Boolean(merged.headerOpen);
    merged.prepared = uniqueStrings(prepared).filter(name => glyphMap.has(name));
    merged.openCards = uniqueStrings(openCards);
    merged.filters.query = String(merged.filters.query || '');
    merged.filters.searchDetails = Boolean(merged.filters.searchDetails);
    merged.filters.tier = merged.filters.tier === 'all'
      ? 'all'
      : String(clampNumber(parseInt(merged.filters.tier, 10), 0, 12, 0));
    merged.filters.upTo = Boolean(merged.filters.upTo);
    merged.filters.includeCantrips = Boolean(merged.filters.includeCantrips);
    merged.filters.schools = uniqueStrings(schools).filter(school => SCHOOLS.includes(school));
    merged.mana.max = clampNumber(parseInt(merged.mana.max, 10), 1, 999, defaultState.mana.max);
    merged.mana.current = clampNumber(parseInt(merged.mana.current, 10), 0, merged.mana.max, merged.mana.max);
    merged.mana.step = clampNumber(parseInt(merged.mana.step, 10), 1, 999, defaultState.mana.step);

    if (!(merged.filters.upTo && merged.filters.tier !== 'all')) {
      merged.filters.includeCantrips = false;
    }

    return merged;
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
    } catch (error) {
      console.warn('Unable to parse saved glyph state.', error);
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function uniqueStrings(values) {
    return [...new Set(values.filter(value => typeof value === 'string'))];
  }

  function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, value));
  }

  function populateTierFilter() {
    for (let i = 0; i <= 12; i += 1) {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = `Tier ${i}`;
      elements.levelFilter.appendChild(option);
    }
  }

  function buildSchoolButtons() {
    SCHOOLS.forEach(school => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `school-button school-${school.toLowerCase()}`;
      button.textContent = school;
      button.addEventListener('click', () => {
        const activeSchools = new Set(state.filters.schools);
        if (activeSchools.has(school)) {
          activeSchools.delete(school);
        } else {
          activeSchools.add(school);
        }
        state.filters.schools = [...activeSchools];
        render();
      });
      elements.schoolFilters.appendChild(button);
      schoolButtons[school] = button;
    });
  }

  function bindEvents() {
    elements.searchInput.addEventListener('input', event => {
      state.filters.query = event.target.value;
      render();
    });

    elements.searchToggle.addEventListener('input', event => {
      state.filters.searchDetails = event.target.checked;
      render();
    });

    elements.levelFilter.addEventListener('input', event => {
      state.filters.tier = event.target.value;
      if (!(state.filters.upTo && state.filters.tier !== 'all')) {
        state.filters.includeCantrips = false;
      }
      render();
    });

    elements.upToToggle.addEventListener('input', event => {
      state.filters.upTo = event.target.checked;
      if (!(state.filters.upTo && state.filters.tier !== 'all')) {
        state.filters.includeCantrips = false;
      }
      render();
    });

    elements.includeCantripsToggle.addEventListener('input', event => {
      state.filters.includeCantrips = event.target.checked;
      render();
    });

    elements.mobileToggle.addEventListener('click', () => {
      setMobileMenu(!body.classList.contains('mobile-menu-open'));
    });

    elements.pagePrev.addEventListener('click', () => setPage(state.currentPage - 1));
    elements.pageNext.addEventListener('click', () => setPage(state.currentPage + 1));

    elements.manaBarButton.addEventListener('click', event => {
      if (event.target === elements.manaMaxInput) {
        return;
      }
      openManaEditor();
    });

    elements.manaBarButton.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openManaEditor();
      }
    });

    elements.manaMaxInput.addEventListener('click', event => {
      event.stopPropagation();
    });

    elements.manaMaxInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        closeManaEditor(true);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeManaEditor(false);
      }
    });

    elements.manaMaxInput.addEventListener('blur', () => {
      closeManaEditor(true);
    });

    elements.manaStepInput.addEventListener('input', event => {
      state.mana.step = clampNumber(parseInt(event.target.value, 10), 1, 999, 1);
      saveState();
    });

    elements.manaDecreaseBtn.addEventListener('click', () => adjustMana(-1));
    elements.manaIncreaseBtn.addEventListener('click', () => adjustMana(1));

    elements.longRestButton.addEventListener('pointerdown', startLongRestHold);
    elements.longRestButton.addEventListener('pointerup', cancelLongRestHold);
    elements.longRestButton.addEventListener('pointerleave', cancelLongRestHold);
    elements.longRestButton.addEventListener('pointercancel', cancelLongRestHold);
    elements.longRestButton.addEventListener('blur', cancelLongRestHold);
    elements.longRestButton.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault();
        startLongRestHold();
      }
    });
    elements.longRestButton.addEventListener('keyup', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        cancelLongRestHold();
      }
    });

    mobileQuery.addEventListener('change', () => {
      setMobileMenu(state.headerOpen);
      render();
    });
  }

  function setMobileMenu(open) {
    const isOpen = mobileQuery.matches && open;
    state.headerOpen = isOpen;
    body.classList.toggle('mobile-menu-open', isOpen);
    body.classList.toggle('mobile-menu-closed', mobileQuery.matches && !isOpen);
    elements.mobileToggle.setAttribute('aria-expanded', String(isOpen));
    saveState();
  }

  function setPage(pageIndex) {
    state.currentPage = clampNumber(pageIndex, 0, TOTAL_PAGES - 1, state.currentPage);
    cancelLongRestHold();
    render();
  }

  function render() {
    syncInputsFromState();
    syncTierOptions();
    renderHeader();
    renderCards();
    renderPager();
    renderManaHud();
    saveState();
  }

  function syncInputsFromState() {
    elements.searchInput.value = state.filters.query;
    elements.searchToggle.checked = state.filters.searchDetails;
    elements.levelFilter.value = state.filters.tier;
    elements.upToToggle.checked = state.filters.upTo;
    elements.includeCantripsToggle.checked = state.filters.includeCantrips;
    elements.manaStepInput.value = String(state.mana.step);
    elements.manaMaxInput.value = String(state.mana.max);

    Object.entries(schoolButtons).forEach(([school, button]) => {
      button.classList.toggle('active', state.filters.schools.includes(school));
    });
  }

  function syncTierOptions() {
    const enabled = state.filters.upTo && state.filters.tier !== 'all';
    elements.includeCantripsToggle.disabled = !enabled;
    elements.includeCantripsLabel.classList.toggle('is-disabled', !enabled);
    if (!enabled) {
      elements.includeCantripsToggle.checked = false;
    }
  }

  function renderHeader() {
    const onCatalogPage = state.currentPage === 0;
    elements.pageOneHeader.classList.toggle('active', onCatalogPage);
    elements.pageTwoHeader.classList.toggle('active', !onCatalogPage);
    body.dataset.page = onCatalogPage ? 'catalog' : 'prepared';
  }

  function renderCards() {
    const fragment = document.createDocumentFragment();
    const visibleGlyphs = state.currentPage === 0 ? getCatalogGlyphs() : getPreparedGlyphs();

    elements.container.innerHTML = '';

    if (!visibleGlyphs.length) {
      const empty = document.createElement('div');
      empty.className = 'card empty-card';

      const bodyNode = document.createElement('div');
      bodyNode.className = 'card-body empty-card-body';
      bodyNode.hidden = false;

      const text = document.createElement('p');
      text.textContent = state.currentPage === 0
        ? 'No glyphs match the current filters.'
        : 'No prepared glyphs yet. Open a glyph on page 1 and check Prepared.';

      bodyNode.appendChild(text);
      empty.appendChild(bodyNode);
      fragment.appendChild(empty);
      elements.container.appendChild(fragment);
      return;
    }

    visibleGlyphs.forEach(glyph => {
      fragment.appendChild(renderCard(glyph));
    });

    elements.container.appendChild(fragment);
  }

  function getCatalogGlyphs() {
    const tierSelection = state.filters.tier;
    const tierNumber = parseInt(tierSelection, 10);
    const query = state.filters.query.trim().toLowerCase();

    return glyphs.filter(glyph => {
      const tier = Number(get(glyph, 'Tier')) || 0;
      const school = get(glyph, 'School') || '';

      if (tierSelection !== 'all') {
        if (state.filters.upTo) {
          if (tier > tierNumber) {
            return false;
          }
          if (!state.filters.includeCantrips && tier === 0) {
            return false;
          }
        } else if (tier !== tierNumber) {
          return false;
        }
      }

      if (state.filters.schools.length && !state.filters.schools.includes(school)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const name = String(get(glyph, 'Name') || '').toLowerCase();
      if (name.includes(query)) {
        return true;
      }

      if (state.filters.searchDetails) {
        return Object.values(glyph).some(value => String(value).toLowerCase().includes(query));
      }

      return false;
    });
  }

  function getPreparedGlyphs() {
    return state.prepared
      .map(name => glyphMap.get(name))
      .filter(Boolean);
  }

  function renderCard(glyph) {
    const name = get(glyph, 'Name') ?? '';
    const school = get(glyph, 'School') ?? '';
    const tier = Number(get(glyph, 'Tier')) || 0;
    const manaCost = get(glyph, 'Points') || 0;
    const components = [get(glyph, 'V') ? 'V' : '', get(glyph, 'S') ? 'S' : ''].filter(Boolean).join('/');
    const isPrepared = state.prepared.includes(name);
    const isOpen = state.openCards.includes(name);

    const card = document.createElement('article');
    card.className = 'card';
    card.classList.toggle('open', isOpen);

    const header = document.createElement('div');
    header.className = 'card-header';

    const info = document.createElement('div');
    info.className = `info school-${school.toLowerCase()}`;

    const title = document.createElement('b');
    title.textContent = name;
    info.appendChild(title);

    const side = document.createElement('div');
    side.className = 'header-side';

    const preparedToggle = document.createElement('label');
    preparedToggle.className = 'prepared-toggle';

    const preparedInput = document.createElement('input');
    preparedInput.type = 'checkbox';
    preparedInput.checked = isPrepared;
    preparedInput.setAttribute('aria-label', `Mark ${name} as prepared`);
    preparedInput.addEventListener('click', event => {
      event.stopPropagation();
    });
    preparedInput.addEventListener('change', event => {
      togglePrepared(name, event.target.checked);
    });

    const preparedText = document.createElement('span');
    preparedText.textContent = 'Prepared';

    preparedToggle.append(preparedInput, preparedText);

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${school}${components ? ` ${components}` : ''} - Tier ${tier} - ${manaCost} Mana`;

    side.append(preparedToggle, meta);
    header.append(info, side);

    const bodyNode = document.createElement('div');
    bodyNode.className = 'card-body';
    bodyNode.hidden = !isOpen;

    bodyNode.appendChild(makeDetailLine('Casting Time', get(glyph, 'Casting Time')));
    bodyNode.appendChild(makeDetailLine('Range', get(glyph, 'Range')));

    const duration = `${get(glyph, 'Duration') || ''}${get(glyph, 'Concentration') ? ' (Concentration)' : ''}`;
    bodyNode.appendChild(makeDetailLine('Duration', duration));
    bodyNode.appendChild(makeDetailLine('Effect', get(glyph, 'New Text')));

    const divider = document.createElement('hr');
    bodyNode.appendChild(divider);
    bodyNode.appendChild(makeDetailLine('Higher Tiers', get(glyph, 'Higher Tiers')));

    header.addEventListener('click', () => {
      const nextOpen = !card.classList.contains('open');
      card.classList.toggle('open', nextOpen);
      bodyNode.hidden = !nextOpen;
      updateOpenCardState(name, nextOpen);
    });

    card.append(header, bodyNode);
    return card;
  }

  function makeDetailLine(label, value) {
    const paragraph = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    paragraph.appendChild(strong);
    paragraph.appendChild(document.createTextNode(value || 'N/A'));
    return paragraph;
  }

  function updateOpenCardState(name, isOpen) {
    const openCards = new Set(state.openCards);
    if (isOpen) {
      openCards.add(name);
    } else {
      openCards.delete(name);
    }
    state.openCards = [...openCards];
    saveState();
  }

  function togglePrepared(name, shouldPrepare) {
    const prepared = new Set(state.prepared);
    if (shouldPrepare) {
      prepared.add(name);
    } else {
      prepared.delete(name);
    }
    state.prepared = [...prepared];

    if (!shouldPrepare && state.currentPage === 1) {
      const openCards = new Set(state.openCards);
      openCards.delete(name);
      state.openCards = [...openCards];
    }

    render();
  }

  function renderPager() {
    elements.pagePrev.disabled = state.currentPage === 0;
    elements.pageNext.disabled = state.currentPage === TOTAL_PAGES - 1;
    elements.pageStatus.textContent = `Page ${state.currentPage + 1} of ${TOTAL_PAGES}`;
    elements.pageDots.innerHTML = '';

    for (let pageIndex = 0; pageIndex < TOTAL_PAGES; pageIndex += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'page-dot';
      dot.classList.toggle('active', pageIndex === state.currentPage);
      dot.setAttribute('aria-label', `Go to page ${pageIndex + 1}`);
      dot.addEventListener('click', () => setPage(pageIndex));
      elements.pageDots.appendChild(dot);
    }
  }

  function renderManaHud() {
    const ratio = state.mana.max ? state.mana.current / state.mana.max : 0;
    const gradient = buildManaGradient();
    elements.manaReadout.textContent = `${state.mana.current} / ${state.mana.max}`;
    elements.manaBarLabel.textContent = `Max. Mana: ${state.mana.max}`;
    elements.manaBarFill.style.setProperty('--mana-fill-ratio', String(ratio));
    elements.manaBarFill.style.setProperty('--mana-spectrum', gradient);
    elements.longRestButton.style.setProperty('--mana-spectrum', gradient);
    body.style.setProperty('--mana-spectrum', gradient);
  }

  function buildManaGradient() {
    const counts = SCHOOLS.map(school => {
      const total = state.prepared.reduce((sum, name) => {
        const glyph = glyphMap.get(name);
        return sum + (glyph && get(glyph, 'School') === school ? 1 : 0);
      }, 0);

      return total ? { school, total } : null;
    }).filter(Boolean);

    if (!counts.length) {
      return 'linear-gradient(120deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.92) 50%, rgba(255,255,255,0.45) 100%)';
    }

    const totalPrepared = counts.reduce((sum, item) => sum + item.total, 0);
    const stops = [];
    let start = 0;

    counts.forEach(item => {
      const end = start + (item.total / totalPrepared) * 100;
      const color = SCHOOL_COLORS[item.school];
      stops.push(`${color} ${start.toFixed(2)}%`, `${color} ${end.toFixed(2)}%`);
      start = end;
    });

    return `linear-gradient(120deg, ${stops.join(', ')})`;
  }

  function openManaEditor() {
    elements.manaBarButton.classList.add('is-editing');
    elements.manaMaxInput.value = String(state.mana.max);
    window.requestAnimationFrame(() => {
      elements.manaMaxInput.focus();
      elements.manaMaxInput.select();
    });
  }

  function closeManaEditor(saveChanges) {
    if (!elements.manaBarButton.classList.contains('is-editing')) {
      return;
    }

    if (saveChanges) {
      const nextMax = clampNumber(parseInt(elements.manaMaxInput.value, 10), 1, 999, state.mana.max);
      state.mana.max = nextMax;
      state.mana.current = clampNumber(state.mana.current, 0, nextMax, nextMax);
    }

    elements.manaBarButton.classList.remove('is-editing');
    render();
  }

  function adjustMana(direction) {
    const amount = clampNumber(parseInt(elements.manaStepInput.value, 10), 1, 999, state.mana.step);
    state.mana.step = amount;
    state.mana.current = clampNumber(state.mana.current + amount * direction, 0, state.mana.max, state.mana.current);
    render();
  }

  function startLongRestHold() {
    if (longRestActive) {
      return;
    }

    longRestActive = true;
    longRestStartedAt = performance.now();
    elements.longRestButton.classList.add('is-holding');
    elements.longRestButton.style.setProperty('--hold-progress', '0');

    const animateProgress = now => {
      if (!longRestActive) {
        return;
      }
      const progress = Math.min((now - longRestStartedAt) / 3000, 1);
      elements.longRestButton.style.setProperty('--hold-progress', String(progress));
      longRestFrame = requestAnimationFrame(animateProgress);
    };

    longRestFrame = requestAnimationFrame(animateProgress);
    longRestTimer = window.setTimeout(() => {
      longRestActive = false;
      if (longRestFrame) {
        cancelAnimationFrame(longRestFrame);
        longRestFrame = null;
      }
      state.mana.current = state.mana.max;
      elements.longRestButton.classList.remove('is-holding');
      elements.longRestButton.style.setProperty('--hold-progress', '0');
      render();
    }, 3000);
  }

  function cancelLongRestHold() {
    if (longRestTimer) {
      clearTimeout(longRestTimer);
      longRestTimer = null;
    }
    if (longRestFrame) {
      cancelAnimationFrame(longRestFrame);
      longRestFrame = null;
    }
    if (longRestActive) {
      longRestActive = false;
      elements.longRestButton.classList.remove('is-holding');
      elements.longRestButton.style.setProperty('--hold-progress', '0');
    }
  }
})();
