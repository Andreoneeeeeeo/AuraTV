import { forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { useLiquidGlass } from './useLiquidGlass.ts';
import type { LiquidGlassOptions, GlassVariant } from './types.ts';

export interface LiquidGlassProps extends LiquidGlassOptions {
  variant?: GlassVariant;
  floating?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: () => void;
  as?: 'div' | 'section' | 'nav' | 'aside';
}

const VARIANT_RADIUS: Record<GlassVariant, number> = {
  card: 18,
  sheet: 28,
  pill: 999,
  nav: 28,
  panel: 20,
  button: 16,
  fab: 999,
};

// Curve di movimento fisiche, mai lineari: quella "elastica" per il primo
// ingresso (con leggero overshoot), quella "expo" per i cambi di stato.
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const SPRING_ENTER = { type: 'spring', stiffness: 340, damping: 26, mass: 0.8 } as const;

/**
 * Motore Liquid Glass riutilizzabile: vetro traslucido con blur dinamico,
 * riflesso che segue il puntatore, leggero tilt di profondità, e — quando
 * `draggable` è attivo — trascinamento con inerzia, elasticità ai bordi,
 * magnetismo verso bersagli vicini e snap.
 *
 * Non usa WebGL/shader: la "rifrazione" è ottenuta con un filtro SVG
 * (feDisplacementMap) applicato solo sui dispositivi più performanti,
 * mantenendo comunque 60fpx anche su hardware modesto grazie alla
 * riduzione automatica di qualità (vedi deviceQuality.ts).
 */
const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(function LiquidGlass(
  {
    variant = 'panel',
    floating = false,
    draggable = false,
    elastic = true,
    magnetic = false,
    snap = false,
    snapPoints,
    magneticTargets,
    dragAxis = 'both',
    intensity = 1,
    className = '',
    style,
    children,
    onClick,
    onSnap,
    onDragStart,
    onDragEnd,
    as = 'div',
    ...rest
  },
  forwardedRef,
) {
  const glass = useLiquidGlass({
    draggable, elastic, magnetic, snap, snapPoints, magneticTargets, dragAxis, intensity, onSnap, onDragStart, onDragEnd,
  });

  useImperativeHandle(forwardedRef, () => glass.ref.current as HTMLDivElement);

  const radius = VARIANT_RADIUS[variant];
  const filterId = glass.quality === 'high' ? 'liquid-glass-refraction-high' : glass.quality === 'medium' ? 'liquid-glass-refraction-medium' : null;
  const blurAmount = glass.quality === 'low' ? 14 : glass.quality === 'medium' ? 20 : 26 * intensity;
  const bgOpacity = glass.quality === 'low' ? 62 : 48;

  return (
    <motion.div
      ref={glass.ref}
      {...glass.pointerHandlers}
      {...glass.pressHandlers}
      {...glass.dragProps}
      onClick={onClick}
      className={`liquid-glass liquid-glass--${variant} ${floating ? 'liquid-glass--floating' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.18, ease: EASE_OUT_EXPO } }}
      transition={SPRING_ENTER}
      style={{
        position: 'relative',
        borderRadius: radius,
        overflow: 'hidden',
        scale: glass.pressScale,
        rotateX: glass.tiltX,
        rotateY: glass.tiltY,
        transformStyle: 'preserve-3d',
        transformPerspective: 900,
        background: `color-mix(in srgb, var(--surface-raised) ${bgOpacity}%, transparent)`,
        backdropFilter: `${filterId ? `url(#${filterId}) ` : ''}blur(${blurAmount}px) saturate(190%)`,
        WebkitBackdropFilter: `blur(${blurAmount}px) saturate(190%)`,
        border: '1px solid color-mix(in srgb, var(--text) 13%, transparent)',
        boxShadow: glass.isDragging
          ? '0 22px 60px rgba(0,0,0,0.38), 0 4px 14px rgba(0,0,0,0.22)'
          : 'var(--shadow-md)',
        filter: glass.dynamicFilter,
        cursor: draggable ? 'grab' : onClick ? 'pointer' : undefined,
        touchAction: draggable ? (dragAxis === 'x' ? 'pan-y' : dragAxis === 'y' ? 'pan-x' : 'none') : undefined,
        willChange: 'transform, filter',
        ...style,
      }}
      {...rest}
    >
      {/* Riflesso di specchio del bordo superiore: la "luce che coglie il vetro" */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          padding: 1,
          background: 'linear-gradient(165deg, color-mix(in srgb, var(--text) 32%, transparent), transparent 45%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Riflesso che segue il dito/puntatore */}
      {glass.quality !== 'low' && (
        <motion.div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
            mixBlendMode: 'overlay',
            background: glass.glowBackground,
          }}
        />
      )}

      {/* Rumore leggerissimo, per rompere la piattezza del gradiente */}
      {glass.quality === 'high' && (
        <div aria-hidden="true" className="liquid-glass__noise" />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
});

export default LiquidGlass;
