import type { ComponentType } from 'react';
import type { PreviewModel } from './model';

export const DESIGN_IDS = ['pixel', 'minimal', 'soft', 'lowpoly'] as const;
export type DesignId = (typeof DESIGN_IDS)[number];

export interface DesignProps {
  model: PreviewModel;
}

export interface Swatch {
  name: string;
  hex: string;
}

/** Everything the comparison shell needs to know about one direction. */
export interface Direction {
  id: DesignId;
  letter: 'A' | 'B' | 'C' | 'D';
  name: string;
  tagline: string;
  intent: string;
  keywords: string[];
  palette: Swatch[];
  type: { display: string; displayFamily: string; body: string; bodyFamily: string };
  /** 1 (light) – 5 (heavy) */
  cost: { illustration: number; engineering: number; motion: number };
  strengths: string[];
  risks: string[];
  /** Status bar foreground over the top of this design. */
  statusTone: 'dark' | 'light';
  /** Backdrop used behind this direction's thumbnail in the shell. */
  thumbBg: string;
  App: ComponentType<DesignProps>;
  Thumb: ComponentType;
}
