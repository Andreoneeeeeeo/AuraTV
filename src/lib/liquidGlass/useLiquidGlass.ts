import { useRef, useCallback, useState, useEffect } from 'react';
import { useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { getGlassQuality, forceQualityDowngrade } from './deviceQuality.ts';
import type { LiquidGlassOptions } from './types.ts';

const DRAG_SPRING = { bounceStiffness: 420, bounceDamping: 24, power: 0.28, timeConstant: 260 };

/**
 * Motore fisico + reattivo condiviso da ogni <LiquidGlass>.
 *
 * Espone dei MotionValue di Framer Motion (glowX/glowY, tiltX/tiltY,
 * pressScale, dragBlur, dragBrightness): aggiornarli NON causa un
 * re-render React, solo una scrittura diretta sul DOM via Framer Motion —
 * è quello che permette di restare fluidi a 60/120fps durante il gesto,
 * invece di ricalcolare l'intero componente ad ogni pixel di movimento.
 */
export function useLiquidGlass(options: LiquidGlassOptions = {}) {
  const {
    draggable = false,
    elastic = true,
    magnetic = false,
    snap = false,
    magneticTargets = [],
    dragAxis = 'both',
    onSnap,
    onDragStart,
    onDragEnd,
  } = options;

  const quality = getGlassQuality();
  const ref = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const tiltX = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });
  const tiltY = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });
  const pressScale = useSpring(1, { stiffness: 380, damping: 26, mass: 0.7 });
  const dragBlur = useSpring(0, { stiffness: 200, damping: 24 });
  const dragBrightness = useSpring(1, { stiffness: 200, damping: 24 });

  const [isDragging, setIsDragging] = useState(false);
  const [nearestTargetId, setNearestTargetId] = useState<string | null>(null);

  // Frame-rate guard leggero: se il dispositivo comincia a "scattare"
  // durante un drag, degradiamo la qualità per il resto della sessione.
  const lastFrameTime = useRef(0);
  const slowFrameCount = useRef(0);
  const monitorFrame = useCallback((time: number) => {
    if (lastFrameTime.current) {
      const delta = time - lastFrameTime.current;
      if (delta > 34) slowFrameCount.current += 1; // sotto ~30fps
      if (slowFrameCount.current > 6) forceQualityDowngrade();
    }
    lastFrameTime.current = time;
    if (isDragging) rafRef.current = requestAnimationFrame(monitorFrame);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging && quality !== 'low') {
      rafRef.current = requestAnimationFrame(monitorFrame);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isDragging, quality, monitorFrame]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || quality === 'low') return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    glowX.set(Math.max(0, Math.min(100, px)));
    glowY.set(Math.max(0, Math.min(100, py)));
    if (quality === 'high' && !isDragging) {
      tiltX.set((py - 50) / -14);
      tiltY.set((px - 50) / 14);
    }
  }, [quality, glowX, glowY, tiltX, tiltY, isDragging]);

  const handlePointerLeave = useCallback(() => {
    glowX.set(50);
    glowY.set(50);
    tiltX.set(0);
    tiltY.set(0);
  }, [glowX, glowY, tiltX, tiltY]);

  const handlePressStart = useCallback(() => {
    pressScale.set(1.015);
    if (quality !== 'low') dragBlur.set(1.5);
    dragBrightness.set(1.05);
  }, [pressScale, dragBlur, dragBrightness, quality]);

  const resetPress = useCallback(() => {
    pressScale.set(1);
    dragBlur.set(0);
    dragBrightness.set(1);
  }, [pressScale, dragBlur, dragBrightness]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    pressScale.set(1.045);
    dragBlur.set(quality === 'low' ? 1 : 4);
    dragBrightness.set(1.12);
    onDragStart?.();
  }, [pressScale, dragBlur, dragBrightness, quality, onDragStart]);

  const handleDrag = useCallback((_e: unknown, info: { point: { x: number; y: number } }) => {
    if (quality === 'high') {
      tiltY.set(Math.max(-10, Math.min(10, (info.point.x - (ref.current?.getBoundingClientRect().left ?? 0)) / 40)));
    }
    if (!magnetic || magneticTargets.length === 0) return;
    let closest: { id: string; dist: number } | null = null;
    for (const target of magneticTargets) {
      const rect = target.getRect();
      if (!rect) continue;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(info.point.x - cx, info.point.y - cy);
      const radius = target.radius ?? 80;
      if (dist < radius && (!closest || dist < closest.dist)) closest = { id: target.id, dist };
    }
    setNearestTargetId(closest?.id ?? null);
  }, [magnetic, magneticTargets, quality, tiltY]);

  const handleDragEnd = useCallback((_e: unknown, info: { point: { x: number; y: number } }) => {
    setIsDragging(false);
    resetPress();
    tiltX.set(0);
    tiltY.set(0);

    if (snap && nearestTargetId) {
      const target = magneticTargets.find((t) => t.id === nearestTargetId);
      const rect = target?.getRect();
      if (rect) onSnap?.({ id: nearestTargetId, x: rect.left, y: rect.top });
    }
    setNearestTargetId(null);
    onDragEnd?.({ x: info.point.x, y: info.point.y });
  }, [snap, nearestTargetId, magneticTargets, onSnap, onDragEnd, resetPress, tiltX, tiltY]);

  const dragProps = draggable ? {
    drag: (dragAxis === 'both' ? true : dragAxis) as boolean | 'x' | 'y',
    dragElastic: elastic ? 0.18 : 0.04,
    dragMomentum: true,
    dragTransition: DRAG_SPRING,
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  } : {};

  // Motion value "composti": Framer Motion li ricalcola internamente ad ogni
  // frame senza mai passare da React — è ciò che rende fluido a 60/120fps
  // sia il filtro (blur + luminosità dinamici) sia il riflesso che segue
  // il dito, anche mentre l'utente sta trascinando il pannello.
  const dynamicFilter = useMotionTemplate`blur(${dragBlur}px) brightness(${dragBrightness})`;
  const glowOpacity = quality === 'low' ? 0 : quality === 'medium' ? 0.16 : 0.28;
  const glowBackground = useMotionTemplate`radial-gradient(140px circle at ${glowX}% ${glowY}%, rgba(255,255,255,${glowOpacity}), transparent 72%)`;

  return {
    ref,
    quality,
    isDragging,
    nearestTargetId,
    glowX, glowY, tiltX, tiltY, pressScale, dragBlur, dragBrightness,
    dynamicFilter,
    glowBackground,
    pointerHandlers: {
      onPointerMove: handlePointerMove,
      onPointerLeave: handlePointerLeave,
    },
    pressHandlers: {
      onTapStart: handlePressStart,
      onTap: resetPress,
      onTapCancel: resetPress,
    },
    dragProps,
  };
}
