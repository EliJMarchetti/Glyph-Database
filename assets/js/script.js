// assets/js/script.js

(async function() {
  //
  // 0) ADMIN MODE SETUP
  //
  let octokit, repoInfo;
  try {
    // Grab the global Octokit constructor (from the UMD build)
    const OctokitClass = window.Octokit;
    let token = localStorage.getItem('gh_token');
    if (!token) {
      token = prompt('🔑 Enter your GitHub Personal Access Token:');
      if (token) localStorage.setItem('gh_token', token);
    }
    if (token && OctokitClass) {
      octokit = new OctokitClass({ auth: token });
      repoInfo = {
        owner: 'EliJMarchetti',
        repo:  'Glyph-Database',
        path:  'data/glyphs.json'
      };
    }
  } catch (err) {
    console.warn('⚠️ Admin Mode disabled:', err);
  }

  //
  // 1) LOAD GLYPH DATA
  //
  const res    = await fetch('data/glyphs.json');
  const glyphs = await res.json();

  //
  // 2) GRAB CONTROLS
  //
  const levelFilter   = document.getElementById('levelFilter');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  //
  // 3) POPULATE TIER DROPDOWN
  //
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

  //
  // 4) BUILD SCHOOL FILTER BUTTONS
  //
  const schools    = ['Harmony','Elemental','Celestial','Nature','Arcane','Mind','Chaos','Bane'];
  const schoolBtns = {};
  schools.forEach(s => {
    const btn = document.createElement('button');
    btn.type      = 'button';
    btn.className = 'school-button';
    btn.textContent = s;
    schoolFilters.appendChild(btn);
    schoolBtns[s] = btn;
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      render();
    });
  });

  //
  // 5) RENDER FUNCTION
  //
  function render() {
    const levelVal      = levelFilter.value;
    let activeSchools   = schools.filter(s => schoolBtns[s].classList.contains('active'));
    if (activeSchools.length === 0) activeSchools = [...schools];

    const q             = searchInput.value.toLowerCase();
    const inDetails     = searchToggle.checked;

    container.innerHTML = '';
    glyphs
      .filter(g => {
        if (levelVal !== 'all' && +g.Tier !== +levelVal) return false;
        if (!activeSchools.includes(g.School))             return false;
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
        const card   = document.createElement('div');    card.className = 'card';
        const header = document.createElement('div');    header.className = 'card-header';

        // Name
        const info    = document.createElement('div');    info.className = 'info';
        info.innerHTML = `<b>${g.Name}</b>`;

        // Meta
        const vsLabel = g.V ? 'V' : g.S ? 'S' : '';
        const meta    = document.createElement('div');    meta.className = 'meta';
        meta.innerHTML = `
          ${g.School}
          <span class="vs">${vsLabel}</span>
          • Tier ${g.Tier}
          • ${g.Points} Mana
        `;

        header.append(info, meta);
        card.append(header);

        // Body
        const body = document.createElement('div');      body.className = 'card-body';
        body.style.display = 'none';
        const ct  = document.createElement('p');         ct.textContent = `Casting Time: ${g['Casting Time']}`;
        const dur = document.createElement('p');         dur.textContent = `Duration: ${g.Duration}${g.Concentration ? ' (Concentration)' : ''}`;
        const txt = document.createElement('p');         txt.textContent = g['New Text'];
        const hr  = document.createElement('hr');
        const high= document.createElement('p');         high.textContent = g['Higher Tiers'];
        body.append(ct, dur, txt, hr, high);

        header.addEventListener('click', () => {
          const isOpen = body.style.display === 'block';
          body.style.display = isOpen ? 'none' : 'block';
          card.classList.toggle('open', !isOpen);
        });

        card.append(body);
        container.append(card);
      });
  }

  //
  // 6) HOOK UP FILTERS
  //
  levelFilter.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);
  Object.values(schoolBtns).forEach(btn => btn.addEventListener('click', render));

  //
  // 7) INITIAL DRAW
  //
  render();

  //
  // 8) MOBILE HEADER TOGGLE (unchanged)
  //
  if (window.innerWidth < 768) {
    const headerEl = document.querySelector('header');
    const toggle   = document.getElementById('mobileHeaderToggle');
    document.body.classList.remove('collapsed');
    function setOffset() {
      container.style.marginTop = headerEl.offsetHeight + 'px';
    }
    setOffset();
    window.addEventListener('resize', setOffset);
    toggle.addEventListener('click', () => {
      const collapsed = document.body.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▲' : '▼';
      container.style.marginTop = collapsed ? '0' : headerEl.offsetHeight + 'px';
    });
  }

  //
  // 9) ADMIN MODE: toggle & save via Octokit
  //
  const enterBtn = document.getElementById('enterAdmin');
  const saveBtn  = document.getElementById('saveAdmin');
  let   isAdmin  = false;

  enterBtn.addEventListener('click', () => {
    if (!octokit) {
      alert('⚠️ Admin Mode unavailable: no GitHub token or Octokit.');
      return;
    }
    isAdmin = !isAdmin;
    enterBtn.textContent = isAdmin ? '🔓 Exit Admin' : '🔒 Admin';
    saveBtn.style.display = isAdmin ? 'inline-block' : 'none';
    document.body.classList.toggle('admin-mode', isAdmin);
  });

  saveBtn.addEventListener('click', async () => {
    try {
      // fetch current file SHA
      const { data: file } = await octokit.repos.getContent({
        owner: repoInfo.owner,
        repo:  repoInfo.repo,
        path:  repoInfo.path,
      });
      const sha = file.sha;

      // commit updated glyphs array
      const content = btoa(JSON.stringify(glyphs, null, 2));
      await octokit.repos.createOrUpdateFileContents({
        owner:   repoInfo.owner,
        repo:    repoInfo.repo,
        path:    repoInfo.path,
        message: '📦 Admin update of glyph data',
        content: content,
        sha:     sha,
      });
      alert('✅ glyphs.json updated on GitHub!');
    } catch (err) {
      console.error(err);
      alert('❌ Save failed: ' + err.message);
    }
  });

})();  
