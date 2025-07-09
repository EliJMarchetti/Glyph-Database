// assets/js/script.js

(async function() {
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
  const enterBtn      = document.getElementById('enterAdmin');
  const saveBtn       = document.getElementById('saveAdmin');

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
  // 5) ADMIN STATE & OCTOKIT
  //
  let isAdmin = false, octokit, repoInfo;
  enterBtn.addEventListener('click', () => {
    if (!octokit) {
      const token = prompt('🔑 Enter your GitHub Personal Access Token:');
      if (!token) return;
      localStorage.setItem('gh_token', token);
      octokit = new window.Octokit({ auth: token });
      repoInfo = {
        owner: 'EliJMarchetti',
        repo:  'Glyph-Database',
        path:  'data/glyphs.json'
      };
    }
    isAdmin = !isAdmin;
    enterBtn.textContent = isAdmin ? '🔓 Exit Admin' : '🔒 Admin';
    saveBtn.style.display = isAdmin ? 'inline-block' : 'none';
    document.body.classList.toggle('admin-mode', isAdmin);
    render();
  });
  saveBtn.addEventListener('click', async () => {
    try {
      const { data: file } = await octokit.repos.getContent(repoInfo);
      const sha = file.sha;
      const content = btoa(JSON.stringify(glyphs, null, 2));
      await octokit.repos.createOrUpdateFileContents({
        ...repoInfo,
        message: '📦 Admin update of glyph data',
        content, sha
      });
      alert('✅ glyphs.json updated on GitHub!');
    } catch (err) {
      console.error(err);
      alert('❌ Save failed: ' + err.message);
    }
  });

  //
  // 6) RENDER FUNCTION (with inline editing in Admin Mode)
  //
  function render() {
    const levelVal    = levelFilter.value;
    let activeSchools = schools.filter(s => schoolBtns[s].classList.contains('active'));
    if (activeSchools.length === 0) activeSchools = [...schools];

    const q         = searchInput.value.toLowerCase();
    const inDetails = searchToggle.checked;

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
      .forEach((g, idx) => {
        const card   = document.createElement('div');   card.className = 'card';
        const header = document.createElement('div');   header.className = 'card-header';

        // — Name (editable) —
        const info = document.createElement('div');
        info.className = 'info';
        info.textContent = g.Name;
        if (isAdmin) {
          info.contentEditable = 'true';
          info.dataset.field   = 'Name';
          info.dataset.index   = idx;
          info.addEventListener('blur', e => {
            glyphs[e.target.dataset.index].Name = e.target.textContent.trim();
          });
        }

        // — Meta (School, V/S, Tier, Mana) —
        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.innerHTML = `
          <span class="field-school">${g.School}</span>
          <span class="vs">${g.V?'V':g.S?'S':''}</span>
          • Tier <span class="field-Tier">${g.Tier}</span>
          • <span class="field-Points">${g.Points}</span> Mana
        `;
        if (isAdmin) {
          ['school','Tier','Points'].forEach(fld => {
            const el = meta.querySelector(`.field-${fld}`);
            el.contentEditable = 'true';
            el.dataset.field   = fld;
            el.dataset.index   = idx;
            el.addEventListener('blur', e => {
              let val = e.target.textContent.trim();
              if (fld === 'Tier' || fld === 'Points') val = +val;
              glyphs[e.target.dataset.index][fld] = val;
            });
          });
        }

        header.append(info, meta);
        card.append(header);

        // — Body (editable paragraphs) —
        const body = document.createElement('div');
        body.className     = 'card-body';
        body.style.display = 'none';
        const sections = [
          { label: 'Casting Time', key: 'Casting Time' },
          { label: 'Duration',     key: 'Duration',     suffix: g.Concentration ? ' (Concentration)' : '' },
          { label: 'New Text',     key: 'New Text' },
          { label: 'Higher Tiers', key: 'Higher Tiers' }
        ];
        sections.forEach(sec => {
          const p = document.createElement('p');
          p.textContent = `${sec.label}: ${g[sec.key] || ''}${sec.suffix||''}`;
          if (isAdmin) {
            p.contentEditable = 'true';
            p.dataset.field   = sec.key;
            p.dataset.index   = idx;
            p.addEventListener('blur', e => {
              let txt = e.target.textContent.replace(new RegExp(`^${sec.label}:\\s*`), '')
                                            .replace(sec.suffix||'', '')
                                            .trim();
              glyphs[e.target.dataset.index][sec.key] = txt;
            });
          }
          body.append(p);
        });
        card.append(body);

        header.addEventListener('click', () => {
          const open = body.style.display === 'block';
          body.style.display = open ? 'none' : 'block';
          card.classList.toggle('open', !open);
        });

        container.append(card);
      });
  }

  //
  // 7) HOOK UP FILTERS & INITIAL DRAW
  //
  levelFilter.addEventListener('change', render);
  searchInput.addEventListener('input', render);
  searchToggle.addEventListener('change', render);
  Object.values(schoolBtns).forEach(btn => btn.addEventListener('click', render));
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

})();
