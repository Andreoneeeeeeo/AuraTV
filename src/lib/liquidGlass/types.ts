// Tipi condivisi dal motore Liquid Glass (LiquidGlass.tsx + useLiquidGlass.ts).

export type GlassVariant = 'card' | 'sheet' | 'pill' | 'nav' | 'panel' | 'button' | 'fab';

export type GlassQuality = 'high' | 'medium' | 'low';

export interface MagneticTarget {
  /** Identificatore stabile del bersaglio (es. "nav-tab-library"). */
  id: string;
  /** Ritorna il rettangolo corrente del bersaglio in coordinate viewport. */
  getRect: () => DOMRect | null;
  /** Raggio (px) entro cui il bersaglio comincia ad "attrarre" il pannello. */
  radius?: number;
}

export interface SnapPoint {
  id: string;
  x: number;
  y: number;
}

export interface LiquidGlassOptions {
  draggable?: boolean;
  elastic?: boolean;
  magnetic?: boolean;
  snap?: boolean;
  snapPoints?: SnapPoint[];
  magneticTargets?: MagneticTarget[];
  /** Asse di trascinamento consentito. Default: entrambi. */
  dragAxis?: 'x' | 'y' | 'both';
  /** Intensità del vetro 0-1 (spessore percepito, blur, riflessi). Default 1. */
  intensity?: number;
  onSnap?: (point: SnapPoint) => void;
  onDragStart?: () => void;
  onDragEnd?: (info: { x: number; y: number }) => void;
}
