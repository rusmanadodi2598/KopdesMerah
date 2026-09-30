// Input keyboard + sentuh. Handler murni agar bisa diuji di node;
// attach() hanya wiring event DOM.
export function createInput() {
  const keys = new Set();
  const touch = { dx: 0, dy: 0, active: false };
  let touchId = null;
  let originX = 0;
  let originY = 0;

  function handleKeyDown(e) {
    keys.add(e.code);
  }

  function handleKeyUp(e) {
    keys.delete(e.code);
  }

  function isDown(code) {
    return keys.has(code);
  }

  function onTouchStart(e) {
    const t = e.changedTouches[0];
    touchId = t.identifier;
    originX = t.clientX;
    originY = t.clientY;
    touch.active = true;
    touch.dx = 0;
    touch.dy = 0;
  }

  function onTouchMove(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        touch.dx = (t.clientX - originX) / 60;
        touch.dy = (t.clientY - originY) / 60;
      }
    }
  }

  function onTouchEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === touchId) {
        touchId = null;
        touch.active = false;
        touch.dx = 0;
        touch.dy = 0;
      }
    }
  }

  function attach(el) {
    el.addEventListener('keydown', handleKeyDown);
    el.addEventListener('keyup', handleKeyUp);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }

  function detach(el) {
    el.removeEventListener('keydown', handleKeyDown);
    el.removeEventListener('keyup', handleKeyUp);
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
    el.removeEventListener('touchcancel', onTouchEnd);
  }

  return { isDown, handleKeyDown, handleKeyUp, attach, detach, touch };
}
