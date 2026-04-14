/**
 * bank.js
 * Controls the subject bank bottom-sheet:
 * opening, closing, filtering, and wiring up the rendered rows.
 */

import { SUBJECT_BANK } from './data.js';
import { renderBank } from './render.js';

const overlay  = () => document.getElementById('bankOverlay');
const input    = () => document.getElementById('bankQ');

/** Which period to fill; null means "find the next free slot". */
let targetPeriod = null;

// ── Public API ────────────────────────────────────────────────

/**
 * Open the bank sheet.
 * @param {number|null} period  Period number to fill, or null for auto.
 */
export function openBank(period = null) {
  targetPeriod = period;
  input().value = '';
  renderBank(SUBJECT_BANK);
  overlay().classList.add('open');
  setTimeout(() => input().focus(), 80);
}

export function closeBank() {
  overlay().classList.remove('open');
  targetPeriod = null;
}

/** Returns the currently targeted period (used by main.js on lessonchosen). */
export function getTargetPeriod() {
  return targetPeriod;
}

// ── Wire up static DOM events ─────────────────────────────────

export function initBank() {
  // Close on backdrop tap
  overlay().addEventListener('click', e => {
    if (e.target === overlay()) closeBank();
  });

  // Close button
  document.getElementById('bankCloseBtn').addEventListener('click', closeBank);

  // Live search filter
  input().addEventListener('input', () => {
    const q = input().value.trim();
    const filtered = q
      ? SUBJECT_BANK.filter(x =>
          x.s.includes(q) || x.t.includes(q) || x.r.includes(q)
        )
      : SUBJECT_BANK;
    renderBank(filtered);
  });
}
