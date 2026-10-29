/**
 * Minimal Flat icon set: 24px grid, 1.75 stroke, round caps and joins.
 * One component, named glyphs, so the whole set stays consistent.
 */

const GLYPHS = {
  learn: (
    <>
      <path d="M4 19.5V6.5A2.5 2.5 0 0 1 6.5 4H12v15.5H6.5A2.5 2.5 0 0 0 4 22" />
      <path d="M20 19.5V6.5A2.5 2.5 0 0 0 17.5 4H12v15.5h5.5A2.5 2.5 0 0 1 20 22" />
    </>
  ),
  practice: (
    <>
      <rect x="3" y="7" width="13" height="14" rx="2.5" />
      <path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V16" />
    </>
  ),
  progress: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-4M12 16V7M17 16v-6" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
    </>
  ),
  flame: <path d="M12 21.5c3.9 0 6.5-2.6 6.5-6.3 0-3.4-2.3-5.6-3.8-7.6-.4 1.7-1.3 2.8-2.4 3.3.2-3.4-1.6-6.2-4-8.4.2 3-1.5 5-2.9 6.9C4.4 11.2 5.5 13.6 5.5 15.2c0 3.7 2.6 6.3 6.5 6.3Z" />,
  gem: (
    <>
      <path d="M7 4h10l4 5.5L12 20.5 3 9.5 7 4Z" />
      <path d="M3 9.5h18M9.5 4 8 9.5l4 11 4-11L14.5 4" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  sound: (
    <>
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 0 1-13.1 5" />
      <path d="M4.5 12A7.5 7.5 0 0 1 17.6 7" />
      <path d="M17.5 3.5V7H14M6.5 20.5V17H10" />
    </>
  ),
} as const;

export type IconName = keyof typeof GLYPHS;

export function Icon({ name, size = 24, className, label }: { name: IconName; size?: number; className?: string; label?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {GLYPHS[name]}
    </svg>
  );
}
