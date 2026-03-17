/* glyph-database front-end */

;(async () => {
  const scriptSrc = document.currentScript?.getAttribute('src') || '';
  const dataPath = scriptSrc.includes('assets/js/') ? 'data/glyphs.json' : 'glyphs.json';
  const res = await fetch(`${dataPath}?ts=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) {
    console.error('glyphs.json load-error', res.status);
    return;
  }

  const glyphs = await res.json();

  const STATE_KEY = 'glyphDatabaseState.v4';
  const LEGACY_STATE_KEYS = ['glyphDatabaseState.v3', 'glyphDatabaseState.v2'];
  const TOTAL_PAGES = 3;
  const HOLD_DURATION_MS = 1500;
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
  const SHORT_REST_DICE = ['d4', 'd6', 'd8', 'd10', 'd12'];
  const ABILITIES = [
    {
      id: 'agility',
      label: 'Agility',
      feature: { kind: 'shield', label: 'Armor', field: 'armor', inputType: 'number', placeholder: 'AC' },
      skills: ['acrobatics', 'nimble', 'stealth']
    },
    {
      id: 'constitution',
      label: 'Constitution',
      feature: { kind: 'heart', label: 'HP' },
      skills: ['endurance']
    },
    {
      id: 'mind',
      label: 'Mind',
      feature: { kind: 'brain', label: 'Madness', field: 'brain', inputType: 'number', placeholder: '0' },
      skills: ['inestigation', 'lore', 'medicine', 'nature', 'profession']
    },
    {
      id: 'strength',
      label: 'Strength',
      feature: { kind: 'weight', label: 'Carrying', field: 'strengthCalc', inputType: 'text', placeholder: 'Pending' },
      skills: ['athletics', 'intimidation']
    },
    {
      id: 'wellspring',
      label: 'Wellspring',
      feature: { kind: 'flame', label: 'MP' },
      skills: ['arcana', 'artistry', 'faith', 'intuition', 'ripple']
    },
    {
      id: 'wits',
      label: 'Wits',
      feature: { kind: 'eye', label: 'Passive Wits', field: 'witsCalc', inputType: 'text', placeholder: 'Pending' },
      skills: ['culture', 'empathy', 'perception', 'streetwise', 'manipulation']
    }
  ];
  const SKILLS = [
    { id: 'acrobatics', label: 'Acrobatics', ability: 'agility' },
    { id: 'nimble', label: 'Nimble', ability: 'agility' },
    { id: 'stealth', label: 'Stealth', ability: 'agility' },
    { id: 'endurance', label: 'Endurance', ability: 'constitution' },
    { id: 'inestigation', label: 'Inestigation', ability: 'mind' },
    { id: 'lore', label: 'Lore', ability: 'mind' },
    { id: 'medicine', label: 'Medicine', ability: 'mind' },
    { id: 'nature', label: 'Nature', ability: 'mind' },
    { id: 'profession', label: 'Profession', ability: 'mind' },
    { id: 'athletics', label: 'Athletics', ability: 'strength' },
    { id: 'intimidation', label: 'Intimidation', ability: 'strength' },
    { id: 'arcana', label: 'Arcana', ability: 'wellspring' },
    { id: 'artistry', label: 'Artistry', ability: 'wellspring' },
    { id: 'faith', label: 'Faith', ability: 'wellspring' },
    { id: 'intuition', label: 'Intuition', ability: 'wellspring' },
    { id: 'ripple', label: 'Ripple', ability: 'wellspring' },
    { id: 'culture', label: 'Culture', ability: 'wits' },
    { id: 'empathy', label: 'Empathy', ability: 'wits' },
    { id: 'perception', label: 'Perception', ability: 'wits' },
    { id: 'streetwise', label: 'Streetwise', ability: 'wits' },
    { id: 'manipulation', label: 'Manipulation', ability: 'wits' }
  ];
  const PROFICIENCY_GROUPS = [
    {
      id: 'weaponProficiencies',
      label: 'Weapon Proficiencies',
      options: ['Improvised', 'Simple', 'Martial', 'Other']
    },
    {
      id: 'armorProficiencies',
      label: 'Armor Proficiencies',
      options: ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shields']
    },
    {
      id: 'standardLanguages',
      label: 'Standard Language Proficiencies',
      options: ['Common', 'Common Sign Language', 'Arborian', 'Dwarvish', 'Vathian']
    },
    {
      id: 'exoticLanguages',
      label: 'Exotic Language Proficiencies',
      options: [
        'Folkorin',
        'Zobrakian',
        'Abyssal',
        'Celestial',
        'Divellian',
        'Draconic',
        'Goltharic',
        'Lorthaylin',
        'Netherese',
        'Orchidian',
        'Grimtongue',
        'Primordial',
        'Sylvan',
        "Thieves' Cant",
        'Verdalin',
        'Other'
      ]
    }
  ];
  const SENSE_RANGE_OPTIONS = [
    { id: 'darkVision', label: 'Dark-Vision' },
    { id: 'blindsight', label: 'Blindsight' },
    { id: 'tremmorSense', label: 'Tremmor-sense' },
    { id: 'truesight', label: 'Truesight' },
    { id: 'otherSense', label: 'Other' }
  ];
  const SENSE_TRAITS = ['Big Sniffa\'', 'Keen Hearing', 'Keen Vision', 'Other'];
  const SPEED_TYPES = [
    { id: 'walking', label: 'Walking' },
    { id: 'climbing', label: 'Climbing' },
    { id: 'swimming', label: 'Swimming' },
    { id: 'flying', label: 'Flying' },
    { id: 'burrowing', label: 'Burrowing' }
  ];
  const RESISTANCE_BLOCKS = [
    {
      id: 'physical',
      title: 'Physical Damage',
      items: ['bludgeoning', 'piercing', 'slashing', 'bleed', 'physicalOther']
    },
    {
      id: 'elemental',
      title: 'Elemental Damage',
      items: ['acid', 'cold', 'fire', 'force', 'lightning', 'poison', 'psychic', 'radiant', 'thunder', 'void']
    },
    {
      id: 'wellspring',
      title: 'Wellspring Damage',
      items: ['aetherial']
    }
  ];
  const RESISTANCE_LABELS = {
    bludgeoning: 'Bludgeoning',
    piercing: 'Piercing',
    slashing: 'Slashing',
    bleed: 'Bleed',
    physicalOther: 'Other',
    acid: 'Acid',
    cold: 'Cold',
    fire: 'Fire',
    force: 'Force',
    lightning: 'Lightning',
    poison: 'Poison',
    psychic: 'Psychic',
    radiant: 'Radiant',
    thunder: 'Thunder',
    void: 'Void',
    aetherial: 'Aetherial'
  };
  const RESISTANCE_META = {
    none: { label: 'Clear', color: '#ffffff' },
    resistance: { label: 'Resistance', color: '#3ddc84' },
    vulnerability: { label: 'Vulnerability', color: '#ff6b6b' },
    immunity: { label: 'Immunity', color: '#595959' }
  };
  const CONDITIONS = [
    { id: 'blinded', label: 'Blinded', color: '#fff1a8' },
    { id: 'charmed', label: 'Charmed', color: '#ff8bd1' },
    { id: 'deafened', label: 'Deafened', color: '#8fd7ff' },
    { id: 'frightened', label: 'Frightened', color: '#6f8cff' },
    { id: 'grappled', label: 'Grappled', color: '#b98a4d' },
    { id: 'incapacitated', label: 'Incapacitated', color: '#d5d7de' },
    { id: 'invisible', label: 'Invisible', color: '#baf2ff' },
    { id: 'paralyzed', label: 'Paralyzed', color: '#f1c3ff' },
    { id: 'petrified', label: 'Petrified', color: '#b7b7b7' },
    { id: 'poisoned', label: 'Poisoned', color: '#70e36f' },
    { id: 'prone', label: 'Prone', color: '#f0b27a' },
    { id: 'restrained', label: 'Restrained', color: '#dbb55f' },
    { id: 'stunned', label: 'Stunned', color: '#f6ef8d' },
    { id: 'unconsious', label: 'Unconsious', color: '#8594a8' },
    { id: 'concentrating', label: 'Concentrating', color: '#d47aff' }
  ];
  const ABILITY_MAP = Object.fromEntries(ABILITIES.map(ability => [ability.id, ability]));
  const SKILL_MAP = Object.fromEntries(SKILLS.map(skill => [skill.id, skill]));

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
    pageThreeHeader: document.getElementById('pageThreeHeader'),
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
    manaBarFill: document.getElementById('manaBarFill'),
    manaPotionButton: document.getElementById('manaPotionButton'),
    longRestButton: document.getElementById('longRestButton'),
    manaLongRestTallies: document.getElementById('manaLongRestTallies'),
    hpReadoutButton: document.getElementById('hpReadoutButton'),
    hpReadout: document.getElementById('hpReadout'),
    hpMathEditor: document.getElementById('hpMathEditor'),
    hpCurrentInput: document.getElementById('hpCurrentInput'),
    hpMaxInput: document.getElementById('hpMaxInput'),
    hpMathCancel: document.getElementById('hpMathCancel'),
    hpMathSave: document.getElementById('hpMathSave'),
    hpBarFill: document.getElementById('hpBarFill'),
    hpTempOverlay: document.getElementById('hpTempOverlay'),
    hpConditionSparkles: document.getElementById('hpConditionSparkles'),
    hpMortalityMarks: document.getElementById('hpMortalityMarks'),
    tempHpButton: document.getElementById('tempHpButton'),
    tempHpValue: document.getElementById('tempHpValue'),
    healthPotionButton: document.getElementById('healthPotionButton'),
    shortRestButton: document.getElementById('shortRestButton'),
    shortRestDieSelect: document.getElementById('shortRestDieSelect'),
    shortRestSummary: document.getElementById('shortRestSummary'),
    hpLongRestButton: document.getElementById('hpLongRestButton'),
    hpLongRestTallies: document.getElementById('hpLongRestTallies'),
    hpAdjustMinusButton: document.getElementById('hpAdjustMinusButton'),
    hpAdjustValue: document.getElementById('hpAdjustValue'),
    hpAdjustPlusButton: document.getElementById('hpAdjustPlusButton'),
    sheetModal: document.getElementById('sheetModal'),
    sheetModalTitle: document.getElementById('sheetModalTitle'),
    sheetModalBody: document.getElementById('sheetModalBody'),
    sheetModalActions: document.getElementById('sheetModalActions'),
    sheetModalClose: document.getElementById('sheetModalClose')
  };

  const schoolButtons = {};
  let openEditor = null;
  let activeHold = null;
  let modalState = null;

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
    },
    hp: {
      current: 12,
      max: 12,
      temp: 0,
      manualAdjust: 1,
      shortRestDie: 'd8'
    },
    sheet: buildDefaultSheetState()
  };

  let state = sanitizeState(loadState());

  populateTierFilter();
  buildSchoolButtons();
  bindEvents();
  bindHoldButton(elements.longRestButton, longRest);
  bindHoldButton(elements.manaPotionButton, drinkManaPotion);
  bindHoldButton(elements.healthPotionButton, drinkHealthPotion);
  bindHoldButton(elements.shortRestButton, takeShortRest);
  bindHoldButton(elements.hpLongRestButton, longRest);
  bindAdjustOrHoldButton(elements.hpAdjustMinusButton, () => adjustManualTicker(-1), () => applyManualHpAdjustment(-1));
  bindAdjustOrHoldButton(elements.hpAdjustPlusButton, () => adjustManualTicker(1), () => applyManualHpAdjustment(1));
  setMobileMenu(state.headerOpen);
  render();

  function buildDefaultSheetState() {
    return {
      proficiencyBonus: 2,
      topFields: {
        armor: '',
        brain: '',
        strengthCalc: '',
        witsCalc: ''
      },
      abilities: Object.fromEntries(
        ABILITIES.map(ability => [ability.id, { score: 10, proficient: false }])
      ),
      skills: Object.fromEntries(
        SKILLS.map(skill => [skill.id, {
          proficient: false,
          ability: skill.ability,
          expertise: false,
          misc: 0
        }])
      ),
      attacks: [createAttack()],
      proficiencies: Object.fromEntries(PROFICIENCY_GROUPS.map(group => [group.id, []])),
      customOptions: Object.fromEntries(PROFICIENCY_GROUPS.map(group => [group.id, []])),
      senses: {
        selectedRanges: [],
        ranges: Object.fromEntries(SENSE_RANGE_OPTIONS.map(option => [option.id, ''])),
        traits: [],
        customRanges: [],
        customTraits: []
      },
      speeds: Object.fromEntries(SPEED_TYPES.map(speed => [speed.id, ''])),
      resistances: {
        statuses: Object.fromEntries(Object.keys(RESISTANCE_LABELS).map(key => [key, 'none'])),
        bleedPoints: ''
      },
      conditions: {
        toggles: Object.fromEntries(CONDITIONS.map(condition => [condition.id, false])),
        exhaustion: 0,
        mortality: 0
      }
    };
  }

  function createAttack() {
    return {
      id: `attack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: '',
      range: '',
      toHit: '',
      damage: '',
      properties: ''
    };
  }

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
      },
      hp: {
        ...defaultState.hp,
        ...(rawState?.hp || {})
      },
      sheet: sanitizeSheetState(rawState?.sheet || {})
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
    merged.hp.max = clampNumber(parseInt(merged.hp.max, 10), 1, 999, defaultState.hp.max);
    merged.hp.current = clampNumber(parseInt(merged.hp.current, 10), 0, merged.hp.max, merged.hp.max);
    merged.hp.temp = clampNumber(parseInt(merged.hp.temp, 10), 0, 999, 0);
    merged.hp.manualAdjust = clampNumber(parseInt(merged.hp.manualAdjust, 10), 0, 999, defaultState.hp.manualAdjust);
    merged.hp.shortRestDie = SHORT_REST_DICE.includes(merged.hp.shortRestDie)
      ? merged.hp.shortRestDie
      : defaultState.hp.shortRestDie;
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

  function sanitizeSheetState(rawSheet) {
    const defaults = buildDefaultSheetState();

    const abilities = Object.fromEntries(
      ABILITIES.map(ability => {
        const rawAbility = rawSheet?.abilities?.[ability.id] || {};
        return [ability.id, {
          score: clampNumber(parseInt(rawAbility.score, 10), 0, 30, 10),
          proficient: Boolean(rawAbility.proficient)
        }];
      })
    );

    const skills = Object.fromEntries(
      SKILLS.map(skill => {
        const rawSkill = rawSheet?.skills?.[skill.id] || {};
        return [skill.id, {
          proficient: Boolean(rawSkill.proficient),
          ability: ABILITY_MAP[rawSkill.ability] ? rawSkill.ability : skill.ability,
          expertise: Boolean(rawSkill.expertise),
          misc: clampNumber(parseInt(rawSkill.misc, 10), -99, 99, 0)
        }];
      })
    );

    const attacks = Array.isArray(rawSheet?.attacks)
      ? rawSheet.attacks.map(attack => sanitizeAttack(attack)).filter(Boolean)
      : defaults.attacks;

    const customOptions = Object.fromEntries(
      PROFICIENCY_GROUPS.map(group => {
        const rawCustom = Array.isArray(rawSheet?.customOptions?.[group.id]) ? rawSheet.customOptions[group.id] : [];
        return [group.id, uniqueStrings(rawCustom).map(value => sanitizeShortText(value, 40)).filter(Boolean)];
      })
    );

    const proficiencies = Object.fromEntries(
      PROFICIENCY_GROUPS.map(group => {
        const selected = Array.isArray(rawSheet?.proficiencies?.[group.id])
          ? rawSheet.proficiencies[group.id]
          : [];
        const allowed = new Set([
          ...group.options.filter(option => option !== 'Other'),
          ...customOptions[group.id]
        ]);
        return [group.id, uniqueStrings(selected).filter(option => allowed.has(option))];
      })
    );

    const customRanges = Array.isArray(rawSheet?.senses?.customRanges)
      ? rawSheet.senses.customRanges
        .map(range => ({
          id: sanitizeShortText(range?.id || `custom-range-${Date.now()}`, 60),
          label: sanitizeShortText(range?.label, 40)
        }))
        .filter(range => range.id && range.label)
      : [];

    const customTraits = uniqueStrings(rawSheet?.senses?.customTraits || [])
      .map(value => sanitizeShortText(value, 40))
      .filter(Boolean);

    const allowedRangeIds = new Set([
      ...SENSE_RANGE_OPTIONS.filter(option => option.id !== 'otherSense').map(option => option.id),
      ...customRanges.map(option => option.id)
    ]);

    const selectedRanges = uniqueStrings(rawSheet?.senses?.selectedRanges || [])
      .filter(optionId => allowedRangeIds.has(optionId));

    const ranges = Object.fromEntries(
      [...SENSE_RANGE_OPTIONS.filter(option => option.id !== 'otherSense'), ...customRanges]
        .map(option => [option.id, sanitizeOptionalNumber(rawSheet?.senses?.ranges?.[option.id])])
    );

    const speeds = Object.fromEntries(
      SPEED_TYPES.map(speed => [speed.id, sanitizeOptionalNumber(rawSheet?.speeds?.[speed.id])])
    );

    const statuses = Object.fromEntries(
      Object.keys(RESISTANCE_LABELS).map(key => {
        const value = rawSheet?.resistances?.statuses?.[key];
        return [key, Object.prototype.hasOwnProperty.call(RESISTANCE_META, value) ? value : 'none'];
      })
    );

    return {
      proficiencyBonus: clampNumber(parseInt(rawSheet?.proficiencyBonus, 10), 2, 6, defaults.proficiencyBonus),
      topFields: {
        armor: sanitizeShortText(rawSheet?.topFields?.armor),
        brain: sanitizeShortText(rawSheet?.topFields?.brain),
        strengthCalc: sanitizeShortText(rawSheet?.topFields?.strengthCalc),
        witsCalc: sanitizeShortText(rawSheet?.topFields?.witsCalc)
      },
      abilities,
      skills,
      attacks: attacks.length ? attacks : defaults.attacks,
      proficiencies,
      customOptions,
      senses: {
        selectedRanges,
        ranges,
        traits: uniqueStrings(rawSheet?.senses?.traits || [])
          .filter(trait => [...SENSE_TRAITS.filter(item => item !== 'Other'), ...customTraits].includes(trait)),
        customRanges,
        customTraits
      },
      speeds,
      resistances: {
        statuses,
        bleedPoints: sanitizeOptionalNumber(rawSheet?.resistances?.bleedPoints)
      },
      conditions: {
        toggles: Object.fromEntries(
          CONDITIONS.map(condition => [condition.id, Boolean(rawSheet?.conditions?.toggles?.[condition.id])])
        ),
        exhaustion: clampNumber(parseInt(rawSheet?.conditions?.exhaustion, 10), 0, 6, 0),
        mortality: clampNumber(parseInt(rawSheet?.conditions?.mortality, 10), 0, 3, 0)
      }
    };
  }

  function sanitizeAttack(rawAttack) {
    if (!rawAttack || typeof rawAttack !== 'object') {
      return null;
    }

    return {
      id: typeof rawAttack.id === 'string' && rawAttack.id ? rawAttack.id : createAttack().id,
      name: sanitizeShortText(rawAttack.name, 80),
      range: sanitizeShortText(rawAttack.range, 40),
      toHit: sanitizeShortText(rawAttack.toHit, 20),
      damage: sanitizeShortText(rawAttack.damage, 40),
      properties: sanitizeShortText(rawAttack.properties, 240)
    };
  }

  function sanitizeShortText(value, maxLength = 80) {
    return String(value ?? '').slice(0, maxLength);
  }

  function sanitizeOptionalNumber(value) {
    if (value === '' || value === null || value === undefined) {
      return '';
    }

    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? clampNumber(parsed, 0, 999, '') : '';
  }

  function loadState() {
    try {
      const current = localStorage.getItem(STATE_KEY);
      if (current) {
        return JSON.parse(current);
      }

      for (const legacyKey of LEGACY_STATE_KEYS) {
        const legacy = localStorage.getItem(legacyKey);
        if (legacy) {
          return JSON.parse(legacy);
        }
      }

      return {};
    } catch (error) {
      console.warn('Unable to parse saved glyph state.', error);
      return {};
    }
  }

  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function uniqueStrings(values) {
    return [...new Set((Array.isArray(values) ? values : []).filter(value => typeof value === 'string'))];
  }

  function clampNumber(value, min, max, fallback) {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, value));
  }

  function formatSigned(value) {
    return value > 0 ? `+${value}` : String(value);
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

    bindResourceEditor({
      button: elements.manaReadoutButton,
      editor: elements.manaMathEditor,
      currentInput: elements.manaCurrentInput,
      maxInput: elements.manaMaxInput,
      saveButton: elements.manaMathSave,
      cancelButton: elements.manaMathCancel,
      pageIndex: 1,
      resource: 'mana',
      onSave: saveManaMath
    });

    bindResourceEditor({
      button: elements.hpReadoutButton,
      editor: elements.hpMathEditor,
      currentInput: elements.hpCurrentInput,
      maxInput: elements.hpMaxInput,
      saveButton: elements.hpMathSave,
      cancelButton: elements.hpMathCancel,
      pageIndex: 2,
      resource: 'hp',
      onSave: saveHpMath
    });

    elements.shortRestDieSelect.addEventListener('change', event => {
      state.hp.shortRestDie = SHORT_REST_DICE.includes(event.target.value)
        ? event.target.value
        : state.hp.shortRestDie;
      render();
    });

    elements.hpAdjustValue.addEventListener('change', event => {
      state.hp.manualAdjust = clampNumber(parseInt(event.target.value, 10), 0, 999, state.hp.manualAdjust);
      render();
    });

    elements.tempHpButton.addEventListener('click', () => {
      openTempHpModal();
    });

    elements.sheetModalClose.addEventListener('click', closeModal);
    elements.sheetModal.addEventListener('click', event => {
      if (event.target === elements.sheetModal) {
        closeModal();
      }
    });

    document.addEventListener('click', event => {
      if (openEditor === 'mana' && !elements.manaReadoutButton.contains(event.target)) {
        setOpenEditor(null);
      }
      if (openEditor === 'hp' && !elements.hpReadoutButton.contains(event.target)) {
        setOpenEditor(null);
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        setOpenEditor(null);
        closeModal();
        cancelActiveHold();
      }
    });

    mobileQuery.addEventListener('change', () => {
      setMobileMenu(state.headerOpen);
      render();
    });

    window.addEventListener('resize', () => {
      window.requestAnimationFrame(fitSheetText);
    });
  }

  function bindResourceEditor({ button, editor, currentInput, maxInput, saveButton, cancelButton, pageIndex, resource, onSave }) {
    button.addEventListener('click', event => {
      if (event.target.closest('.resource-math-editor')) {
        return;
      }
      if (state.currentPage !== pageIndex) {
        return;
      }
      setOpenEditor(openEditor === resource ? null : resource);
    });

    button.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && state.currentPage === pageIndex) {
        event.preventDefault();
        setOpenEditor(openEditor === resource ? null : resource);
      }
    });

    editor.addEventListener('click', event => {
      event.stopPropagation();
    });

    saveButton.addEventListener('click', onSave);
    cancelButton.addEventListener('click', () => setOpenEditor(null));

    [currentInput, maxInput].forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onSave();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setOpenEditor(null);
        }
      });
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

  function bindAdjustOrHoldButton(button, onClick, onHold) {
    bindHoldButton(button, () => {
      button.dataset.holdTriggered = 'true';
      onHold();
    });

    button.addEventListener('click', event => {
      if (button.dataset.holdTriggered === 'true') {
        button.dataset.holdTriggered = 'false';
        event.preventDefault();
        return;
      }
      onClick();
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
    setOpenEditor(null);
    closeModal();
    cancelActiveHold();
    elements.container.scrollTop = 0;
    render();
  }

  function setOpenEditor(resource) {
    openEditor = resource;

    const manaOpen = openEditor === 'mana' && state.currentPage === 1;
    const hpOpen = openEditor === 'hp' && state.currentPage === 2;

    elements.manaReadoutButton.classList.toggle('is-editing', manaOpen);
    elements.manaReadoutButton.setAttribute('aria-expanded', String(manaOpen));
    elements.hpReadoutButton.classList.toggle('is-editing', hpOpen);
    elements.hpReadoutButton.setAttribute('aria-expanded', String(hpOpen));

    if (manaOpen) {
      elements.manaCurrentInput.value = String(state.mana.current);
      elements.manaMaxInput.value = String(state.mana.max);
      window.requestAnimationFrame(() => {
        elements.manaCurrentInput.focus();
        elements.manaCurrentInput.select();
      });
    }

    if (hpOpen) {
      elements.hpCurrentInput.value = String(state.hp.current);
      elements.hpMaxInput.value = String(state.hp.max);
      window.requestAnimationFrame(() => {
        elements.hpCurrentInput.focus();
        elements.hpCurrentInput.select();
      });
    }
  }

  function saveManaMath() {
    const nextMax = clampNumber(parseInt(elements.manaMaxInput.value, 10), 1, 999, state.mana.max);
    const nextCurrent = clampNumber(parseInt(elements.manaCurrentInput.value, 10), 0, nextMax, state.mana.current);
    state.mana.max = nextMax;
    state.mana.current = nextCurrent;
    setOpenEditor(null);
    render();
  }

  function saveHpMath() {
    const nextMax = clampNumber(parseInt(elements.hpMaxInput.value, 10), 1, 999, state.hp.max);
    const nextCurrent = clampNumber(parseInt(elements.hpCurrentInput.value, 10), 0, nextMax, state.hp.current);
    state.hp.max = nextMax;
    state.hp.current = nextCurrent;
    setOpenEditor(null);
    render();
  }

  function render() {
    syncInputsFromState();
    syncTierOptions();
    renderHeader();
    renderMainContent();
    renderPager();
    renderManaHud();
    renderHpHud();
    renderModal();
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
    elements.hpCurrentInput.value = String(state.hp.current);
    elements.hpMaxInput.value = String(state.hp.max);
    elements.shortRestDieSelect.value = state.hp.shortRestDie;
    elements.hpAdjustValue.value = String(state.hp.manualAdjust);

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
    const onPreparedPage = state.currentPage === 1;
    const onSheetPage = state.currentPage === 2;

    elements.pageOneHeader.classList.toggle('active', onCatalogPage);
    elements.pageTwoHeader.classList.toggle('active', onPreparedPage);
    elements.pageThreeHeader.classList.toggle('active', onSheetPage);

    body.dataset.page = onCatalogPage ? 'catalog' : onPreparedPage ? 'prepared' : 'sheet';

    if (!onPreparedPage && openEditor === 'mana') {
      setOpenEditor(null);
    }

    if (!onSheetPage && openEditor === 'hp') {
      setOpenEditor(null);
    }
  }

  function renderMainContent() {
    if (state.currentPage === 2) {
      renderCharacterSheet();
      return;
    }

    renderCards();
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

  function renderCharacterSheet() {
    elements.container.innerHTML = '';

    const sheet = createNode('section', { className: 'character-sheet' });
    const columns = createNode('div', { className: 'sheet-columns' });

    ABILITIES.forEach(ability => {
      columns.appendChild(buildAbilityColumn(ability));
    });

    sheet.append(columns, buildAttacksSection(), buildSecondarySection());
    elements.container.appendChild(sheet);
    window.requestAnimationFrame(fitSheetText);
  }

  function buildAbilityColumn(ability) {
    const column = createNode('section', { className: 'ability-column' });
    const skills = createNode('div', { className: 'skill-list' });

    ability.skills.forEach(skillId => {
      skills.appendChild(buildSkillLine(skillId));
    });

    column.append(
      buildFeatureCard(ability),
      buildAbilityCard(ability),
      skills
    );

    return column;
  }

  function buildFeatureCard(ability) {
    const feature = ability.feature;
    const card = createNode('div', { className: `feature-card feature-${feature.kind}` });
    const shape = createNode('div', { className: `feature-shape feature-shape-${feature.kind}` });
    const label = createNode('div', { className: 'feature-label', text: feature.label });
    const valueWrap = createNode('div', { className: 'feature-value-wrap' });

    if (feature.kind === 'heart') {
      valueWrap.appendChild(createNode('div', {
        className: 'feature-display',
        text: `${state.hp.current} / ${state.hp.max}`
      }));
    } else if (feature.kind === 'flame') {
      valueWrap.appendChild(createNode('div', {
        className: 'feature-display',
        text: `${state.mana.current} / ${state.mana.max}`
      }));
    } else {
      const input = document.createElement('input');
      input.className = 'feature-input';
      input.type = feature.inputType;
      input.value = state.sheet.topFields[feature.field] || '';
      input.placeholder = feature.placeholder;
      input.addEventListener('change', event => {
        state.sheet.topFields[feature.field] = sanitizeShortText(event.target.value, 40);
        saveState();
      });
      valueWrap.appendChild(input);
    }

    shape.append(label, valueWrap);
    card.appendChild(shape);
    return card;
  }

  function buildAbilityCard(ability) {
    const abilityState = state.sheet.abilities[ability.id];
    const modifier = getAbilityModifier(abilityState.score);
    const savingThrow = getSavingThrow(ability.id);
    const card = createNode('section', { className: 'ability-card' });
    const header = createNode('div', { className: 'ability-card-header' });
    const title = createNode('h3', { className: 'ability-card-title', text: ability.label });
    const proficiencyToggle = buildProficiencyToggle(abilityState.proficient, `${ability.label} saving throw proficiency`, () => {
      state.sheet.abilities[ability.id].proficient = !state.sheet.abilities[ability.id].proficient;
      render();
    });

    header.append(title, proficiencyToggle);

    const scoreRow = buildValueRow('Score', buildNumberInput(abilityState.score, 0, 30, value => {
      state.sheet.abilities[ability.id].score = clampNumber(parseInt(value, 10), 0, 30, abilityState.score);
      render();
    }));

    const modifierRow = buildValueRow('Modifier', createNode('div', {
      className: 'ability-static',
      text: formatSigned(modifier)
    }));

    const saveRow = buildValueRow('Save', createNode('div', {
      className: 'ability-static',
      text: formatSigned(savingThrow)
    }));

    card.append(header, scoreRow, modifierRow, saveRow);
    return card;
  }

  function buildSkillLine(skillId) {
    const skill = SKILL_MAP[skillId];
    const skillState = state.sheet.skills[skillId];
    const abilityLabel = ABILITY_MAP[skillState.ability].label;
    const line = createNode('div', { className: 'skill-line' });
    line.title = `Double-click to edit ${skill.label}`;
    line.tabIndex = 0;
    line.addEventListener('dblclick', () => openSkillEditor(skillId));
    line.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSkillEditor(skillId);
      }
    });

    const toggle = buildProficiencyToggle(skillState.proficient, `${skill.label} proficiency`, event => {
      event.stopPropagation();
      state.sheet.skills[skillId].proficient = !state.sheet.skills[skillId].proficient;
      render();
    });
    toggle.classList.add('skill-toggle');

    const value = createNode('span', {
      className: 'skill-value',
      text: formatSigned(getSkillValue(skillId))
    });

    const name = createNode('span', { className: 'skill-name', text: skill.label });
    const notes = [];
    if (skillState.ability !== skill.ability) {
      notes.push(abilityLabel);
    }
    if (skillState.expertise && skillState.proficient) {
      notes.push('Expertise');
    }
    if (skillState.misc) {
      notes.push(`${formatSigned(skillState.misc)} misc`);
    }
    const meta = createNode('span', {
      className: 'skill-meta',
      text: notes.join(' | ')
    });

    line.append(toggle, value, name, meta);
    return line;
  }

  function buildAttacksSection() {
    const section = createNode('section', { className: 'sheet-section attacks-section' });
    const heading = createSectionHeading('Attacks', 'Add Attack', () => {
      state.sheet.attacks.push(createAttack());
      render();
    });

    const table = createNode('div', { className: 'attack-table' });
    const header = createNode('div', { className: 'attack-row attack-row-header' });
    ['Name', 'Range', 'to Hit', 'Damage', 'Properties', ''].forEach((label, index) => {
      header.appendChild(createNode('div', {
        className: `attack-cell attack-col-${index + 1}`,
        text: label
      }));
    });
    table.appendChild(header);

    state.sheet.attacks.forEach(attack => {
      table.appendChild(buildAttackRow(attack));
    });

    section.append(heading, table);
    return section;
  }

  function buildAttackRow(attack) {
    const row = createNode('div', { className: 'attack-row' });
    const fields = [
      { key: 'name', type: 'text', value: attack.name },
      { key: 'range', type: 'text', value: attack.range },
      { key: 'toHit', type: 'text', value: attack.toHit },
      { key: 'damage', type: 'text', value: attack.damage },
      { key: 'properties', type: 'text', value: attack.properties }
    ];

    fields.forEach((field, index) => {
      const cell = createNode('div', { className: `attack-cell attack-col-${index + 1}` });
      const input = document.createElement('input');
      input.className = 'attack-input';
      input.type = field.type;
      input.value = field.value;
      input.addEventListener('change', event => {
        updateAttackField(attack.id, field.key, event.target.value);
      });
      cell.appendChild(input);
      row.appendChild(cell);
    });

    const removeCell = createNode('div', { className: 'attack-cell attack-col-6' });
    const removeButton = createNode('button', {
      className: 'sheet-action-button remove-attack-button',
      text: 'Remove'
    });
    removeButton.type = 'button';
    removeButton.addEventListener('click', () => removeAttack(attack.id));
    removeCell.appendChild(removeButton);
    row.appendChild(removeCell);

    return row;
  }

  function buildSecondarySection() {
    const wrapper = createNode('section', { className: 'sheet-secondary' });
    wrapper.append(
      buildProficienciesSection(),
      buildSpeedsSection(),
      buildSensesSection(),
      buildResistancesSection(),
      buildConditionsSection()
    );
    return wrapper;
  }

  function buildProficienciesSection() {
    const section = createNode('section', { className: 'sheet-section' });
    const heading = createNode('div', { className: 'sheet-section-header' });
    const title = createNode('h2', { className: 'sheet-section-title', text: 'Proficiencies' });
    const proficiencyWrap = createNode('label', { className: 'mini-number-field' });
    proficiencyWrap.append(
      createNode('span', { text: 'Proficiency Bonus' }),
      buildNumberInput(state.sheet.proficiencyBonus, 2, 6, value => {
        state.sheet.proficiencyBonus = clampNumber(parseInt(value, 10), 2, 6, state.sheet.proficiencyBonus);
        render();
      }, 'mini-number-input')
    );
    heading.append(title, proficiencyWrap);

    const groups = createNode('div', { className: 'multi-select-grid' });
    PROFICIENCY_GROUPS.forEach(group => {
      groups.appendChild(buildMultiSelectGroup(group));
    });

    section.append(heading, groups);
    return section;
  }

  function buildMultiSelectGroup(group) {
    const details = createNode('details', { className: 'multi-select-group' });
    const summary = createNode('summary', { className: 'multi-select-summary' });
    const summaryLabel = createNode('span', { text: group.label });
    const summaryValue = createNode('span', {
      className: 'multi-select-value',
      text: formatSelectedList(state.sheet.proficiencies[group.id])
    });
    summary.append(summaryLabel, summaryValue);

    const options = createNode('div', { className: 'multi-select-options' });
    [...group.options, ...state.sheet.customOptions[group.id]].forEach(option => {
      const label = createNode('label', { className: 'multi-select-option' });
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state.sheet.proficiencies[group.id].includes(option);
      checkbox.addEventListener('change', event => {
        if (option === 'Other') {
          event.target.checked = false;
          openCustomEntryModal({
            kind: 'proficiency',
            groupId: group.id,
            title: group.label
          });
          return;
        }
        toggleSelection(state.sheet.proficiencies[group.id], option, event.target.checked);
        summaryValue.textContent = formatSelectedList(state.sheet.proficiencies[group.id]);
        saveState();
      });
      label.append(checkbox, createNode('span', { text: option }));
      options.appendChild(label);
    });

    details.append(summary, options);
    return details;
  }

  function buildSpeedsSection() {
    const section = createNode('section', { className: 'sheet-section' });
    section.appendChild(createNode('h2', { className: 'sheet-section-title', text: 'Speeds' }));

    const row = createNode('div', { className: 'speed-grid' });
    SPEED_TYPES.forEach(speed => {
      const field = createNode('label', { className: 'speed-field' });
      field.appendChild(createNode('span', { text: speed.label }));
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.className = 'speed-input';
      input.placeholder = '--';
      input.value = state.sheet.speeds[speed.id];
      input.addEventListener('change', event => {
        state.sheet.speeds[speed.id] = sanitizeOptionalNumber(event.target.value);
        saveState();
        renderCharacterSheet();
      });
      field.appendChild(input);
      row.appendChild(field);
    });

    section.appendChild(row);
    return section;
  }

  function buildSensesSection() {
    const section = createNode('section', { className: 'sheet-section' });
    section.appendChild(createNode('h2', { className: 'sheet-section-title', text: 'Senses' }));

    const rangeDetails = createNode('details', { className: 'multi-select-group' });
    const rangeSummary = createNode('summary', { className: 'multi-select-summary' });
    const rangeSummaryValue = createNode('span', {
      className: 'multi-select-value',
      text: formatSenseRanges()
    });
    rangeSummary.append(createNode('span', { text: 'Range Senses' }), rangeSummaryValue);

    const rangeOptions = createNode('div', { className: 'sense-range-options' });
    const rangeOptionsList = [
      ...SENSE_RANGE_OPTIONS.filter(option => option.id !== 'otherSense'),
      ...state.sheet.senses.customRanges,
      { id: 'otherSense', label: 'Other' }
    ];

    rangeOptionsList.forEach(option => {
      const row = createNode('label', { className: 'sense-range-row' });
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state.sheet.senses.selectedRanges.includes(option.id);
      const number = document.createElement('input');
      number.type = 'number';
      number.min = '0';
      number.className = 'sense-range-input';
      number.placeholder = 'ft';
      number.disabled = !checkbox.checked;
      number.value = state.sheet.senses.ranges[option.id];
      checkbox.addEventListener('change', event => {
        if (option.id === 'otherSense') {
          event.target.checked = false;
          openCustomEntryModal({
            kind: 'senseRange',
            title: 'Range Sense'
          });
          return;
        }
        toggleSelection(state.sheet.senses.selectedRanges, option.id, event.target.checked);
        if (!event.target.checked) {
          state.sheet.senses.ranges[option.id] = '';
          number.value = '';
        }
        number.disabled = !event.target.checked;
        rangeSummaryValue.textContent = formatSenseRanges();
        saveState();
      });
      number.addEventListener('change', event => {
        state.sheet.senses.ranges[option.id] = sanitizeOptionalNumber(event.target.value);
        rangeSummaryValue.textContent = formatSenseRanges();
        saveState();
      });
      row.append(
        checkbox,
        createNode('span', { text: option.label }),
        number
      );
      rangeOptions.appendChild(row);
    });
    rangeDetails.append(rangeSummary, rangeOptions);

    const traitDetails = createNode('details', { className: 'multi-select-group' });
    const traitSummary = createNode('summary', { className: 'multi-select-summary' });
    const traitSummaryValue = createNode('span', {
      className: 'multi-select-value',
      text: formatSelectedList(state.sheet.senses.traits)
    });
    traitSummary.append(createNode('span', { text: 'Sense Traits' }), traitSummaryValue);

    const traitOptions = createNode('div', { className: 'multi-select-options' });
    [...SENSE_TRAITS, ...state.sheet.senses.customTraits].forEach(trait => {
      const label = createNode('label', { className: 'multi-select-option' });
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state.sheet.senses.traits.includes(trait);
      checkbox.addEventListener('change', event => {
        if (trait === 'Other') {
          event.target.checked = false;
          openCustomEntryModal({
            kind: 'senseTrait',
            title: 'Sense Trait'
          });
          return;
        }
        toggleSelection(state.sheet.senses.traits, trait, event.target.checked);
        traitSummaryValue.textContent = formatSelectedList(state.sheet.senses.traits);
        saveState();
      });
      label.append(checkbox, createNode('span', { text: trait }));
      traitOptions.appendChild(label);
    });
    traitDetails.append(traitSummary, traitOptions);

    section.append(rangeDetails, traitDetails);
    return section;
  }

  function buildResistancesSection() {
    const section = createNode('section', { className: 'sheet-section' });
    section.appendChild(createNode('h2', { className: 'sheet-section-title', text: 'Resistances' }));

    RESISTANCE_BLOCKS.forEach(block => {
      const blockNode = createNode('div', { className: 'resistance-block' });
      blockNode.appendChild(createNode('h3', { className: 'resistance-block-title', text: block.title }));
      const chips = createNode('div', { className: 'resistance-chip-grid' });

      if (block.id === 'physical') {
        ['bludgeoning', 'piercing', 'slashing'].forEach(itemId => {
          chips.appendChild(buildResistanceChip(itemId));
        });
        chips.appendChild(buildBleedAugmentGroup());
      } else {
        block.items.forEach(itemId => {
          chips.appendChild(buildResistanceChip(itemId));
        });
      }

      blockNode.appendChild(chips);
      section.appendChild(blockNode);
    });

    return section;
  }

  function buildBleedAugmentGroup() {
    const group = createNode('div', { className: 'bleed-augment-group' });
    const bleedChip = buildResistanceChip('bleed');
    group.appendChild(bleedChip);

    const bleedStatus = state.sheet.resistances.statuses.bleed;
    const points = createNode('div', {
      className: `resistance-chip resistance-chip-custom resistance-${bleedStatus}`
    });
    points.style.color = RESISTANCE_META[bleedStatus].color;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.className = 'resistance-custom-input';
    input.value = state.sheet.resistances.bleedPoints;
    input.placeholder = 'Bleed Points';
    input.addEventListener('change', event => {
      state.sheet.resistances.bleedPoints = sanitizeOptionalNumber(event.target.value);
      saveState();
    });
    points.appendChild(input);
    group.appendChild(points);
    return group;
  }

  function buildResistanceChip(itemId) {
    const status = state.sheet.resistances.statuses[itemId];
    const chip = createNode('button', {
      className: `resistance-chip resistance-${status}`
    });
    chip.type = 'button';
    chip.addEventListener('dblclick', () => openResistanceEditor(itemId));

    chip.textContent = RESISTANCE_LABELS[itemId];

    chip.style.color = RESISTANCE_META[status].color;
    chip.title = 'Double-click to set resistance state';
    return chip;
  }

  function buildConditionsSection() {
    const section = createNode('section', { className: 'sheet-section conditions-section' });
    section.appendChild(createNode('h2', { className: 'sheet-section-title', text: 'Conditions' }));

    const grid = createNode('div', { className: 'conditions-grid' });
    CONDITIONS.forEach(condition => {
      const label = createNode('label', { className: 'condition-toggle' });
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = state.sheet.conditions.toggles[condition.id];
      checkbox.addEventListener('change', event => {
        state.sheet.conditions.toggles[condition.id] = event.target.checked;
        render();
      });
      label.append(checkbox, createNode('span', { text: condition.label }));
      grid.appendChild(label);
    });

    const variables = createNode('div', { className: 'condition-level-grid' });
    variables.appendChild(buildConditionLevelControl('Exhaustion', state.sheet.conditions.exhaustion, 0, 6, delta => {
      state.sheet.conditions.exhaustion = clampNumber(state.sheet.conditions.exhaustion + delta, 0, 6, state.sheet.conditions.exhaustion);
      render();
    }));
    variables.appendChild(buildConditionLevelControl('Mortality', state.sheet.conditions.mortality, 0, 3, delta => {
      state.sheet.conditions.mortality = clampNumber(state.sheet.conditions.mortality + delta, 0, 3, state.sheet.conditions.mortality);
      render();
    }));

    section.append(grid, variables);
    return section;
  }

  function buildConditionLevelControl(label, value, min, max, onDelta) {
    const control = createNode('div', { className: 'condition-level-control' });
    const title = createNode('span', { className: 'condition-level-title', text: label });
    const row = createNode('div', { className: 'condition-level-row' });
    const minus = createNode('button', { className: 'sheet-icon-button', text: '-' });
    minus.type = 'button';
    minus.disabled = value <= min;
    minus.addEventListener('click', () => onDelta(-1));

    const display = createNode('div', { className: 'condition-level-value', text: String(value) });

    const plus = createNode('button', { className: 'sheet-icon-button', text: '+' });
    plus.type = 'button';
    plus.disabled = value >= max;
    plus.addEventListener('click', () => onDelta(1));

    row.append(minus, display, plus);
    control.append(title, row);
    return control;
  }

  function createSectionHeading(titleText, buttonText, onClick) {
    const heading = createNode('div', { className: 'sheet-section-header' });
    const title = createNode('h2', { className: 'sheet-section-title', text: titleText });
    const button = createNode('button', { className: 'sheet-action-button', text: buttonText });
    button.type = 'button';
    button.addEventListener('click', onClick);
    heading.append(title, button);
    return heading;
  }

  function buildValueRow(labelText, valueNode) {
    const row = createNode('div', { className: 'ability-row' });
    const label = createNode('span', { className: 'ability-row-label', text: labelText });
    row.append(label, valueNode);
    return row;
  }

  function buildProficiencyToggle(isActive, labelText, onClick) {
    const button = createNode('button', { className: 'proficiency-toggle-button' });
    button.type = 'button';
    button.setAttribute('aria-pressed', String(isActive));
    button.setAttribute('aria-label', labelText);
    button.classList.toggle('is-active', isActive);
    button.addEventListener('click', onClick);
    return button;
  }

  function buildNumberInput(value, min, max, onChange, className = 'ability-score-input') {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = className;
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.addEventListener('change', event => onChange(event.target.value));
    return input;
  }

  function createNode(tagName, options = {}) {
    const node = document.createElement(tagName);
    if (options.className) {
      node.className = options.className;
    }
    if (options.text !== undefined) {
      node.textContent = options.text;
    }
    return node;
  }

  function fitSheetText() {
    if (state.currentPage !== 2) {
      return;
    }

    fitTextCollection('.ability-card-title', 7.4);
    fitTextCollection('.skill-name', 7.2);
  }

  function fitTextCollection(selector, minFontSizePx) {
    elements.container.querySelectorAll(selector).forEach(node => {
      node.style.fontSize = '';
      node.style.letterSpacing = '';

      let fontSize = parseFloat(window.getComputedStyle(node).fontSize);
      while (node.scrollWidth > node.clientWidth && fontSize > minFontSizePx) {
        fontSize -= 0.2;
        node.style.fontSize = `${fontSize}px`;
      }

      if (node.scrollWidth > node.clientWidth) {
        node.style.letterSpacing = '0.01em';
      }
    });
  }

  function updateAttackField(attackId, field, value) {
    const attack = state.sheet.attacks.find(item => item.id === attackId);
    if (!attack) {
      return;
    }
    attack[field] = sanitizeShortText(value, field === 'properties' ? 240 : 80);
    saveState();
  }

  function removeAttack(attackId) {
    state.sheet.attacks = state.sheet.attacks.filter(attack => attack.id !== attackId);
    if (!state.sheet.attacks.length) {
      state.sheet.attacks = [createAttack()];
    }
    render();
  }

  function toggleSelection(collection, value, shouldInclude) {
    const set = new Set(collection);
    if (shouldInclude) {
      set.add(value);
    } else {
      set.delete(value);
    }
    collection.splice(0, collection.length, ...set);
  }

  function formatSelectedList(values) {
    return values.length ? values.join(', ') : 'None';
  }

  function formatSenseRanges() {
    const parts = state.sheet.senses.selectedRanges.map(optionId => {
      const option = SENSE_RANGE_OPTIONS.find(item => item.id === optionId)
        || state.sheet.senses.customRanges.find(item => item.id === optionId);
      const distance = state.sheet.senses.ranges[optionId];
      return distance ? `${option.label} ${distance}'` : option.label;
    });
    return parts.length ? parts.join(', ') : 'None';
  }

  function openTempHpModal() {
    modalState = {
      type: 'tempHp',
      value: state.hp.temp
    };
    renderModal();
  }

  function openSkillEditor(skillId) {
    const skillState = state.sheet.skills[skillId];
    modalState = {
      type: 'skill',
      skillId,
      ability: skillState.ability,
      expertise: skillState.expertise,
      misc: skillState.misc
    };
    renderModal();
  }

  function openResistanceEditor(resistanceId) {
    modalState = {
      type: 'resistance',
      resistanceId,
      status: state.sheet.resistances.statuses[resistanceId]
    };
    renderModal();
  }

  function openCustomEntryModal(config) {
    modalState = {
      type: 'customEntry',
      ...config
    };
    renderModal();
  }

  function closeModal() {
    if (!modalState) {
      return;
    }
    modalState = null;
    renderModal();
  }

  function renderModal() {
    elements.sheetModalBody.innerHTML = '';
    elements.sheetModalActions.innerHTML = '';

    if (!modalState) {
      elements.sheetModal.hidden = true;
      return;
    }

    elements.sheetModal.hidden = false;

    if (modalState.type === 'tempHp') {
      renderTempHpModal();
    } else if (modalState.type === 'skill') {
      renderSkillModal();
    } else if (modalState.type === 'customEntry') {
      renderCustomEntryModal();
    } else if (modalState.type === 'resistance') {
      renderResistanceModal();
    }
  }

  function renderCustomEntryModal() {
    elements.sheetModalTitle.textContent = `Define ${modalState.title}`;

    const field = createNode('label', { className: 'modal-field' });
    field.appendChild(createNode('span', { text: 'Custom label' }));
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'modal-input';
    input.placeholder = 'Enter a custom name';
    input.dataset.autofocus = 'true';
    field.appendChild(input);
    elements.sheetModalBody.appendChild(field);

    elements.sheetModalActions.append(
      buildModalButton('Cancel', closeModal),
      buildModalButton('Add', () => {
        const value = sanitizeShortText(input.value, 40).trim();
        if (!value) {
          return;
        }

        if (modalState.kind === 'proficiency') {
          toggleSelection(state.sheet.customOptions[modalState.groupId], value, true);
          toggleSelection(state.sheet.proficiencies[modalState.groupId], value, true);
        } else if (modalState.kind === 'senseTrait') {
          toggleSelection(state.sheet.senses.customTraits, value, true);
          toggleSelection(state.sheet.senses.traits, value, true);
        } else if (modalState.kind === 'senseRange') {
          const id = `custom-range-${Date.now()}`;
          state.sheet.senses.customRanges.push({ id, label: value });
          state.sheet.senses.ranges[id] = '';
          toggleSelection(state.sheet.senses.selectedRanges, id, true);
        }

        closeModal();
        render();
      }, true)
    );

    focusModalInput();
  }

  function renderTempHpModal() {
    elements.sheetModalTitle.textContent = 'Temp HP';

    const field = createNode('label', { className: 'modal-field' });
    field.appendChild(createNode('span', { text: 'Set temporary hit points' }));

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.value = String(modalState.value);
    input.className = 'modal-input';
    input.dataset.autofocus = 'true';
    field.appendChild(input);
    elements.sheetModalBody.appendChild(field);

    elements.sheetModalActions.append(
      buildModalButton('Cancel', closeModal),
      buildModalButton('Apply', () => {
        state.hp.temp = clampNumber(parseInt(input.value, 10), 0, 999, state.hp.temp);
        closeModal();
        render();
      }, true)
    );

    focusModalInput();
  }

  function renderSkillModal() {
    const skill = SKILL_MAP[modalState.skillId];
    elements.sheetModalTitle.textContent = skill.label;

    const abilityField = createNode('label', { className: 'modal-field' });
    abilityField.appendChild(createNode('span', { text: 'Ability Score' }));
    const select = document.createElement('select');
    select.className = 'modal-input';
    ABILITIES.forEach(ability => {
      const option = document.createElement('option');
      option.value = ability.id;
      option.textContent = ability.label;
      option.selected = ability.id === modalState.ability;
      select.appendChild(option);
    });
    select.dataset.autofocus = 'true';
    abilityField.appendChild(select);

    const expertiseLabel = createNode('label', { className: 'modal-checkbox' });
    const expertise = document.createElement('input');
    expertise.type = 'checkbox';
    expertise.checked = modalState.expertise;
    expertiseLabel.append(expertise, createNode('span', { text: 'Expertise' }));

    const miscField = createNode('label', { className: 'modal-field' });
    miscField.appendChild(createNode('span', { text: 'Misc. Bonus' }));
    const miscInput = document.createElement('input');
    miscInput.type = 'number';
    miscInput.min = '-99';
    miscInput.max = '99';
    miscInput.className = 'modal-input';
    miscInput.value = String(modalState.misc);
    miscField.appendChild(miscInput);

    elements.sheetModalBody.append(abilityField, expertiseLabel, miscField);
    elements.sheetModalActions.append(
      buildModalButton('Cancel', closeModal),
      buildModalButton('Save', () => {
        state.sheet.skills[modalState.skillId].ability = select.value;
        state.sheet.skills[modalState.skillId].expertise = expertise.checked;
        state.sheet.skills[modalState.skillId].misc = clampNumber(parseInt(miscInput.value, 10), -99, 99, 0);
        closeModal();
        render();
      }, true)
    );

    focusModalInput();
  }

  function renderResistanceModal() {
    const label = RESISTANCE_LABELS[modalState.resistanceId];
    elements.sheetModalTitle.textContent = label;

    const statuses = createNode('div', { className: 'resistance-modal-options' });
    Object.entries(RESISTANCE_META).forEach(([statusKey, meta]) => {
      const option = createNode('label', { className: 'resistance-modal-option' });
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'resistanceStatus';
      radio.value = statusKey;
      radio.checked = modalState.status === statusKey;
      option.style.color = meta.color;
      option.append(radio, createNode('span', { text: meta.label }));
      statuses.appendChild(option);
    });
    elements.sheetModalBody.appendChild(statuses);

    elements.sheetModalActions.append(
      buildModalButton('Cancel', closeModal),
      buildModalButton('Save', () => {
        const selected = elements.sheetModalBody.querySelector('input[name="resistanceStatus"]:checked');
        state.sheet.resistances.statuses[modalState.resistanceId] = selected ? selected.value : 'none';
        closeModal();
        render();
      }, true)
    );

    focusModalInput();
  }

  function buildModalButton(text, onClick, primary = false) {
    const button = createNode('button', {
      className: `sheet-action-button${primary ? ' is-primary' : ''}`,
      text
    });
    button.type = 'button';
    button.addEventListener('click', onClick);
    return button;
  }

  function focusModalInput() {
    window.requestAnimationFrame(() => {
      const target = elements.sheetModal.querySelector('[data-autofocus="true"]');
      if (target) {
        target.focus();
        if (typeof target.select === 'function') {
          target.select();
        }
      }
    });
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

  function drinkHealthPotion() {
    const restored = Math.floor(Math.random() * 4) + 2;
    adjustHp(restored);
    render();
  }

  function takeShortRest() {
    const dieValue = Number(state.hp.shortRestDie.replace('d', '')) || 8;
    const restored = Math.max(0, Math.floor(Math.random() * dieValue) + 1 + getAbilityModifier(state.sheet.abilities.constitution.score));
    adjustHp(restored);
    render();
  }

  function longRest() {
    state.mana.current = state.mana.max;
    state.hp.current = state.hp.max;
    state.hp.temp = 0;
    state.sheet.conditions.exhaustion = clampNumber(state.sheet.conditions.exhaustion - 1, 0, 6, 0);
    state.sheet.conditions.mortality = clampNumber(state.sheet.conditions.mortality - 1, 0, 3, 0);
    render();
  }

  function adjustManualTicker(delta) {
    state.hp.manualAdjust = clampNumber(state.hp.manualAdjust + delta, 0, 999, state.hp.manualAdjust);
    render();
  }

  function applyManualHpAdjustment(direction) {
    const amount = state.hp.manualAdjust * direction;
    adjustHp(amount);
    render();
  }

  function adjustHp(amount) {
    if (amount >= 0) {
      state.hp.current = clampNumber(state.hp.current + amount, 0, state.hp.max, state.hp.current);
      return;
    }

    let remainingDamage = Math.abs(amount);
    const absorbed = Math.min(state.hp.temp, remainingDamage);
    state.hp.temp -= absorbed;
    remainingDamage -= absorbed;
    state.hp.current = clampNumber(state.hp.current - remainingDamage, 0, state.hp.max, state.hp.current);
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

  function buildHpSparkles() {
    const colors = CONDITIONS
      .filter(condition => state.sheet.conditions.toggles[condition.id])
      .map(condition => condition.color);

    if (!colors.length) {
      return 'none';
    }

    return colors.map((color, index) => {
      const x = 10 + (index * 19) % 82;
      const y = 25 + (index * 17) % 50;
      return `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.95) 0%, ${hexToRgba(color, 0.72)} 5%, transparent 12%)`;
    }).join(', ');
  }

  function applyManaTexture(node, visuals) {
    const fill = `${visuals.sparkles}, ${visuals.marble}, ${visuals.spectrum}`;
    node.style.setProperty('--mana-spectrum', visuals.spectrum);
    node.style.setProperty('--mana-marble', visuals.marble);
    node.style.setProperty('--mana-sparkles', visuals.sparkles);
    node.style.setProperty('--hold-fill', fill);
  }

  function applyHpTexture(node) {
    node.style.setProperty('--hold-fill', [
      'radial-gradient(circle at 20% 35%, rgba(255, 255, 255, 0.42) 0%, transparent 18%)',
      'radial-gradient(circle at 80% 60%, rgba(255, 255, 255, 0.18) 0%, transparent 14%)',
      'linear-gradient(135deg, rgba(255, 92, 92, 0.96), rgba(163, 0, 0, 0.96))'
    ].join(', '));
  }

  function renderManaHud() {
    const ratio = state.mana.max ? state.mana.current / state.mana.max : 0;
    const visuals = buildManaVisuals();

    elements.manaReadout.textContent = `Mana ${state.mana.current}/${state.mana.max}`;
    elements.manaBarFill.style.setProperty('--mana-fill-ratio', String(ratio));
    applyManaTexture(elements.manaBarFill, visuals);
    applyManaTexture(elements.longRestButton, visuals);
    applyManaTexture(elements.manaPotionButton, visuals);
    elements.manaLongRestTallies.textContent = '|'.repeat(state.sheet.conditions.exhaustion);
  }

  function renderHpHud() {
    const hpRatio = state.hp.max ? state.hp.current / state.hp.max : 0;
    const tempRatio = state.hp.max ? Math.min(state.hp.temp / state.hp.max, 1) : 0;
    const sparkles = buildHpSparkles();
    const chaosCount = CONDITIONS.filter(condition => state.sheet.conditions.toggles[condition.id]).length;

    elements.hpReadout.textContent = `Hitpoints ${state.hp.current}/${state.hp.max}`;
    elements.tempHpValue.textContent = String(state.hp.temp);
    elements.shortRestSummary.textContent = `${state.hp.shortRestDie.toUpperCase()} + CON`;
    elements.hpBarFill.style.setProperty('--hp-fill-ratio', String(hpRatio));
    elements.hpTempOverlay.style.setProperty('--hp-temp-ratio', String(tempRatio));
    elements.hpTempOverlay.hidden = state.hp.temp <= 0;
    elements.hpConditionSparkles.style.setProperty('--hp-condition-sparkles', sparkles);
    elements.hpConditionSparkles.style.setProperty('--condition-chaos', String(Math.max(1, chaosCount)));
    elements.hpConditionSparkles.hidden = sparkles === 'none';
    elements.hpMortalityMarks.textContent = Array.from(
      { length: state.sheet.conditions.mortality },
      () => '☠'
    ).join(' ');
    elements.hpLongRestTallies.textContent = '|'.repeat(state.sheet.conditions.exhaustion);

    applyHpTexture(elements.healthPotionButton);
    applyHpTexture(elements.shortRestButton);
    applyHpTexture(elements.hpLongRestButton);
    applyHpTexture(elements.hpAdjustMinusButton);
    applyHpTexture(elements.hpAdjustPlusButton);
  }

  function getAbilityModifier(score) {
    return Math.floor((score - 10) / 2);
  }

  function getSavingThrow(abilityId) {
    const ability = state.sheet.abilities[abilityId];
    const modifier = getAbilityModifier(ability.score);
    return modifier + (ability.proficient ? state.sheet.proficiencyBonus : 0);
  }

  function getSkillValue(skillId) {
    const skill = state.sheet.skills[skillId];
    const modifier = getAbilityModifier(state.sheet.abilities[skill.ability].score);
    const proficiency = skill.proficient
      ? state.sheet.proficiencyBonus * (skill.expertise ? 2 : 1)
      : 0;
    return modifier + proficiency + skill.misc;
  }
})();
