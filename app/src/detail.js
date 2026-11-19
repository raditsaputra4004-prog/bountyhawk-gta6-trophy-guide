// The detail panel: the selected trophy's official description, grade, kind
// and count, then the guide in this guide's own words, a practical tip, and
// the sources each fact comes from. In spoiler mode an unearned story
// trophy stays masked here too — name, description and guide alike.

import { isMasked, isStoryTrophy, KIND_LABELS } from './list.js';

function sectionHeading(text) {
  const heading = document.createElement('h4');
  heading.textContent = text;
  return heading;
}

function paragraph(text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

// Render the guide for one trophy into the detail panel.
export function renderDetail(detailElement, trophy, state, callbacks) {
  detailElement.replaceChildren();
  const earned = state.earned.includes(trophy.id);
  const masked = isMasked(trophy, state);

  const title = document.createElement('h3');
  title.textContent = masked ? 'Hidden story trophy' : trophy.name;
  detailElement.appendChild(title);

  if (masked) {
    detailElement.appendChild(
      paragraph('This is a story trophy, and spoiler-safe mode is on. Its name, description and guide stay hidden until you earn it — check it off in the list to reveal it.'),
    );
    const note = document.createElement('p');
    note.className = 'trophy-hidden-note';
    note.textContent = 'Roadmap stage ' + trophy.roadmap + ' · ' + (trophy.missable ? 'missable — see its stage note' : 'not missable');
    detailElement.appendChild(note);
    const line = document.createElement('p');
    line.className = 'earned-line';
    line.textContent = earned ? 'Earned ✓' : 'Not earned yet';
    detailElement.appendChild(line);
    return;
  }

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `“${trophy.description}” — official description · ${trophy.grade}`;
  detailElement.appendChild(official);

  const meta = document.createElement('p');
  const kindNames = trophy.kinds.map((kind) => KIND_LABELS[kind] || kind).join(', ');
  meta.textContent =
    `Kind: ${kindNames} · Roadmap stage ${trophy.roadmap}` +
    (trophy.count !== null && trophy.count !== undefined
      ? ` · Target: ${trophy.count.toLocaleString()}`
      : '') +
    (trophy.missable ? ' · Missable' : '') +
    (trophy.hidden ? ' · Hidden on PlayStation until earned' : '');
  detailElement.appendChild(meta);

  detailElement.appendChild(sectionHeading('Guide'));
  detailElement.appendChild(paragraph(trophy.guide));

  if (trophy.tip) {
    detailElement.appendChild(sectionHeading('Tip'));
    const tip = document.createElement('p');
    tip.className = 'tip';
    tip.textContent = trophy.tip;
    detailElement.appendChild(tip);
  }

  detailElement.appendChild(sectionHeading('Sources'));
  const sources = document.createElement('ul');
  for (const source of trophy.sources || []) {
    const item = document.createElement('li');
    item.textContent = source;
    sources.appendChild(item);
  }
  const ownWork = document.createElement('li');
  ownWork.textContent = 'Route and tips: Leonida Trophy Atlas — this guide’s own reading of the description above.';
  sources.appendChild(ownWork);
  detailElement.appendChild(sources);

  const line = document.createElement('p');
  line.className = 'earned-line';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = earned ? 'Mark as not earned' : 'Mark as earned';
  toggle.addEventListener('click', () => callbacks.onToggleEarned(trophy.id));
  line.appendChild(toggle);
  line.appendChild(document.createTextNode(earned ? '  Earned ✓' : '  Not earned yet'));
  detailElement.appendChild(line);

  if (isStoryTrophy(trophy) && trophy.missable) {
    detailElement.appendChild(sectionHeading('If you missed it'));
    detailElement.appendChild(
      paragraph('This trophy belongs to one story mission. Replay that mission from the pause menu’s mission replay and complete it again — the trophy pops on the replay.'),
    );
  }
}

// The empty state, before any trophy is picked.
export function renderDetailEmpty(detailElement) {
  detailElement.replaceChildren();
  const title = document.createElement('h3');
  title.textContent = 'Pick a trophy';
  detailElement.appendChild(title);
  detailElement.appendChild(
    paragraph('Select a trophy in the checklist to read its guide, its sources, and what to do about it — including whether it can be missed and how to recover it.'),
  );
}
