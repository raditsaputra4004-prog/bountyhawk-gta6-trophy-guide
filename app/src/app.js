// Leonida Trophy Atlas — boot and wiring.
//
// Loads the trophy list and the roadmap, then renders the checklist, the
// roadmap and the detail panel, and wires search, filters, the spoiler
// setting, and progress export/import. Progress lives in the browser
// (localStorage); the app fetches only its own data files, never the network.

import { loadSavedState, saveState, toggleEarned, exportProgress, readImportedProgress } from './tracker.js';
import { renderKindChips, renderTrophyList } from './list.js';
import { renderDetail, renderDetailEmpty } from './detail.js';
import { renderRoadmap } from './roadmap.js';

const TOTAL_TROPHIES = 55;

const state = loadSavedState();
let trophies = [];
let stages = [];
let selectedId = null;
const filters = { kind: 'all', grade: '', search: '', earnedOnly: false };

function byId(id) {
  return trophies.find((trophy) => trophy.id === id) || null;
}

function missableLeft() {
  return trophies.filter((trophy) => trophy.missable && !state.earned.includes(trophy.id)).length;
}

// The progress bar, the counts beside it, and the line under it.
function refreshProgress() {
  const earned = state.earned.length;
  const percent = Math.round((earned / TOTAL_TROPHIES) * 100);
  const text = document.getElementById('progress-text');
  const count = document.getElementById('progress-count');
  const fill = document.getElementById('progress-fill');
  const sub = document.getElementById('progress-sub');
  if (text) text.textContent = earned === TOTAL_TROPHIES ? 'Platinum earned — Leonida Legend!' : `${earned} of ${TOTAL_TROPHIES} trophies earned`;
  if (count) count.textContent = `${percent}%`;
  if (fill) fill.style.width = `${percent}%`;
  if (sub) {
    const left = missableLeft();
    sub.textContent =
      earned === 0
        ? 'Start with the story — the roadmap below is in order.'
        : `${TOTAL_TROPHIES - earned} to go · ${left} missable ${left === 1 ? 'trophy' : 'trophies'} still unprotected`;
  }
  const summary = document.getElementById('list-summary');
  if (summary) {
    summary.textContent = `${earned} earned, ${TOTAL_TROPHIES - earned} left. Check a trophy off when it pops — progress is saved in this browser.`;
  }
}

function renderAll() {
  const listElement = document.getElementById('trophy-list');
  const visible = renderTrophyList(listElement, trophies, { ...filters, spoiler: state.spoiler }, state, selectedId, {
    onToggleEarned: handleToggleEarned,
    onSelect: handleSelect,
  });
  const heading = document.getElementById('list-heading');
  if (heading) heading.textContent = `Checklist — ${visible} shown`;
  renderKindChips(document.getElementById('kind-chips'), filters.kind, (kind) => {
    filters.kind = kind;
    renderAll();
  });
  const detailElement = document.getElementById('detail');
  const selected = selectedId === null ? null : byId(selectedId);
  if (selected) renderDetail(detailElement, selected, state, { onToggleEarned: handleToggleEarned });
  else renderDetailEmpty(detailElement);
  renderRoadmap(
    document.getElementById('stages'),
    stages,
    new Map(trophies.map((trophy) => [trophy.id, trophy])),
    state,
    handleSelect,
  );
  refreshProgress();
}

function handleToggleEarned(trophyId) {
  state.earned = toggleEarned(state, trophyId);
  saveState(state);
  renderAll();
}

function handleSelect(trophyId) {
  selectedId = trophyId;
  renderAll();
  const detail = document.getElementById('detail');
  if (detail) detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function note(message) {
  const noteElement = document.getElementById('toolbar-note');
  if (noteElement) noteElement.textContent = message;
}

async function boot() {
  const [trophyData, roadmapData] = await Promise.all([
    fetch('data/trophies.json').then((response) => {
      if (!response.ok) throw new Error('trophies.json did not load');
      return response.json();
    }),
    fetch('data/roadmap.json').then((response) => {
      if (!response.ok) throw new Error('roadmap.json did not load');
      return response.json();
    }),
  ]);
  trophies = trophyData.trophies;
  stages = roadmapData.stages;
  selectedId = trophies[0] ? trophies[0].id : null;

  const search = document.getElementById('search');
  search.addEventListener('input', () => {
    filters.search = search.value.trim();
    renderAll();
  });
  document.getElementById('grade-filter').addEventListener('change', (event) => {
    filters.grade = event.target.value;
    renderAll();
  });
  document.getElementById('earned-only').addEventListener('change', (event) => {
    filters.earnedOnly = event.target.checked;
    renderAll();
  });
  const spoilerToggle = document.getElementById('spoiler-toggle');
  spoilerToggle.checked = state.spoiler;
  spoilerToggle.addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    saveState(state);
    renderAll();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    exportProgress(state);
    note(`Exported ${state.earned.length} earned trophies to a file.`);
  });
  const importFile = document.getElementById('import-file');
  document.getElementById('import-btn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    try {
      const imported = await readImportedProgress(file);
      state.earned = imported.earned.filter((id) => byId(id) !== null);
      state.spoiler = imported.spoiler;
      spoilerToggle.checked = state.spoiler;
      saveState(state);
      renderAll();
      note(`Imported ${state.earned.length} earned trophies from ${file.name}.`);
    } catch (error) {
      note(error instanceof Error ? error.message : 'that file could not be imported');
    }
    importFile.value = '';
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!window.confirm('Clear every earned trophy in this browser?')) return;
    state.earned = [];
    saveState(state);
    renderAll();
    note('Progress cleared.');
  });

  renderAll();
}

boot().catch((error) => {
  const detail = document.getElementById('detail');
  if (detail) detail.textContent = `This guide did not load: ${error instanceof Error ? error.message : String(error)}`;
});
