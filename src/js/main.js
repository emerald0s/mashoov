/**
 * main.js
 * Application entry point.
 * Boots the app, wires up all event listeners, and orchestrates
 * the flow between state → render → user-events → state.
 */

import { DAYS } from './data.js';
import {
  currentDay, editMode,
  setCurrentDay, setEditMode,
  swapPeriods, deleteLesson, addLesson,
} from './state.js';
import { render } from './render.js';
import { initTouchDrag } from './drag.js';
import { initBank, openBank, closeBank, getTargetPeriod } from './bank.js';

// ── Boot ──────────────────────────────────────────────────────

initTouchDrag();
initBank();
render();

// ── Navigation ────────────────────────────────────────────────

document.getElementById('arrowLeft').addEventListener('click', () => {
  setCurrentDay((currentDay - 1 + DAYS.length) % DAYS.length);
  render();
});

document.getElementById('arrowRight').addEventListener('click', () => {
  setCurrentDay((currentDay + 1) % DAYS.length);
  render();
});

// Tab clicks are dispatched as custom events from render.js
document.addEventListener('tabclick', e => {
  setCurrentDay(e.detail.day);
  render();
});

// ── Edit mode ─────────────────────────────────────────────────

document.getElementById('editBtn').addEventListener('click', () => {
  setEditMode(true);
  document.getElementById('editBanner').classList.add('on');
  render();
});

document.getElementById('editDoneBtn').addEventListener('click', () => {
  setEditMode(false);
  document.getElementById('editBanner').classList.remove('on');
  render();
});

// ── Period events (dispatched from render.js) ─────────────────

// Delete a lesson
document.addEventListener('deletelesson', e => {
  deleteLesson(e.detail.period);
  render();
});

// Drag-and-drop swap (dispatched from drag.js)
document.addEventListener('swapperiods', e => {
  swapPeriods(e.detail.a, e.detail.b);
  render();
});

// Tap "+" on an empty slot → open bank pre-targeted to that slot
document.addEventListener('addtoslot', e => {
  openBank(e.detail.period);
});

// Tap "＋ הוסף שיעור" at the bottom → open bank for next free slot
document.addEventListener('openbank', () => {
  openBank(null);
});

// ── Bank events ───────────────────────────────────────────────

// A subject row was tapped in the bank
document.addEventListener('lessonchosen', e => {
  addLesson(getTargetPeriod(), e.detail.lesson);
  closeBank();
  render();
});
