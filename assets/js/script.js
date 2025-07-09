// assets/js/script.js

(async () => {
  // ───────────────
  // 0) Admin Mode Setup
  // ───────────────

  // Prompt for a GitHub Personal Access Token (PAT) once and store it
  let octokit, repoInfo;
  if (!localStorage.getItem('gh_token')) {
    const token = prompt('🔑 Enter your GitHub Personal Access Token:');
    if (token) localStorage.setItem('gh_token', token);
  }
  const ghToken = localStorage.getItem('gh_token');
  if (ghToken) {
    // Initialize Octokit
    octokit = new Octokit.Octokit({ auth: ghToken });
    // Your repo details (owner/repo and path to glyphs.json)
    repoInfo = {
      owner: 'EliJMarchetti',
      repo:  'Glyph-Database',
      path:  'data/glyphs.json'
    };
  }

  // ───────────────────────────
  // 1) Load glyph data normally
  // ───────────────────────────
  const res    = await fetch('data/glyphs.json');
  const glyphs = await res.json();

  // ─────────────────────────────────
  // 2) Grab your filters & container
  // ─────────────────────────────────
  const levelFilter   = document.getElementById('levelFilter');
  const schoolFilters = document.getElementById('schoolFilters');
  const searchInput   = document.getElementById('search');
  const searchToggle  = document.getElementById('searchTextToggle');
  const container     = document.getElementById('cardsContainer');

  // ────────────────────────────────────
  // 3) Populate the Tier dropdown
  // ────────────────────────────────────
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

  // ────────────────────────────────────
  // 4) Build the school‐filter buttons
  // ────────────────────────────────────
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

  // ────────────────────────────────────
  // 5) Render function: draws all cards
  // ────────────────────────────────────
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
        // build card
        const card   = document.createElement('div');    card.className = 'card';
        const header = document.createElement('div');    header.className = 'card-header';

        // Name
        const info = document.createElement('div');      info.className = 'info';
        info.innerHTML = `<b>${g.Name}</b>`;

        // Meta
        const vsLabel = g.V ? 'V' : g.S ? 'S' : '';
        const meta    = document.createElement('div');   meta.className = 'meta';
        meta.innerHTML = `
          ${g.School}
          <span class="vs">${vsLabel}</span>
          • Tier ${g.Tier}
          • ${g.Points} Mana
        `;

        header.append(info, meta);
        card.append(header);

        // Body
        const body = document.createElement('div'); body.className = 'card-body';
        body.style.display = 'none';
        const ct   = document.createElement('p');  ct.textContent = `Casting Time: ${g['Casting Time']}`;
        const dur  = document.createElement('p');  dur.textContent = `Duration: ${g.Duration}${g.Concentration ? ' (Concentration)' : ''}`;
        const txt  = document.createElement('p');  txt.textContent = g['New Text'];
        const hr   = document.createElement('hr');
        const high = document.createElement('p');  high.textContent = g['Higher Tiers'];
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

  // ────────────────────────────────────
  // 6) Wire up filter controls → render
  // ────────────────────────────────────
  levelFilter.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);
  Object.values(schoolBtns).forEach(btn => btn.addEventListener('click', render));

  // ────────────────────────────────────
  // 7) Initial draw
  // ────────────────────────────────────
  render();

  // ────────────────────────────────────
  // 8) Mobile dropdown toggle (unchanged)
  // ────────────────────────────────────
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

  // ────────────────────────────────────
  // 9) ADMIN MODE: toggle & save
  // ────────────────────────────────────

  // NOTE: In your HTML header, add:
  //
  //   <button id="enterAdmin">🔒 Admin</button>
  //   <button id="saveAdmin" style="display:none">💾 Save Changes</button>
  //
  const enterBtn = document.getElementById('enterAdmin');
  const saveBtn  = document.getElementById('saveAdmin');
  let   isAdmin  = false;

  enterBtn.addEventListener('click', () => {
    if (!octokit) {
      alert('⚠️ No GitHub token found. Unable to enter Admin Mode.');
      return;
    }
    isAdmin = !isAdmin;
    enterBtn.textContent = isAdmin ? '🔓 Exit Admin' : '🔒 Admin';
    saveBtn.style.display = isAdmin ? 'inline-block' : 'none';
    document.body.classList.toggle('admin-mode', isAdmin);
  });

  saveBtn.addEventListener('click', async () => {
    try {
      // 1) fetch current file to get its SHA
      const { data: file } = await octokit.repos.getContent({
        owner: repoInfo.owner,
        repo:  repoInfo.repo,
        path:  repoInfo.path,
      });
      const sha = file.sha;

      // 2) prepare new content (the in-memory `glyphs` array)
      const content = btoa(JSON.stringify(glyphs, null, 2));

      // 3) update via GitHub API
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
      alert('❌ Failed to save changes:\n' + err.message);
    }
  });

})();
