(async () => {
  // load the glyph data
  const res = await fetch('data/glyphs.json');
  const glyphs = await res.json();

  // grab our controls & container
  const levelFilter   = document.getElementById('levelFilter');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  // 1) Populate level dropdown with "All Glyphs" + "Tier X"
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

  // 2) Build the school filter buttons (toggle-style)
const schools = ['Harmony','Elemental','Celestial','Nature','Arcane','Mind','Chaos','Bane'];
const schoolBtns = {};  // keep references to each button

schools.forEach(s => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'school-button';
  btn.textContent = s;
  schoolFilters.appendChild(btn);

  // store for filter logic
  schoolBtns[s] = btn;

  // toggle active state on click and re-render
  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    render();
  });
});


  // 3) The render function: filter & draw cards
  function render() {
    const levelVal      = levelFilter.value;
// collect which schools are “active” via button .active
const activeSchools = schools.filter(s =>
  schoolBtns[s].classList.contains('active')
);
// if none are active, show all
if (activeSchools.length === 0) {
  activeSchools.push(...schools);
}
    const q             = searchInput.value.toLowerCase();
    const inDetails     = searchToggle.checked;

    container.innerHTML = '';

    glyphs
      .filter(g => {
        // level filter
        if (levelVal !== 'all' && +g.Tier !== +levelVal) return false;
        // school filter (only when at least one box is checked)
        if (activeSchools.length > 0 && !activeSchools.includes(g.School)) return false;
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
        // create card
        const card = document.createElement('div');
        card.className = 'card';

        // create header
        const header = document.createElement('div');
        header.className = 'card-header';

        // info: only the Name
        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `<b>${g.Name}</b>`;

        // meta: School, V/S, Tier & Mana
        const vsLabel = g.V ? 'V' : g.S ? 'S' : '';
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `
          ${g.School}
          <span class="vs">${vsLabel}</span>
          • Tier ${g.Tier}
          • ${g.Points} Mana
        `;

        // assemble header
        header.appendChild(info);
        header.appendChild(meta);
        card.appendChild(header);

        // create body
        const body = document.createElement('div');
        body.className = 'card-body';
        body.style.display = 'none';  // start collapsed

        // body contents
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

        // toggle open/close & card opacity
        header.addEventListener('click', () => {
          const isOpen = body.style.display === 'block';
          body.style.display = isOpen ? 'none' : 'block';
          card.classList.toggle('open', !isOpen);
        });

        // add to container
        container.appendChild(card);
      });
  }

  // 4) Attach render to all inputs
  [
    levelFilter,
    searchInput,
    searchToggle,
    ...Array.from(schoolFilters.querySelectorAll('input'))
  ].forEach(el => el.addEventListener('input', render));

  // 5) initial draw
  render();
})();
