/**
 * render.js
 * Pure rendering functions — read state, write DOM, no side-effects.
 * Also fixes the desktop drag bug: attachDesktopDrag/attachDropTarget
 * are now called here for every card.
 */

import { DAYS, SLOTS, getSubjectColor } from './data.js';
import { currentDay, editMode, timetable } from './state.js';
import { attachDesktopDrag, attachDropTarget } from './drag.js';

// ── Tabs ─────────────────────────────────────────────────────

/**
 * Render the 4-tab sliding window centred on currentDay.
 * Dispatches a custom 'tabclick' event when a tab is tapped.
 */
export function renderTabs() {
  const row = document.getElementById('tabsRow');
  row.innerHTML = '';

  // Keep active tab at visual position 2 (0-indexed) in the 4-tab window
  const start = Math.max(0, Math.min(DAYS.length - 4, currentDay - 2));

  for (let i = start; i < start + 4 && i < DAYS.length; i++) {
    const tab = document.createElement('div');
    tab.className = 'tab' + (i === currentDay ? ' active' : '');
    tab.textContent = DAYS[i];
    tab.dataset.dayIndex = i;
    tab.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('tabclick', { detail: { day: i } }));
    });
    row.appendChild(tab);
  }
}

// ── Periods ──────────────────────────────────────────────────

/**
 * Render the full period list for the current day.
 * Dispatches:
 *   'deletelesson'  { detail: { period } }
 *   'addtoslot'     { detail: { period } }
 *   'openbank'      (no detail — add to next free slot)
 */
export function renderPeriods() {
  const list = document.getElementById('periodList');
  list.innerHTML = '';
  list.className = 'period-list' + (editMode ? ' edit-mode' : '');

  const dd   = timetable[currentDay] || {};
  const keys = Object.keys(dd).map(Number);
  const maxP = Math.max(11, keys.length ? Math.max(...keys) : 0);

  for (let p = 0; p <= maxP; p++) {
    const lesson = dd[p] || null;
    const time   = SLOTS[p] || null;

    const card = makeCard(p, lesson, time);
    list.appendChild(card);
  }

  // "Add lesson" button at the bottom — only visible in edit mode
  const addSlot = document.createElement('div');
  addSlot.className = 'add-slot';
  addSlot.textContent = '＋ הוסף שיעור';
  addSlot.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('openbank'));
  });
  list.appendChild(addSlot);
}

// ── Card factory ─────────────────────────────────────────────

function makeCard(p, lesson, time) {
  const card = document.createElement('div');
  card.className = 'card' + (lesson ? ' filled' : '');
  card.dataset.period = p;

  // Attach desktop drag (drag source) only to filled cards in edit mode
  if (editMode && lesson) {
    attachDesktopDrag(card, p);
  }
  // Every card is a valid drop target
  attachDropTarget(card, p);

  // ── Right column: period number + time ──
  const right = document.createElement('div');
  right.className = 'p-right';

  const numEl = document.createElement('div');
  numEl.className = 'p-num';
  numEl.textContent = p;
  right.appendChild(numEl);

  if (time) {
    const timeEl = document.createElement('div');
    timeEl.className = 'p-time';
    timeEl.textContent = time;
    right.appendChild(timeEl);
  }

  // ── Color strip ──
  const strip = document.createElement('div');
  strip.className = 'p-strip';
  strip.style.background = lesson ? getSubjectColor(lesson.s) : 'transparent';

  // ── Text body ──
  const body = document.createElement('div');
  body.className = 'p-body';

  if (lesson) {
    const subj = document.createElement('div');
    subj.className = 'p-subject';
    subj.textContent = lesson.s;
    body.appendChild(subj);

    const det = document.createElement('div');
    det.className = 'p-details';
    det.textContent = lesson.r ? `${lesson.t} | ${lesson.r}` : lesson.t;
    body.appendChild(det);

    if (editMode) {
      const delBtn = document.createElement('button');
      delBtn.className = 'del-btn';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('deletelesson', { detail: { period: p } }));
      });
      card.appendChild(delBtn);

      const handle = document.createElement('div');
      handle.className = 'drag-hdl';
      handle.textContent = '⠿';
      card.appendChild(handle);
    }
  } else if (p > 0 && editMode) {
    const addEl = document.createElement('div');
    addEl.style.cssText = 'color:#bbb;font-size:13px;cursor:pointer;padding:4px 0';
    addEl.textContent = '+ הוסף שיעור';
    addEl.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('addtoslot', { detail: { period: p } }));
    });
    body.appendChild(addEl);
  }

  card.appendChild(right);
  card.appendChild(strip);
  card.appendChild(body);
  return card;
}

// ── Bank ─────────────────────────────────────────────────────

/**
 * Render the subject bank list.
 * Dispatches 'lessonchosen' { detail: { lesson } } when a row is tapped.
 * @param {object[]} items  Filtered array of { s, t, r }
 */
export function renderBank(items) {
  const box = document.getElementById('bankItems');
  box.innerHTML = '';

  if (!items.length) {
    box.innerHTML = '<div style="text-align:center;color:#aaa;padding:24px">לא נמצאו שיעורים</div>';
    return;
  }

  items.forEach(lesson => {
    const row    = document.createElement('div');
    row.className = 'bank-row';

    const swatch = document.createElement('div');
    swatch.className = 'b-sw';
    swatch.style.background = getSubjectColor(lesson.s);

    const info = document.createElement('div');
    info.className = 'b-inf';

    const name = document.createElement('div');
    name.className = 'b-nm';
    name.textContent = lesson.s;

    const sub = document.createElement('div');
    sub.className = 'b-sub';
    sub.textContent = lesson.r ? `${lesson.t} | ${lesson.r}` : lesson.t;

    const plus = document.createElement('div');
    plus.className = 'b-pl';
    plus.textContent = '+';

    info.appendChild(name);
    info.appendChild(sub);
    row.appendChild(swatch);
    row.appendChild(info);
    row.appendChild(plus);

    row.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('lessonchosen', { detail: { lesson } }));
    });

    box.appendChild(row);
  });
}

// ── Full re-render ────────────────────────────────────────────

export function render() {
  renderTabs();
  renderPeriods();
}