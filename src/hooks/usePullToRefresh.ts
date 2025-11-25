// src/hooks/usePullToRefresh.ts
import { useCallback, useEffect, useRef, useState } from 'react';

type MaybeElement = HTMLElement | Window | null;

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // px required to trigger refresh
  disabled?: boolean;
  /**
   * If your scrollable area is not window (e.g. a virt-list container),
   * pass its HTMLElement ref.current here.
   */
  container?: MaybeElement;
  /**
   * Whether to call preventDefault on touchmove while pulling.
   * Default: true (prevents native overscroll on mobile).
   */
  preventDefaultWhilePulling?: boolean;
  /**
   * Resistance factor for the pull distance visual. >0.0 (default 0.5)
   * Lower means more resistance (smaller visible pull for same finger movement).
   */
  resistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
  container = typeof window !== 'undefined' ? window : null,
  preventDefaultWhilePulling = true,
  resistance = 0.5,
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // mutable refs to avoid re-attaching listeners
  const onRefreshRef = useRef(onRefresh);
  const disabledRef = useRef(disabled);
  const thresholdRef = useRef(threshold);
  const resistanceRef = useRef(resistance);
  const containerRef = useRef<MaybeElement>(container);

  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);
  const activeTouchId = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // refs to wrapper listeners so we can remove them later
  const touchStartWrapperRef = useRef<EventListener | null>(null);
  const touchMoveWrapperRef = useRef<EventListener | null>(null);
  const touchEndWrapperRef = useRef<EventListener | null>(null);
  const pointerDownWrapperRef = useRef<EventListener | null>(null);
  const pointerMoveWrapperRef = useRef<EventListener | null>(null);
  const pointerUpWrapperRef = useRef<EventListener | null>(null);

  // keep refs up-to-date
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    resistanceRef.current = resistance;
  }, [resistance]);

  useEffect(() => {
    containerRef.current = container;
  }, [container]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resetPull = useCallback(() => {
    startY.current = null;
    currentY.current = null;
    activeTouchId.current = null;
    if (mountedRef.current) {
      setIsPulling(false);
      setPullDistance(0);
    }
  }, []);

  // helper to get vertical scroll position of container
  const getScrollTop = useCallback((): number => {
    const el = containerRef.current;
    if (!el) return 0;
    if (el === window) {
      return window.scrollY || window.pageYOffset || 0;
    }
    try {
      return (el as HTMLElement).scrollTop;
    } catch {
      return 0;
    }
  }, []);

  // typed handlers (internal logic remains typed)
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabledRef.current || isRefreshing) return;
    if (getScrollTop() > 0) return;

    const t = e.changedTouches[0];
    startY.current = t.clientY;
    currentY.current = t.clientY;
    activeTouchId.current = t.identifier;
    setIsPulling(true);
  }, [getScrollTop, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabledRef.current || isRefreshing) return;
    if (!isPulling) return;
    if (activeTouchId.current == null) return;

    let touch: Touch | null = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId.current) {
        touch = e.changedTouches[i];
        break;
      }
    }
    if (!touch) return;

    const y = touch.clientY;
    currentY.current = y;
    const rawDistance = Math.max(0, (y - (startY.current ?? y)));

    const distance = rawDistance * (1 - resistanceRef.current);
    const clamped = Math.min(distance, thresholdRef.current * 1.8);
    if (mountedRef.current) setPullDistance(clamped);

    if (preventDefaultWhilePulling) {
      e.preventDefault();
    }
  }, [isPulling, isRefreshing, preventDefaultWhilePulling]);

  const handleTouchEnd = useCallback(async (_evt?: TouchEvent) => {
    if (!isPulling || isRefreshing) {
      resetPull();
      return;
    }

    try {
      if (pullDistance >= thresholdRef.current) {
        if (mountedRef.current) setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('pull-to-refresh onRefresh error', err);
        } finally {
          if (mountedRef.current) setIsRefreshing(false);
        }
      }
    } finally {
      resetPull();
    }
  }, [pullDistance, resetPull, isPulling, isRefreshing]);

  // pointer fallback (desktop)
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if ((e as PointerEvent).pointerType === 'mouse' && (e as PointerEvent).button !== 0) return;
    if (disabledRef.current || isRefreshing) return;
    if (getScrollTop() > 0) return;

    startY.current = (e as PointerEvent).clientY;
    currentY.current = (e as PointerEvent).clientY;
    activeTouchId.current = -1;
    setIsPulling(true);
  }, [getScrollTop, isRefreshing]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isPulling || isRefreshing) return;
    const y = (e as PointerEvent).clientY;
    currentY.current = y;
    const rawDistance = Math.max(0, y - (startY.current ?? y));
    const distance = rawDistance * (1 - resistanceRef.current);
    const clamped = Math.min(distance, thresholdRef.current * 1.8);
    if (mountedRef.current) setPullDistance(clamped);
    if (preventDefaultWhilePulling) {
      (e as PointerEvent).preventDefault();
    }
  }, [isPulling, isRefreshing, preventDefaultWhilePulling]);

  const handlePointerUp = useCallback(async () => {
    if (!isPulling || isRefreshing) {
      resetPull();
      return;
    }
    try {
      if (pullDistance >= thresholdRef.current) {
        if (mountedRef.current) setIsRefreshing(true);
        try {
          await onRefreshRef.current();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('pull-to-refresh onRefresh error', err);
        } finally {
          if (mountedRef.current) setIsRefreshing(false);
        }
      }
    } finally {
      resetPull();
    }
  }, [isPulling, isRefreshing, pullDistance, resetPull]);

  // attach global listeners once — use wrappers that are EventListener
  useEffect(() => {
    const el = containerRef.current ?? window;
    const touchStartTarget = el === window ? document : (el as HTMLElement);
    const touchMoveTarget = touchStartTarget;
    const touchEndTarget = touchStartTarget;

    // create wrappers that narrow the Event -> TouchEvent/PointerEvent
    const touchStartWrapper: EventListener = (evt: Event) => handleTouchStart(evt as TouchEvent);
    const touchMoveWrapper: EventListener = (evt: Event) => handleTouchMove(evt as TouchEvent);
    const touchEndWrapper: EventListener = (evt: Event) => handleTouchEnd(evt as TouchEvent);

    const pointerDownWrapper: EventListener = (evt: Event) => handlePointerDown(evt as PointerEvent);
    const pointerMoveWrapper: EventListener = (evt: Event) => handlePointerMove(evt as PointerEvent);
    const pointerUpWrapper: EventListener = (evt: Event) => handlePointerUp();

    // store wrappers so cleanup can remove the exact same references
    touchStartWrapperRef.current = touchStartWrapper;
    touchMoveWrapperRef.current = touchMoveWrapper;
    touchEndWrapperRef.current = touchEndWrapper;
    pointerDownWrapperRef.current = pointerDownWrapper;
    pointerMoveWrapperRef.current = pointerMoveWrapper;
    pointerUpWrapperRef.current = pointerUpWrapper;

    touchStartTarget.addEventListener('touchstart', touchStartWrapper, { passive: true });
    touchMoveTarget.addEventListener('touchmove', touchMoveWrapper, {
      passive: preventDefaultWhilePulling ? false : true,
    });
    touchEndTarget.addEventListener('touchend', touchEndWrapper);

    window.addEventListener('pointerdown', pointerDownWrapper);
    window.addEventListener('pointermove', pointerMoveWrapper);
    window.addEventListener('pointerup', pointerUpWrapper);

    return () => {
      // cleanup exact wrappers
      if (touchStartWrapperRef.current) touchStartTarget.removeEventListener('touchstart', touchStartWrapperRef.current);
      if (touchMoveWrapperRef.current) touchMoveTarget.removeEventListener('touchmove', touchMoveWrapperRef.current);
      if (touchEndWrapperRef.current) touchEndTarget.removeEventListener('touchend', touchEndWrapperRef.current);

      if (pointerDownWrapperRef.current) window.removeEventListener('pointerdown', pointerDownWrapperRef.current);
      if (pointerMoveWrapperRef.current) window.removeEventListener('pointermove', pointerMoveWrapperRef.current);
      if (pointerUpWrapperRef.current) window.removeEventListener('pointerup', pointerUpWrapperRef.current);

      // clear refs
      touchStartWrapperRef.current = null;
      touchMoveWrapperRef.current = null;
      touchEndWrapperRef.current = null;
      pointerDownWrapperRef.current = null;
      pointerMoveWrapperRef.current = null;
      pointerUpWrapperRef.current = null;
    };
    // intentionally leave handlers stable (no re-attach)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preventDefaultWhilePulling]);

  // trigger helper
  const triggerRefresh = useCallback(async () => {
    if (isRefreshing) return;
    try {
      if (mountedRef.current) setIsRefreshing(true);
      await onRefreshRef.current();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('triggerRefresh error', err);
    } finally {
      if (mountedRef.current) setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / (threshold || 1), 1),
    triggerRefresh,
    resetPull,
  };
}
