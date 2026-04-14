/**
 * drag.js
 * Handles drag-and-drop reordering of period cards.
 * Supports both the HTML5 Drag API (desktop) and Touch events (mobile).
 *
 * When a swap is completed it dispatches 'swapperiods' { detail: { a, b } }
 * so that main.js can update state and re-render.
 */

// ── Desktop drag ─────────────────────────────────────────────

let dragSource = null;

export function attachDesktopDrag(card, periodIndex) {
  card.setAttribute('draggable', 'true');

  card.addEventListener('dragstart', e => {
    dragSource = periodIndex;
    card.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.style.opacity = '';
    document.querySelectorAll('.card').forEach(c => c.classList.remove('drag-over'));
  });
}

export function attachDropTarget(card, periodIndex) {
  card.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    card.classList.add('drag-over');
  });

  card.addEventListener('dragleave', () => {
    card.classList.remove('drag-over');
  });

  card.addEventListener('drop', e => {
    e.preventDefault();
    card.classList.remove('drag-over');
    if (dragSource !== null && dragSource !== periodIndex) {
      document.dispatchEvent(new CustomEvent('swapperiods', {
        detail: { a: dragSource, b: periodIndex }
      }));
    }
    dragSource = null;
  });
}

// ── Touch drag ───────────────────────────────────────────────

let touchSrc    = null;
let touchClone  = null;
let touchStartY = 0;
let touchOrigin = null;

/**
 * Call once after the DOM is ready to attach global touch listeners.
 */
export function initTouchDrag() {
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove',  onTouchMove,  { passive: true });
  document.addEventListener('touchend',   onTouchEnd,   { passive: true });
}

function onTouchStart(e) {
  // Only active in edit mode — check class on the list container
  const list = document.getElementById('periodList');
  if (!list.classList.contains('edit-mode')) return;

  const card = e.target.closest('.card.filled');
  if (!card) return;

  touchSrc    = parseInt(card.dataset.period);
  touchOrigin = card;
  touchStartY = e.touches[0].clientY;

  // Create a floating visual clone
  touchClone = card.cloneNode(true);
  const rect = card.getBoundingClientRect();
  Object.assign(touchClone.style, {
    position:   'fixed',
    top:        rect.top + 'px',
    left:       rect.left + 'px',
    width:      rect.width + 'px',
    opacity:    '0.82',
    zIndex:     '999',
    pointerEvents: 'none',
    boxShadow:  '0 6px 20px rgba(0,0,0,.25)',
    transition: 'none',
  });
  document.body.appendChild(touchClone);
  card.style.opacity = '0.3';
}

function onTouchMove(e) {
  if (!touchClone) return;
  const dy = e.touches[0].clientY - touchStartY;
  touchClone.style.transform = `translateY(${dy}px)`;
}

function onTouchEnd(e) {
  if (touchSrc === null || !touchClone) return;

  const touch = e.changedTouches[0];

  // Temporarily hide the clone so elementFromPoint hits the card underneath
  touchClone.style.display = 'none';
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  touchClone.style.display = '';

  const destCard = target && target.closest('.card');
  if (destCard) {
    const dest = parseInt(destCard.dataset.period);
    if (dest !== touchSrc) {
      document.dispatchEvent(new CustomEvent('swapperiods', {
        detail: { a: touchSrc, b: dest }
      }));
    }
  }

  // Clean up
  touchClone.remove();
  touchClone = null;
  if (touchOrigin) { touchOrigin.style.opacity = ''; touchOrigin = null; }
  touchSrc = null;
}
