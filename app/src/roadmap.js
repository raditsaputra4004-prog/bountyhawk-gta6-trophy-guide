// The roadmap: six stages in order, each with its goal, its trophies as
// chips, and a note where its missable trophies live. A chip selects its
// trophy in the checklist; in spoiler mode a story trophy's chip shows its
// stage but not its name until it is earned.

import { isMasked } from './list.js';

export function renderRoadmap(stagesElement, stages, trophiesById, state, onSelect) {
  stagesElement.replaceChildren();
  for (const stage of stages) {
    const item = document.createElement('li');
    item.className = 'stage';

    const heading = document.createElement('h3');
    const number = document.createElement('span');
    number.className = 'stage-num';
    number.textContent = String(stage.stage);
    heading.appendChild(number);
    heading.appendChild(document.createTextNode(stage.title));
    item.appendChild(heading);

    const goal = document.createElement('p');
    goal.textContent = stage.goal;
    item.appendChild(goal);

    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const id of stage.ids) {
      const trophy = trophiesById.get(id);
      if (!trophy) continue;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'mini-chip';
      if (state.earned.includes(id)) chip.classList.add('earned');
      chip.textContent = isMasked(trophy, state) ? 'Hidden story trophy' : trophy.name;
      chip.addEventListener('click', () => onSelect(id));
      chips.appendChild(chip);
    }
    item.appendChild(chips);

    if (stage.missable_note) {
      const note = document.createElement('p');
      note.className = 'missable-note';
      note.textContent = 'Missable: ' + stage.missable_note;
      item.appendChild(note);
    }
    stagesElement.appendChild(item);
  }
}
