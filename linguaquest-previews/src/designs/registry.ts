import type { Direction } from '../core/types';
import { LowPolyApp, LowPolyThumb } from './lowpoly/LowPolyApp';
import { MinimalApp, MinimalThumb } from './minimal/MinimalApp';
import { PixelApp, PixelThumb } from './pixel/PixelApp';
import { SoftApp, SoftThumb } from './soft/SoftApp';

/**
 * The four directions, in presentation order. Each entry carries its own
 * design rationale so the shell can present it like a design review.
 */
export const DIRECTIONS: Direction[] = [
  {
    id: 'pixel',
    letter: 'A',
    name: 'Bright Pixel Adventure',
    tagline: 'A retro adventure, rebuilt with modern mobile UX.',
    intent:
      'Learning as a small overworld you return to every day. Stages sit on a snake-shaped road to Paris, rewards are blocky treasures, and Pip guides you from a speech bubble. Crisp 4px world pixels keep it nostalgic; generous type and clear cards keep it current.',
    keywords: ['Nostalgic', 'Collectible', 'Game-first', 'Crisp'],
    palette: [
      { name: 'Cream', hex: '#FFF6E0' },
      { name: 'Ink', hex: '#2B2340' },
      { name: 'Sky', hex: '#8FD3FF' },
      { name: 'Leaf', hex: '#74CC4C' },
      { name: 'Gold', hex: '#FFC93C' },
      { name: 'Flame', hex: '#FF6B4A' },
      { name: 'Gem', hex: '#A66BFF' },
    ],
    type: {
      display: 'Pixelify Sans',
      displayFamily: "'Pixelify Sans Variable', monospace",
      body: 'Silkscreen (labels)',
      bodyFamily: "'Silkscreen', monospace",
    },
    cost: { illustration: 2, engineering: 2, motion: 2 },
    strengths: [
      'Strongest “come back tomorrow” pull: map, stages and treasure read instantly as a game.',
      'Sprites are text grids in code — anyone on the team can draw or tweak them.',
      'Tiny asset footprint; everything is SVG rects and box-shadows.',
    ],
    risks: [
      'Pixel type limits long-form content and non-Latin scripts; needs a fallback text face.',
      'Can tip into “kids’ game” for adult learners if copy and pacing aren’t mature.',
    ],
    statusTone: 'dark',
    thumbBg: '#8fd3ff',
    App: PixelApp,
    Thumb: PixelThumb,
  },
  {
    id: 'minimal',
    letter: 'B',
    name: 'Minimal Flat',
    tagline: 'Calm, premium, unmistakably clear.',
    intent:
      'A mature product that motivates through clarity rather than spectacle. One green action, one amber reward colour, an editorial serif for moments that matter, and a stepper path that always answers “what next?” Pip is reduced to five flat shapes.',
    keywords: ['Calm', 'Premium', 'Legible', 'Systematic'],
    palette: [
      { name: 'Ivory', hex: '#FAF7F1' },
      { name: 'Charcoal', hex: '#1F201D' },
      { name: 'Green', hex: '#17804A' },
      { name: 'Green tint', hex: '#E7F3EC' },
      { name: 'Amber', hex: '#E0912F' },
      { name: 'Line', hex: '#E9E4DA' },
    ],
    type: {
      display: 'Fraunces',
      displayFamily: "'Fraunces Variable', Georgia, serif",
      body: 'Manrope',
      bodyFamily: "'Manrope Variable', sans-serif",
    },
    cost: { illustration: 1, engineering: 1, motion: 1 },
    strengths: [
      'Fastest to build and to extend — plain components, tokens and one icon set.',
      'Highest legibility and accessibility headroom; scales to long content and more languages.',
      'Feels credible to adult and professional learners.',
    ],
    risks: [
      'Less emotional pull: delight must come from copy, motion and streak mechanics.',
      'Easy to drift into “productivity app” and lose the playful promise.',
    ],
    statusTone: 'dark',
    thumbBg: '#f3efe7',
    App: MinimalApp,
    Thumb: MinimalThumb,
  },
  {
    id: 'soft',
    letter: 'C',
    name: 'Soft 2.5D Mascot World',
    tagline: 'A toy-like world with a mascot you want to hug.',
    intent:
      'Pip becomes a soft, clay-like character living on a floating island above pastel hills, with Paris on the horizon. Every tappable thing has thickness and a contact shadow, so cards and stepping stones feel like objects you can press.',
    keywords: ['Warm', 'Expressive', 'Dimensional', 'Character-led'],
    palette: [
      { name: 'Sky', hex: '#9FD6FF' },
      { name: 'Cream', hex: '#FFF7EA' },
      { name: 'Slate ink', hex: '#27384D' },
      { name: 'Leaf', hex: '#3FAE56' },
      { name: 'Sun', hex: '#FFC248' },
      { name: 'Coral', hex: '#FF7F63' },
      { name: 'Lilac', hex: '#9A83FF' },
    ],
    type: {
      display: 'Fredoka',
      displayFamily: "'Fredoka Variable', sans-serif",
      body: 'Nunito',
      bodyFamily: "'Nunito Variable', sans-serif",
    },
    cost: { illustration: 4, engineering: 3, motion: 3 },
    strengths: [
      'Highest emotional appeal; the mascot can carry encouragement, reactions and marketing.',
      'Depth makes the primary action feel physically pressable.',
      'Scenery can change per unit (café, station, Paris) to signal progress.',
    ],
    risks: [
      'Needs an illustrator for each new pose, expression and scene; SVG placeholders only go so far.',
      'Scenery can compete with content if density grows — guard contrast on the sheet.',
    ],
    statusTone: 'dark',
    thumbBg: 'linear-gradient(#9fd6ff, #d9f1ff)',
    App: SoftApp,
    Thumb: SoftThumb,
  },
  {
    id: 'lowpoly',
    letter: 'D',
    name: 'Low-Poly 3D World',
    tagline: 'A geometric expedition across floating islands.',
    intent:
      'Learning framed as an expedition: faceted mountains, floating islands and a route that climbs from the harbour to Paris. Each lesson is a stop with its own landmark. A dark HUD layer keeps the interface crisp over a bright, angular world.',
    keywords: ['Adventurous', 'Geometric', 'Distinctive', 'Journey'],
    palette: [
      { name: 'Sky', hex: '#86C2E4' },
      { name: 'Forest', hex: '#2F7D4F' },
      { name: 'Ember', hex: '#E0894B' },
      { name: 'Cream', hex: '#F6EEDC' },
      { name: 'Slate', hex: '#1C2B3A' },
      { name: 'Rock', hex: '#A86C43' },
    ],
    type: {
      display: 'Chakra Petch',
      displayFamily: "'Chakra Petch', sans-serif",
      body: 'Barlow',
      bodyFamily: "'Barlow', sans-serif",
    },
    cost: { illustration: 3, engineering: 3, motion: 2 },
    strengths: [
      'Most distinctive silhouette in the category — no one will mistake it for a competitor.',
      'Terrain, islands and trees are parametric components, so new units are cheap to compose.',
      'The “route to Paris” makes long-term progress tangible.',
    ],
    risks: [
      'Angular type and dark HUD read cooler and less friendly for absolute beginners.',
      'Facet shading needs discipline (one light direction) or scenes get noisy.',
    ],
    statusTone: 'dark',
    thumbBg: 'linear-gradient(#86c2e4, #d6ebf2)',
    App: LowPolyApp,
    Thumb: LowPolyThumb,
  },
];
