/*  ── glyph-database front-end ──  */

;(async () => {
  /* always bypass cache */
  const res = await fetch(`data/glyphs.json?ts=${Date.now()}`, { cache:'no-store' });
  if (!res.ok) { console.error('glyphs.json load-error', res.status); return; }
  const glyphs = await res.json();

  /* controls */
  const levelFilter   = document.getElementById('levelFilter');
  const upToToggle    = document.getElementById('tierUpTo');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  /* tier drop-down 0-12 */
  for (let i = 0; i <= 12; i++) {
    const o = document.createElement('option');
    o.value = i; o.textContent = `Tier ${i}`; levelFilter.appendChild(o);
  }
  levelFilter.value = 'all';

  /* school buttons */
  const schools = ['Harmony','Elemental','Celestial','Nature','Arcane','Mind','Chaos','Bane'];
  const schoolBtns = {};
  schools.forEach(s => {
    const b = document.createElement('button');
    b.className='school-button'; b.textContent=s;
    b.onclick = () => { b.classList.toggle('active'); render(); };
    schoolFilters.appendChild(b); schoolBtns[s]=b;
  });

  /* helper → robust key lookup (“ Name ”, “name”, etc.) */
  const get = (obj, wanted) => {
    wanted = wanted.toLowerCase().trim();
    const k = Object.keys(obj).find(k=>k.toLowerCase().trim()===wanted);
    return k ? obj[k] : undefined;
  };

  /* build one glyph card */
  function card(g){
    const name   = get(g,'Name')   ?? '';
    const school = get(g,'School') ?? '';
    const tier   = +get(g,'Tier')  || 0;
    const mana   =  get(g,'Points')|| 0;

    const card = document.createElement('div'); card.className='card';
    /* header */
    const head = document.createElement('div'); head.className='card-header';
    const info = document.createElement('div');
    info.className = `info school-${school.toLowerCase()}`;
    info.innerHTML = `<b>${name}</b>`;
    const vs = get(g,'V') ? 'V' : get(g,'S') ? 'S' : '';
    const meta = document.createElement('div'); meta.className='meta';
    meta.innerHTML = `${school}<span class="vs">${vs}</span> • Tier ${tier} • ${mana} Mana`;
    head.append(info,meta); card.appendChild(head);

    /* body */
    const body = document.createElement('div'); body.className='card-body';
    body.style.display='none';
    body.innerHTML = `
      <p>Casting Time: ${get(g,'Casting Time')}</p>
      <p>Range: ${get(g,'Range')}</p>
      <p>Duration: ${get(g,'Duration')}${get(g,'Concentration')?' (Concentration)':''}</p>
      <p>${get(g,'New Text')}</p><hr><p>${get(g,'Higher Tiers')}</p>`;
    head.onclick = () => {
      const open = body.style.display==='block';
      body.style.display=open?'none':'block';
      card.classList.toggle('open',!open);
    };
    card.appendChild(body);
    container.appendChild(card);
  }

  /* render all cards based on filters */
  function render(){
    const tierSel = levelFilter.value, tierNum = +tierSel, upTo = upToToggle.checked;
    const activeSchools = Object.entries(schoolBtns)
      .filter(([_,b])=>b.classList.contains('active')).map(([s])=>s);
    const q = searchInput.value.trim().toLowerCase(), deep = searchToggle.checked;

    container.innerHTML='';
    glyphs.filter(g=>{
      const tier = +get(g,'Tier')||0; const school=get(g,'School')||'';
      if(tierSel!=='all' && (upTo?tier>tierNum:tier!==tierNum)) return false;
      if(activeSchools.length && !activeSchools.includes(school)) return false;
      if(q){
        const hay = (get(g,'Name')||'').toLowerCase();
        if(hay.includes(q)) return true;
        if(deep && Object.values(g).some(v=>String(v).toLowerCase().includes(q))) return true;
        return false;
      }
      return true;
    }).forEach(card);
  }

  /* events */
  [levelFilter,upToToggle,searchInput,searchToggle].forEach(e=>e.oninput=render);
  render();
})();
