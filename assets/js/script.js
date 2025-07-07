(async () => {
  const res = await fetch('data/glyphs.json');
  const glyphs = await res.json();

  const levelFilter = document.getElementById('levelFilter');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput = document.getElementById('search');
  const searchToggle = document.getElementById('searchTextToggle');
  const container = document.getElementById('cardsContainer');

  // Populate level dropdown with "Tier X"
const allOpt = document.createElement('option');
allOpt.value = 'all';
allOpt.textContent = 'All Glyphs';
levelFilter.appendChild(allOpt);

for (let i = 0; i <= 12; i++) {
  const opt = document.createElement('option');
  opt.value = i;                  // still filters by the numeric value
  opt.textContent = `Tier ${i}`;  // now reads "Tier 0", "Tier 1", …
  levelFilter.appendChild(opt);
}
  // Schools list
  const schools = ['Harmony','Elemental','Celestial','Nature','Arcane','Mind','Chaos','Bane'];
  schools.forEach(s => {
    const id = `sch-${s}`;
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" id="${id}" /> ${s}`;
    schoolFilters.appendChild(label);
  });

  function render() {
    const levelVal = levelFilter.value;
    const activeSchools = schools.filter(s => document.getElementById(`sch-${s}`).checked);
    const q = searchInput.value.toLowerCase();
    const inDetails = searchToggle.checked;

    container.innerHTML = '';
    glyphs.filter(g => {
      if (levelVal !== 'all' && +g.Tier !== +levelVal) return false;
      if (activeSchools.length > 0 && !activeSchools.includes(g.School)) return false;
      if (q) {
        if (g.Name.toLowerCase().includes(q)) return true;
        if (inDetails && Object.values(g).some(v => String(v).toLowerCase().includes(q))) return true;
        return false;
      }
      return true;
    }).forEach(g => {
      const card = document.createElement('div'); card.className = 'card';
      const header = document.createElement('div'); header.className = 'card-header';
      // build name/school/vs
  const info = document.createElement('div');
  info.className = 'info';

  // pick V or S, wrap in its own <span> for styling
  const vsLabel = g.V ? 'V' : g.S ? 'S' : '';
  info.innerHTML = `
    <b>${g.Name}</b>
    ${g.School}
    <span class="vs">${vsLabel}</span>
  `;

  // build tier & mana text
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `Tier ${g.Tier} • ${g.Points} Mana`;

      header.appendChild(info);
      header.appendChild(meta);
      card.appendChild(header);

      const body = document.createElement('div'); body.className = 'card-body';
      const ct = document.createElement('p'); ct.textContent = `Casting Time: ${g['Casting Time']}`;
      const dur = document.createElement('p');
      dur.textContent = `Duration: ${g.Duration}${g.Concentration === true ? ' (Concentration)' : ''}`;
      const txt = document.createElement('p'); txt.textContent = g['New Text'];
      const hr = document.createElement('hr');
      const high = document.createElement('p'); high.textContent = g['Higher Tiers'];

      body.append(ct, dur, txt, hr, high);
      card.appendChild(body);

    header.addEventListener('click', () => {
  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  card.classList.toggle('open', !isOpen);
});
      container.appendChild(card);
    });
  }

  [levelFilter, searchInput, searchToggle, ...Array.from(schoolFilters.querySelectorAll('input'))]
    .forEach(el => el.addEventListener('input', render));

  render();
})();