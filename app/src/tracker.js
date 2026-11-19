// Tracker state: what the player has earned, kept in the browser and portable
// as a file. Nothing leaves the machine — progress lives in localStorage
// under one key, and export/import move it as a plain JSON file.

export const STORAGE_KEY = 'leonida-trophy-atlas-v1';
export const EXPORT_APP = 'leonida-trophy-atlas';

// Read the saved state, forgiving anything malformed or from another shape.
export function loadSavedState() {
  const fallback = { earned: [], spoiler: false };
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return fallback;
  }
  if (!raw) return fallback;
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (!parsed || typeof parsed !== 'object') return fallback;
  const earned = Array.isArray(parsed.earned)
    ? parsed.earned.filter((id) => Number.isInteger(id))
    : [];
  return { earned: [...new Set(earned)], spoiler: parsed.spoiler === true };
}

// Persist the state as one small JSON document.
export function saveState(state) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ earned: state.earned, spoiler: state.spoiler }),
    );
  } catch {
    // Private mode or a full store: the page still works, it just forgets.
  }
}

// Flip one trophy's earned flag and return the new earned list.
export function toggleEarned(state, trophyId) {
  const earned = new Set(state.earned);
  if (earned.has(trophyId)) earned.delete(trophyId);
  else earned.add(trophyId);
  return [...earned].sort((a, b) => a - b);
}

export function earnedCount(state) {
  return state.earned.length;
}

// Download the progress as a JSON file, through a blob URL, no network.
export function exportProgress(state) {
  const payload = {
    app: EXPORT_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: state.earned,
    spoiler: state.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'leonida-trophy-atlas-progress.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Read an exported progress file and return its earned ids, or throw a
// plain-English reason the import button can show.
export async function readImportedProgress(file) {
  const text = await file.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('that file is not JSON — export progress from this guide first');
  }
  if (!parsed || parsed.app !== EXPORT_APP || !Array.isArray(parsed.earned)) {
    throw new Error('that file is not a Leonida Trophy Atlas export');
  }
  const earned = [...new Set(parsed.earned.filter((id) => Number.isInteger(id)))];
  return { earned, spoiler: parsed.spoiler === true };
}
