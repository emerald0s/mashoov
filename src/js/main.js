/**
 * main.js
 * Application entry point.
 * NOTE: editBtn / editDoneBtn are handled by the inline toggle script
 * in index.html — do NOT add listeners for them here.
 */

import { DAYS } from './data.js';
import {
  currentDay,
  setCurrentDay, setEditMode,
  swapPeriods, deleteLesson, addLesson,
} from './state.js';
import { render } from './render.js';
import { initTouchDrag } from './drag.js';
import { initBank, openBank, closeBank, getTargetPeriod } from './bank.js';

// ── Boot ─────────────────────────────────────────────────────
initTouchDrag();
initBank();
render();

// ── Navigation ───────────────────────────────────────────────
document.getElementById('arrowLeft').addEventListener('click', () => {
  setCurrentDay((currentDay - 1 + DAYS.length) % DAYS.length);
  render();
});

document.getElementById('arrowRight').addEventListener('click', () => {
  setCurrentDay((currentDay + 1) % DAYS.length);
  render();
});

document.addEventListener('tabclick', e => {
  setCurrentDay(e.detail.day);
  render();
});

// ── Period events ─────────────────────────────────────────────
document.addEventListener('deletelesson', e => {
  deleteLesson(e.detail.period);
  render();
});

document.addEventListener('swapperiods', e => {
  swapPeriods(e.detail.a, e.detail.b);
  render();
});

document.addEventListener('addtoslot', e => {
  openBank(e.detail.period);
});

document.addEventListener('openbank', () => {
  openBank(null);
});

// ── Bank events ───────────────────────────────────────────────
document.addEventListener('lessonchosen', e => {
  addLesson(getTargetPeriod(), e.detail.lesson);
  closeBank();
  render();
});