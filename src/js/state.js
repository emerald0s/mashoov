/**
 * state.js
 * Single source of truth for all mutable application state.
 * Persists changes to localStorage so edits survive page refresh.
 * On first load (or if storage is cleared) falls back to DEFAULT_TIMETABLE.
 */

import { DEFAULT_TIMETABLE } from './data.js';

const STORAGE_KEY = 'mashov_timetable_v1';

/** Currently visible day index (0 = ראשון … 6 = שבת) */
export let currentDay = 0;

/** Whether the drag-and-drop edit mode is active */
export let editMode = false;

/**
 * Live timetable.
 * Loaded from localStorage if available, otherwise deep-cloned from DEFAULT_TIMETABLE.
 * Shape: { [dayIndex]: { [periodNumber]: { s, t, r } } }
 */
export let timetable = loadTimetable();

// ── Persistence ──────────────────────────────────────────────

function loadTimetable() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // localStorage unavailable or data corrupt — fall through to default
  }
  return JSON.parse(JSON.stringify(DEFAULT_TIMETABLE));
}

function saveTimetable() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timetable));
  } catch (e) {
    // Storage full or unavailable — silently ignore
  }
}

// ── Setters ──────────────────────────────────────────────────

export function setCurrentDay(day) {
  currentDay = day;
}

export function setEditMode(value) {
  editMode = value;
}

/**
 * Swap two periods on the current day, then persist.
 */
export function swapPeriods(a, b) {
  if (!timetable[currentDay]) timetable[currentDay] = {};
  const dd = timetable[currentDay];
  const la = dd[a];
  const lb = dd[b];
  if (la) dd[b] = la; else delete dd[b];
  if (lb) dd[a] = lb; else delete dd[a];
  saveTimetable();
}

/**
 * Delete the lesson at period p on the current day, then persist.
 */
export function deleteLesson(p) {
  if (timetable[currentDay]) {
    delete timetable[currentDay][p];
    saveTimetable();
  }
}

/**
 * Add or replace a lesson on the current day, then persist.
 * @param {number|null} targetPeriod  Specific period to fill, or null to find next free slot.
 * @param {object}      lesson        { s, t, r }
 */
export function addLesson(targetPeriod, lesson) {
  if (!timetable[currentDay]) timetable[currentDay] = {};
  const dd = timetable[currentDay];

  if (targetPeriod !== null) {
    dd[targetPeriod] = { ...lesson };
  } else {
    const maxP = Math.max(11, ...Object.keys(dd).map(Number));
    let slot = null;
    for (let p = 1; p <= maxP + 1; p++) {
      if (!dd[p]) { slot = p; break; }
    }
    dd[slot ?? maxP + 1] = { ...lesson };
  }
  saveTimetable();
}