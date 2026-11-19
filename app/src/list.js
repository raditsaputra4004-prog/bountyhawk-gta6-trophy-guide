// The checklist: filtering, searching, spoiler masking, and rendering the
// trophy rows. A row is a checkbox plus the official name, description and
// grade; spoiler mode masks the name and description of story trophies the
// player has not earned yet, so the list never spoils the story.

export const KIND_LABELS = {
  all: 'All',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  combat: 'Combat',
  world: 'World',
  economy: 'Economy',
  completion: 'Completion',
  online: 'Online',
};

// The kinds offered as filter chips, in the order they are shown.
export const KIND_CHIPS = [
  'all',
  'story',
  'missable',
  'collectibles',
  'activities',
  'combat',
  'world',
  'economy',
  'completion',
  'online',
];

// A trophy is a story trophy when its kinds name it so.
export function isStoryTrophy(trophy) {
  return trophy.kinds.includes('story');
}

// Spoiler mode hides a story trophy's name and description until it is
// earned; the checkbox stays, so the player can still earn and reveal it.
export function isMasked(trophy, state) {
  return state.spoiler && isStoryTrophy(trophy) && !state.earned.includes(trophy.id);
}

// Does this trophy pass the current filter set? Missable is a flag, not a
// kind, and online is a kind no trophy on this list carries.
export function passesFilters(trophy, filters, state) {
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind === 'online') return false;
  if (filters.kind && filters.kind !== 'all' && filters.kind !== 'missable') {
    if (!trophy.kinds.includes(filters.kind)) return false;
  }
  if (filters.grade && trophy.grade !== filters.grade) return false;
  if (filters.earnedOnly && !state.earned.includes(trophy.id)) return false;
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function gradeChip(grade) {
  const chip = document.createElement('span');
  chip.className = `grade grade-${grade}`;
  chip.textContent = grade;
  return chip;
}

function tagChip(text, extraClass) {
  const tag = document.createElement('span');
  tag.className = `tag${extraClass ? ` ${extraClass}` : ''}`;
  tag.textContent = text;
  return tag;
}

function trophyRow(trophy, state, selectedId, callbacks) {
  const earned = state.earned.includes(trophy.id);
  const masked = isMasked(trophy, state);
  const row = document.createElement('li');
  row.className = `trophy${earned ? ' earned' : ''}${trophy.id === selectedId ? ' selected' : ''}`;
  row.dataset.trophyId = String(trophy.id);

  const top = document.createElement('div');
  top.className = 'trophy-top';
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earned;
  check.setAttribute('aria-label', `Earned: ${masked ? 'hidden story trophy' : trophy.name}`);
  check.addEventListener('click', (event) => {
    event.stopPropagation();
    callbacks.onToggleEarned(trophy.id);
  });
  top.appendChild(check);

  const name = document.createElement('span');
  name.className = 'trophy-name';
  name.textContent = masked ? 'Hidden story trophy' : trophy.name;
  top.appendChild(name);
  if (!masked) top.appendChild(gradeChip(trophy.grade));
  row.appendChild(top);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = masked
    ? 'Hidden until earned — check it off to reveal it.'
    : trophy.description;
  row.appendChild(desc);

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  if (masked) {
    meta.appendChild(tagChip('story', 'hidden-flag'));
  } else {
    for (const kind of trophy.kinds) meta.appendChild(tagChip(KIND_LABELS[kind] || kind));
    if (trophy.count !== null && trophy.count !== undefined) {
      meta.appendChild(tagChip(`target: ${trophy.count.toLocaleString()}`));
    }
  }
  if (trophy.missable) meta.appendChild(tagChip('missable', 'missable'));
  if (trophy.hidden) meta.appendChild(tagChip('hidden on PSN', 'hidden-flag'));
  row.appendChild(meta);

  row.addEventListener('click', () => callbacks.onSelect(trophy.id));
  return row;
}

// Rebuild the checklist for the current filters and state.
export function renderTrophyList(listElement, trophies, filters, state, selectedId, callbacks) {
  listElement.replaceChildren();
  const visible = trophies.filter((trophy) => passesFilters(trophy, filters, state));
  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent =
      filters.kind === 'online'
        ? 'No trophy on this list needs online play — every one of the 55 is single-player.'
        : 'No trophies match these filters. Clear the search or pick another kind.';
    listElement.appendChild(empty);
  }
  for (const trophy of visible) {
    listElement.appendChild(trophyRow(trophy, state, selectedId, callbacks));
  }
  return visible.length;
}

// Build the kind filter chips and wire them to the given selection handler.
export function renderKindChips(container, activeKind, onSelect) {
  container.replaceChildren();
  for (const kind of KIND_CHIPS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = KIND_LABELS[kind];
    chip.setAttribute('aria-pressed', kind === activeKind ? 'true' : 'false');
    chip.addEventListener('click', () => onSelect(kind));
    container.appendChild(chip);
  }
}
