const alignLoopItem = (track, index, behavior = "smooth") => {
  const item = track?.children[index];
  if (!item) return;
  const trackRect = track.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const left = itemRect.right - trackRect.right;
  if (behavior === "instant") {
    const previousBehavior = track.style.scrollBehavior;
    track.style.scrollBehavior = "auto";
    track.scrollBy({ left, behavior: "auto" });
    track.getBoundingClientRect();
    track.style.scrollBehavior = previousBehavior;
    return;
  }
  track.scrollBy({ left, behavior: "smooth" });
};

const syncDraggedLoop = (track) => {
  const count = Number(track?.dataset.loopCount || 0);
  if (!track || count < 2) return;
  const right = track.getBoundingClientRect().right;
  const closest = [...track.children].reduce(
    (best, child, index) => {
      const distance = Math.abs(child.getBoundingClientRect().right - right);
      return distance < best.distance ? { index, distance } : best;
    },
    { index: count, distance: Infinity },
  ).index;
  const normalized =
    closest < count
      ? closest + count
      : closest >= count * 2
        ? closest - count
        : closest;
  if (normalized !== closest) alignLoopItem(track, normalized, "instant");
  track.dataset.loopIndex = String(normalized);
};

const moveLoopTrack = (track, step) => {
  const count = Number(track?.dataset.loopCount || 0);
  if (!track || count < 2) return;
  window.clearTimeout(track._loopResetTimer);
  const current = Number(track.dataset.loopIndex || count);
  const target = current + step;
  alignLoopItem(track, target, "smooth");
  track.dataset.loopIndex = String(target);
  if (target >= count * 2 || target < count) {
    const normalized = target >= count * 2 ? target - count : target + count;
    track._loopResetTimer = window.setTimeout(() => {
      if (!track.isConnected) return;
      alignLoopItem(track, normalized, "instant");
      track.dataset.loopIndex = String(normalized);
    }, 520);
  }
};

const scrollHomeTrack = (ref, direction) => {
  moveLoopTrack(ref.current, direction < 0 ? 1 : -1);
};

function useAutoSlider(trackRef, itemCount, intervalSeconds) {
  useEffect(() => {
    if (itemCount < 2) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;
    const initialize = requestAnimationFrame(() => {
      alignLoopItem(track, itemCount, "instant");
      track.dataset.loopIndex = String(itemCount);
    });
    const delay = Math.max(2, Number(intervalSeconds) || 5) * 1000;
    const timer = setInterval(() => {
      if (
        document.hidden ||
        !trackRef.current ||
        trackRef.current.classList.contains("is-dragging")
      )
        return;
      moveLoopTrack(trackRef.current, 1);
    }, delay);
    return () => {
      cancelAnimationFrame(initialize);
      clearInterval(timer);
      window.clearTimeout(track._loopResetTimer);
    };
  }, [trackRef, itemCount, intervalSeconds]);
}

function useDragToScroll(trackRef) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let pointerId = null;
    let lastX = 0;
    let totalMovement = 0;
    let didDrag = false;
    let suppressClick = false;

    const finish = () => {
      if (pointerId !== null && track.hasPointerCapture(pointerId))
        track.releasePointerCapture(pointerId);
      pointerId = null;
      track.classList.remove("is-dragging");
      if (didDrag) {
        syncDraggedLoop(track);
        suppressClick = true;
        window.setTimeout(() => {
          suppressClick = false;
          didDrag = false;
        }, 160);
      }
    };
    const onPointerDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      pointerId = event.pointerId;
      lastX = event.clientX;
      totalMovement = 0;
      didDrag = false;
      suppressClick = false;
    };
    const onPointerMove = (event) => {
      if (pointerId !== event.pointerId) return;
      const movement = event.clientX - lastX;
      lastX = event.clientX;
      totalMovement += Math.abs(movement);
      if (totalMovement < 9) return;
      if (!track.hasPointerCapture(pointerId))
        track.setPointerCapture(pointerId);
      didDrag = true;
      track.classList.add("is-dragging");
      track.scrollLeft -= movement;
      event.preventDefault();
    };
    const onClick = (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    };
    const onDragStart = (event) => event.preventDefault();

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", finish);
    track.addEventListener("pointercancel", finish);
    track.addEventListener("click", onClick, true);
    track.addEventListener("dragstart", onDragStart);
    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", finish);
      track.removeEventListener("pointercancel", finish);
      track.removeEventListener("click", onClick, true);
      track.removeEventListener("dragstart", onDragStart);
      track.classList.remove("is-dragging");
    };
  }, [trackRef]);
}

function useAmazingCountdown(endsAt) {
  const calculate = () =>
    Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(() => (endsAt ? calculate() : 0));
  useEffect(() => {
    if (!endsAt) {
      setSeconds(0);
      return;
    }
    setSeconds(calculate());
    const timer = setInterval(() => setSeconds(calculate()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [days, hours, minutes, remainingSeconds];
}

