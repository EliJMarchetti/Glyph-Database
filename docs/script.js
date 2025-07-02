js
/********************************************************************
 *  Magiforge shared JS  •  State, gauges, glyph picker & presets   *
 *******************************************************************/

const STATE_KEY = "magiforgeState";
const PRESET_KEY = "magiforgePresets";
let GLYPHS = [];

// ---------- util --------------------------------------------------
const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// ---------- load glyph data --------------------------------------
(async () => {
  const res = await fetch("glyphs.json");
  GLYPHS = await res.json();
  if (document.body.id !== "noAccordion") buildAccordion();
  restoreState();
})();

// ---------- default state ----------------------------------------
const defaultState = {
  maxHp: 7, hp: 7, tempHp: 0,
  maxMana: 7, mana: 7, tempMana: 0,
  prepared: []
};

let state = { ...defaultState };

// ---------- localStorage helpers ---------------------------------
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
function restoreState() {
  const raw = localStorage.getItem(STATE_KEY);
  if (raw) state = { ...defaultState, ...JSON.parse(raw) };
  updateUI();
}

// ---------- gauge maths ------------------------------------------
function setClip(id, current, max) {
  const rect = $(id);
  const pct = clamp(current / max, 0, 1);
  rect.setAttribute("y", (1 - pct) * 100);
  rect.setAttribute("height", pct * 100);
}

function updateGauges() {
  setClip("#hpRect", state.hp, state.maxHp);
  setClip("#tempHpRect", state.hp + state.tempHp, state.maxHp);
  setClip("#manaRect", state.mana, state.maxMana);
  setClip("#tempManaRect", state.mana + state.tempMana, state.maxMana);
  $("#hpLabel").textContent = `${state.hp}/${state.maxHp} (+${state.tempHp})`;
  $("#manaLabel").textContent = `${state.mana}/${state.maxMana} (+${state.tempMana})`;
}

// ---------- buttons ----------------------------------------------
function adjust(key, delta) {
  state[key] = clamp(state[key] + delta, 0, key.includes("max") ? 360 : state[key.includes("Hp") ? "maxHp" : "maxMana"]);
  if (key === "hp" && state.hp < 0) state.hp = 0;
  if (key === "mana" && state.mana < 0) state.mana = 0;
  // ensure temp never exceeds max
  state.tempHp = clamp(state.tempHp, 0, state.maxHp - state.hp);
  state.tempMana = clamp(state.tempMana, 0, state.maxMana - state.mana);
  updateUI();
}

$("#gauges")?.addEventListener("click", e => {
  if (!e.target.dataset.act) return;
  const map = {
    "hp--": () => adjust("hp", -1),
    "hp++": () => adjust("hp", 1),
    "tempHp--": () => adjust("tempHp", -1),
    "tempHp++": () => adjust("tempHp", 1),
    "mana--": () => adjust("mana", -1),
    "mana++": () => adjust("mana", 1),
    "tempMana--": () => adjust("tempMana", -1),
    "tempMana++": () => adjust("tempMana", 1)
  };
  map[e.target.dataset.act]?.();
});

$("#applyMax")?.addEventListener("click", () => {
  state.maxHp = clamp(parseInt($("#maxHpInput").value) || state.maxHp, 1, 360);
  state.maxMana = clamp(parseInt($("#maxManaInput").value) || state.maxMana, 1, 360);
  state.hp = Math.min(state.hp, state.maxHp);
  state.mana = Math.min(state.mana, state.maxMana);
  updateUI();
});

// ---------- accordion (glyphs.html) ------------------------------
function buildAccordion() {
  const wrap = $("#glyphAccordion");
  if (!wrap) return;
  const tiers = [...new Set(GLYPHS.map(g => g.Tier))].sort((a,b)=>a-b);
  wrap.innerHTML = tiers.map(t => {
    const id = `tier${t}`;
    return `<details>
      <summary>Tier ${t}</summary>
      ${GLYPHS.filter(g=>g.Tier===t).sort((a,b)=>a.Name.localeCompare(b.Name)).map(g=>`<details>
          <summary>${g.Name}</summary>
          <button class="addGlyph" data-id="${g.Name}">＋ Prepare</button>
          <pre>${g.Effect}\n\nUpcast: ${g.Upcast}</pre>
        </details>`).join("")}
    </details>`;
  }).join("");

  wrap.addEventListener("click", e=>{
    if(e.target.classList.contains("addGlyph")){
      e.preventDefault();
      const name=e.target.dataset.id;
      if(!state.prepared.includes(name)) state.prepared.push(name);
      updateUI();
    }
  });
}

