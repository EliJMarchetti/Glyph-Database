// … inside your render().forEach(g => { … })

// create card
const card = document.createElement('div');
card.className = 'card';

// header
const header = document.createElement('div');
header.className = 'card-header';

// → Name  
const info = document.createElement('div');
info.className = 'info';
info.innerHTML = `<b>${g.Name}</b>`;

// → Meta (School, V/S, Tier & Mana)
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

// body
const body = document.createElement('div');
body.className = 'card-body';
body.style.display = 'none';

// 1) Casting Time
const ct = document.createElement('p');
ct.textContent = `Casting Time: ${g['Casting Time']}`;

// 2) Range (only if you have a non-empty Range column)
let rangeElem = null;
if (g.Range && String(g.Range).trim() !== '') {
  rangeElem = document.createElement('p');
  rangeElem.textContent = `Range: ${g.Range}`;
}

// 3) Duration (+ Concentration)
const dur = document.createElement('p');
dur.textContent = `Duration: ${g.Duration}${g.Concentration ? ' (Concentration)' : ''}`;

// 4) Main Text
const txt = document.createElement('p');
txt.textContent = g['New Text'];

// 5) Higher Tiers
const hr = document.createElement('hr');
const high = document.createElement('p');
high.textContent = g['Higher Tiers'];

// assemble body in the right order
body.append(ct);
if (rangeElem) body.append(rangeElem);
body.append(dur, txt, hr, high);

card.appendChild(body);

// toggle on header click
header.addEventListener('click', () => {
  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  card.classList.toggle('open', !isOpen);
});

container.appendChild(card);

// … end of forEach(g) …
