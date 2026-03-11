/* glyph-database front-end */

;(async () => {
  const res = await fetch(`data/glyphs.json?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    console.error('glyphs.json load-error', res.status);
    return;
  }

  const glyphs = await res.json();

  const STATE_KEY = 'glyphDatabaseState.v3';
  const TOTAL_PAGES = 2;
  const HOLD_DURATION_MS = 3000;
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
  const tierCosts = buildTierCosts(glyphs);
  const maxTier = Math.max(...Object.keys(tierCosts).map(Number));

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
    manaReadoutButton: document.getElementById('manaReadoutButton'),
    manaReadout: document.getElementById('manaReadout'),
    manaMathEditor: document.getElementById('manaMathEditor'),
    manaCurrentInput: document.getElementById('manaCurrentInput'),
    manaMaxInput: document.getElementById('manaMaxInput'),
    manaMathCancel: document.getElementById('manaMathCancel'),
    manaMathSave: document.getElementById('manaMathSave'),
    manaBarShell: document.getElementById('manaBarShell'),
    manaBarFill: document.getElementById('manaBarFill'),
    manaPotionButton: document.getElementById('manaPotionButton'),
    longRestButton: document.getElementById('longRestButton')
  };

  const schoolButtons = {};
  let mathEditorOpen = false;
  let activeHold = null;

  const defaultState = {
    currentPage: 0,
    headerOpen: false,
    prepared: [],
    openCards: [],
    upcasts: {},
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
      max: 7
    }
  };

  let state = sanitizeState(loadState());

  populateTierFilter();
  buildSchoolButtons();
  bindEvents();
  bindHoldButton(elements.longRestButton, longRest);
  bindHoldButton(elements.manaPotionButton, drinkManaPotion);
  setMobileMenu(state.headerOpen);
  render();

  function get(obj, wanted) {
    const wantedKey = wanted.toLowerCase().trim();
    const foundKey = Object.keys(obj).find(key => key.toLowerCase().trim() === wantedKey);
    return foundKey ? obj[foundKey] : undefined;
  }

  function buildTierCosts(data) {
    const countsByTier = {};

    data.forEach(glyph => {
      const tier = Number(get(glyph, 'Tier'));
      const cost = Number(get(glyph, 'Points'));
      if (!Number.isFinite(tier) || !Number.isFinite(cost)) {
        return;
      }
      countsByTier[tier] ||= {};
      countsByTier[tier][cost] = (countsByTier[tier][cost] || 0) + 1;
    });

    return Object.fromEntries(
      Object.entries(countsByTier).map(([tier, counts]) => {
        const dominantCost = Object.entries(counts)
          .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))[0][0];
        return [tier, Number(dominantCost)];
      })
    );
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
    const rawUpcasts = merged.upcasts && typeof merged.upcasts === 'object' ? merged.upcasts : {};

    merged.currentPage = clampNumber(merged.currentPage, 0, TOTAL_PAGES - 1, 0);
    merged.headerOpen = Boolean(merged.headerOpen);
    merged.prepared = uniqueStrings(prepared).filter(name => glyphMap.has(name));
    merged.openCards = uniqueStrings(openCards).filter(name => glyphMap.has(name));
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
    merged.upcasts = Object.fromEntries(
      Object.entries(rawUpcasts)
        .filter(([name]) => glyphMap.has(name))
        .map(([name, value]) => {
          const glyph = glyphMap.get(name);
          const tier = Number(get(glyph, 'Tier')) || 0;
          const maxUpcast = tier === 0 ? 0 : Math.max(0, maxTier - tier);
          return [name, clampNumber(parseInt(value, 10), 0, maxUpcast, 0)];
        })
        .filter(([, value]) => value > 0)
    );

    if (!(merged.filters.upTo && merged.filters.tier !== 'all')) {
      merged.filters.includeCantrips = false;
    }

    return merged;
  }

  function loadState() {
    try {
      const current = localStorage.getItem(STATE_KEY);
      if (current) {
        return JSON.parse(current);
      }
      const legacy = localStorage.getItem('glyphDatabaseState.v2');
      return JSON.parse(legacy || '{}');
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

  function hexToRgba(hex, alpha) {
    const clean = hex.replace('#', '');
    const value = clean.length === 3
      ? clean.split('').map(char => char + char).join('')
      : clean;
    const int = Number.parseInt(value, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

    elements.manaReadoutButton.addEventListener('click', event => {
      if (event.target.closest('.mana-math-editor')) {
        return;
      }
      toggleMathEditor(!mathEditorOpen);
    });

    elements.manaReadoutButton.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMathEditor(!mathEditorOpen);
      }
    });

    elements.manaMathEditor.addEventListener('click', event => {
      event.stopPropagation();
    });

    elements.manaMathSave.addEventListener('click', saveManaMath);
    elements.manaMathCancel.addEventListener('click', () => toggleMathEditor(false));

    [elements.manaCurrentInput, elements.manaMaxInput].forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveManaMath();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          toggleMathEditor(false);
        }
      });
    });

    document.addEventListener('click', event => {
      if (mathEditorOpen && !elements.manaReadoutButton.contains(event.target)) {
        toggleMathEditor(false);
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        toggleMathEditor(false);
        cancelActiveHold();
      }
    });

    mobileQuery.addEventListener('change', () => {
      setMobileMenu(state.headerOpen);
      render();
    });
  }

  function bindHoldButton(button, onComplete) {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      startHold(button, onComplete);
    });
    button.addEventListener('pointerup', () => cancelActiveHold(button));
    button.addEventListener('pointerleave', () => cancelActiveHold(button));
    button.addEventListener('pointercancel', () => cancelActiveHold(button));
    button.addEventListener('blur', () => cancelActiveHold(button));
    button.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault();
        startHold(button, onComplete);
      }
    });
    button.addEventListener('keyup', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        cancelActiveHold(button);
      }
    });
  }

  function startHold(button, onComplete) {
    if (activeHold?.button === button) {
      return;
    }

    cancelActiveHold();
    button.classList.add('is-holding');
    button.style.setProperty('--hold-progress', '0');

    const startedAt = performance.now();
    const frame = requestAnimationFrame(function tick(now) {
      if (!activeHold || activeHold.button !== button) {
        return;
      }
      const progress = Math.min((now - startedAt) / HOLD_DURATION_MS, 1);
      button.style.setProperty('--hold-progress', String(progress));
      activeHold.frame = requestAnimationFrame(tick);
    });

    const timer = window.setTimeout(() => {
      const hold = activeHold;
      clearActiveHold();
      if (hold) {
        hold.onComplete();
      }
    }, HOLD_DURATION_MS);

    activeHold = {
      button,
      frame,
      timer,
      onComplete
    };
  }

  function clearActiveHold() {
    if (!activeHold) {
      return;
    }
    const { button, frame, timer } = activeHold;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    button.classList.remove('is-holding');
    button.style.setProperty('--hold-progress', '0');
    activeHold = null;
  }

  function cancelActiveHold(expectedButton) {
    if (!activeHold) {
      return;
    }
    if (expectedButton && activeHold.button !== expectedButton) {
      return;
    }
    clearActiveHold();
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
    toggleMathEditor(false);
    cancelActiveHold();
    render();
  }

  function toggleMathEditor(shouldOpen) {
    mathEditorOpen = Boolean(shouldOpen) && state.currentPage === 1;
    elements.manaReadoutButton.classList.toggle('is-editing', mathEditorOpen);
    elements.manaReadoutButton.setAttribute('aria-expanded', String(mathEditorOpen));
    if (mathEditorOpen) {
      elements.manaCurrentInput.value = String(state.mana.current);
      elements.manaMaxInput.value = String(state.mana.max);
      window.requestAnimationFrame(() => {
        elements.manaCurrentInput.focus();
        elements.manaCurrentInput.select();
      });
    }
  }

  function saveManaMath() {
    const nextMax = clampNumber(parseInt(elements.manaMaxInput.value, 10), 1, 999, state.mana.max);
    const nextCurrent = clampNumber(parseInt(elements.manaCurrentInput.value, 10), 0, nextMax, state.mana.current);
    state.mana.max = nextMax;
    state.mana.current = nextCurrent;
    toggleMathEditor(false);
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
    elements.manaCurrentInput.value = String(state.mana.current);
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
    if (onCatalogPage) {
      toggleMathEditor(false);
    }
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
    const manaCost = Number(get(glyph, 'Points')) || 0;
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

    if (state.currentPage === 1) {
      bodyNode.appendChild(buildCastPanel(glyph));
    }

    header.addEventListener('click', () => {
      const nextOpen = !card.classList.contains('open');
      card.classList.toggle('open', nextOpen);
      bodyNode.hidden = !nextOpen;
      updateOpenCardState(name, nextOpen);
    });

    card.append(header, bodyNode);
    return card;
  }

  function buildCastPanel(glyph) {
    const details = getCastDetails(glyph);
    const panel = document.createElement('div');
    panel.className = 'cast-panel';

    if (details.baseTier === 0) {
      const note = document.createElement('div');
      note.className = 'cast-cantrip-note';
      note.textContent = 'Cantrip - no mana cost and no upcast.';
      panel.appendChild(note);
      return panel;
    }

    const summary = document.createElement('div');
    summary.className = 'cast-summary';

    const summaryTitle = document.createElement('div');
    summaryTitle.className = 'cast-summary-title';
    summaryTitle.textContent = details.upcast > 0 ? `Upcast +${details.upcast}` : 'Base Cast';

    const summaryMeta = document.createElement('div');
    summaryMeta.className = 'cast-summary-meta';
    summaryMeta.textContent = `Tier ${details.castTier} - ${details.castCost} Mana`;

    summary.append(summaryTitle, summaryMeta);

    const adjuster = document.createElement('div');
    adjuster.className = 'cast-adjuster';

    const adjustLabel = document.createElement('span');
    adjustLabel.className = 'cast-adjust-label';
    adjustLabel.textContent = 'Upcast';

    const decrease = document.createElement('button');
    decrease.type = 'button';
    decrease.className = 'cast-adjust-button';
    decrease.textContent = '-';
    decrease.disabled = details.upcast === 0;
    decrease.addEventListener('click', () => adjustUpcast(details.name, details.baseTier, -1));

    const value = document.createElement('span');
    value.className = 'cast-adjust-value';
    value.textContent = details.upcast > 0 ? `+${details.upcast}` : 'Base';

    const increase = document.createElement('button');
    increase.type = 'button';
    increase.className = 'cast-adjust-button';
    increase.textContent = '+';
    increase.disabled = details.upcast >= details.maxUpcast;
    increase.addEventListener('click', () => adjustUpcast(details.name, details.baseTier, 1));

    adjuster.append(adjustLabel, decrease, value, increase);

    const preview = document.createElement('div');
    preview.className = 'cast-preview';

    const previewTier = document.createElement('span');
    previewTier.textContent = `Tier ${details.castTier}`;

    const previewCost = document.createElement('span');
    previewCost.textContent = `${details.castCost} Mana`;

    preview.append(previewTier, previewCost);

    const castButton = document.createElement('button');
    castButton.type = 'button';
    castButton.className = 'hold-button cast-button';

    const castTitle = document.createElement('span');
    castTitle.className = 'button-title';
    castTitle.textContent = 'Cast';

    const castSubtitle = document.createElement('span');
    castSubtitle.className = 'button-subtitle';
    castSubtitle.textContent = `Tier ${details.castTier} - ${details.castCost} Mana`;

    castButton.append(castTitle, castSubtitle);
    applyManaTexture(castButton, buildManaVisuals());
    bindHoldButton(castButton, () => castGlyph(glyph));

    panel.append(summary, adjuster, preview, castButton);
    return panel;
  }

  function getCastDetails(glyph) {
    const name = get(glyph, 'Name') ?? '';
    const baseTier = Number(get(glyph, 'Tier')) || 0;
    const baseCost = Number(get(glyph, 'Points')) || 0;
    const maxUpcast = baseTier === 0 ? 0 : Math.max(0, maxTier - baseTier);
    const upcast = clampNumber(Number(state.upcasts[name]) || 0, 0, maxUpcast, 0);
    const castTier = baseTier + upcast;
    const castCost = upcast === 0 ? baseCost : (tierCosts[castTier] ?? baseCost);

    return {
      name,
      baseTier,
      baseCost,
      maxUpcast,
      upcast,
      castTier,
      castCost
    };
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

    if (!shouldPrepare) {
      delete state.upcasts[name];
      if (state.currentPage === 1) {
        const openCards = new Set(state.openCards);
        openCards.delete(name);
        state.openCards = [...openCards];
      }
    }

    render();
  }

  function adjustUpcast(name, baseTier, delta) {
    const maxUpcast = baseTier === 0 ? 0 : Math.max(0, maxTier - baseTier);
    const nextValue = clampNumber((Number(state.upcasts[name]) || 0) + delta, 0, maxUpcast, 0);
    if (nextValue === 0) {
      delete state.upcasts[name];
    } else {
      state.upcasts[name] = nextValue;
    }
    render();
  }

  function castGlyph(glyph) {
    const details = getCastDetails(glyph);
    state.mana.current = clampNumber(state.mana.current - details.castCost, 0, state.mana.max, 0);
    render();
  }

  function drinkManaPotion() {
    const restored = Math.floor(Math.random() * 7) + 3;
    state.mana.current = clampNumber(state.mana.current + restored, 0, state.mana.max, state.mana.max);
    render();
  }

  function longRest() {
    state.mana.current = state.mana.max;
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

  function buildManaVisuals() {
    const counts = SCHOOLS.map(school => {
      const total = state.prepared.reduce((sum, name) => {
        const glyph = glyphMap.get(name);
        return sum + (glyph && get(glyph, 'School') === school ? 1 : 0);
      }, 0);
      return total ? { school, total } : null;
    }).filter(Boolean);

    const palette = [];
    const totalPrepared = counts.reduce((sum, item) => sum + item.total, 0);

    if (!counts.length) {
      palette.push('#ffffff', '#dcdcdc', '#ffffff');
    } else {
      counts.forEach(item => {
        const repeats = Math.max(1, Math.round((item.total / totalPrepared) * 6));
        for (let index = 0; index < repeats; index += 1) {
          palette.push(SCHOOL_COLORS[item.school]);
        }
      });
    }

    while (palette.length < 4) {
      palette.push(palette[palette.length - 1] || '#ffffff');
    }

    const spectrum = `linear-gradient(135deg, ${palette.map((color, index) => {
      const stop = palette.length === 1 ? 100 : (index / (palette.length - 1)) * 100;
      return `${hexToRgba(color, 0.95)} ${stop.toFixed(2)}%`;
    }).join(', ')})`;

    const marble = palette.map((color, index) => {
      const x = 12 + (index * 19) % 76;
      const y = 18 + (index * 27) % 64;
      return `radial-gradient(circle at ${x}% ${y}%, ${hexToRgba(color, 0.88)} 0%, ${hexToRgba(color, 0.54)} 14%, transparent 42%)`;
    }).join(', ');

    const sparkles = palette.slice(0, 8).map((color, index) => {
      const x = 8 + (index * 13) % 84;
      const y = 16 + (index * 21) % 68;
      return `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.78) 2.5%, ${hexToRgba(color, 0.42)} 4.5%, transparent 8%)`;
    }).join(', ');

    return { spectrum, marble, sparkles };
  }

  function applyManaTexture(node, visuals) {
    node.style.setProperty('--mana-spectrum', visuals.spectrum);
    node.style.setProperty('--mana-marble', visuals.marble);
    node.style.setProperty('--mana-sparkles', visuals.sparkles);
  }

  function renderManaHud() {
    const ratio = state.mana.max ? state.mana.current / state.mana.max : 0;
    const visuals = buildManaVisuals();

    elements.manaReadout.textContent = `${state.mana.current} / ${state.mana.max}`;
    elements.manaBarFill.style.setProperty('--mana-fill-ratio', String(ratio));
    applyManaTexture(elements.manaBarFill, visuals);
    applyManaTexture(elements.longRestButton, visuals);
    applyManaTexture(elements.manaPotionButton, visuals);
  }
})();