// ---------- picker modal (index.html) ----------------------------
$("#openPicker")?.addEventListener("click", () => {
  buildPicker();
  $("#pickerOverlay").classList.remove("hidden");
});
$("#closePicker")?.addEventListener("click", () => $("#pickerOverlay").classList.add("hidden"));
$("#applyPicker")?.addEventListener("click", () => {
  $$("input.pickbox:checked").forEach(cb=>{
    if(!state.prepared.includes(cb.value)) state.prepared.push(cb.value);
  });
  $("#pickerOverlay").classList.add("hidden");
  updateUI();
});
function buildPicker(){
  const body=$("#pickerBody");
  body.innerHTML=GLYPHS.sort((a,b)=>a.Name.localeCompare(b.Name)).map(g=>`<label class="block">
    <input type="checkbox" class="pickbox" value="${g.Name}" ${state.prepared.includes(g.Name)?"checked":""} /> ${g.Name}
  </label>`).join("");
}

// ---------- prepared list ---------------------------------------
function renderPrepared(){
  const box=$("#preparedList");
  if(!box) return;
  box.innerHTML=state.prepared.map(name=>{
    const g=GLYPHS.find(x=>x.Name===name);
    if(!g) return "";
    return `<div class="prep-card">
      <h3 class="prep-title">${g.Name}</h3>
      <button class="unprep" data-id="${g.Name}">✕</button>
      <pre>${g.Effect}\n\nUpcast: ${g.Upcast}</pre>
    </div>`;
  }).join("");
  box.addEventListener("click", e=>{
    if(e.target.classList.contains("unprep")){
      const id=e.target.dataset.id;
      if(confirm(`Remove ${id} from prepared list?`)){
        state.prepared = state.prepared.filter(x=>x!==id);
        updateUI();
      }
    }
  });
}

// ---------- presets ---------------------------------------------
function refreshPresetSelect(){
  const sel=$("#presetSelect");
  if(!sel) return;
  const presets=JSON.parse(localStorage.getItem(PRESET_KEY)||"{}");
  sel.innerHTML=Object.keys(presets).map(n=>`<option>${n}</option>`).join("");
}

$("#savePreset")?.addEventListener("click",()=>{
  const name=$("#presetName").value.trim();
  if(!name) return alert("Preset needs a name");
  const presets=JSON.parse(localStorage.getItem(PRESET_KEY)||"{}");
  presets[name]=state;
  localStorage.setItem(PRESET_KEY,JSON.stringify(presets));
  refreshPresetSelect();
});

$("#loadPreset")?.addEventListener("click",()=>{
  const name=$("#presetSelect").value;
  const presets=JSON.parse(localStorage.getItem(PRESET_KEY)||"{}");
  if(presets[name]){state={...presets[name]};updateUI();}
});

$("#deletePreset")?.addEventListener("click",()=>{
  const name=$("#presetSelect").value;
  const presets=JSON.parse(localStorage.getItem(PRESET_KEY)||"{}");
  if(!presets[name]) return;
  if(confirm(`Delete preset '${name}'?`)){
    delete presets[name];
    localStorage.setItem(PRESET_KEY,JSON.stringify(presets));
    refreshPresetSelect();
  }
});

// ---------- master UI update ------------------------------------
function updateUI(){
  updateGauges();
  renderPrepared();
  saveState();
  refreshPresetSelect();
}
```

---
## 📄 style.css (append to your existing file)
```css
/* === background === */
.bg-topo { background-image:url('topo.jpg'); background-size:cover; background-attachment:fixed; }

/* === sections === */
.section-title { @apply text-xl font-semibold uppercase tracking-wide; }
.gauge-card { @apply flex flex-col items-center gap-2; }
.gauge-svg { width:100px; height:100px; }
.gauge-controls { @apply flex flex-wrap gap-1 items-center justify-center text-sm; }
.btn { @apply bg-white/10 px-2 py-1 rounded hover:bg-white/20; }
.num { @apply w-16 bg-white/10 text-center rounded px-1; }
.max-setters { @apply flex flex-wrap items-center gap-2 text-sm; }

/* === prepared glyphs === */
.prep-card { @apply bg-white/5 p-3 rounded relative; }
.prep-title { @apply font-semibold mb-1; }
.unprep { @apply absolute top-1 right-1 text-red-400 hover:text-red-200; }

/* === modal === */
.overlay { @apply fixed inset-0 bg-black/60 flex items-center justify-center; }
.picker { @apply bg-gray-900 max-h-[80vh] w-96 rounded shadow-lg flex flex-col; }
.picker-header { @apply px-4 py-2 font-semibold flex justify-between items-center border-b border-white/10; }
.picker-body { @apply flex-1 overflow-y-auto px-4 py-2 text-sm; }
.picker-footer { @apply border-t border-white/10 p-2 text-right; }

/* === presets === */
.preset-input { @apply bg-white/10 px-2 py-1 rounded; }
.preset-select { @apply bg-white/10 px-2 py-1 rounded; }
