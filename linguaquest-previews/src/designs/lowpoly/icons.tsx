/** Angular icon set: 24px grid, 2px stroke, mitred joins, square caps. */

const GLYPHS = {
  learn: (
    <>
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </>
  ),
  practice: (
    <>
      <path d="M3.5 7.5h12v13h-12Z" />
      <path d="M8 3.5h12.5v12.5" />
    </>
  ),
  progress: (
    <>
      <path d="M3 20.5h18" />
      <path d="M3 16.5 8.5 9l4 5 7.5-10" />
    </>
  ),
  profile: (
    <>
      <path d="M12 3 16 5.3v4.4L12 12 8 9.7V5.3Z" />
      <path d="M4 21l2-5.5h12L20 21" />
    </>
  ),
  flame: <path d="M12 2.5 18 11h-3l2 6-5 4.5L7 17l2-6H6Z" />,
  gem: (
    <>
      <path d="M7 4h10l4 5-9 11.5L3 9Z" />
      <path d="M3 9h18M12 20.5 9 9l3-5 3 5Z" />
    </>
  ),
  check: <path d="M4 12.5 9 17.5 20 6.5" />,
  lock: (
    <>
      <path d="M5.5 10.5h13V21h-13Z" />
      <path d="M8.5 10.5V5.5h7v5" />
    </>
  ),
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  close: <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />,
  sound: (
    <>
      <path d="M3.5 9h4L13 4.5v15L7.5 15h-4Z" />
      <path d="M16.5 8.5 19 12l-2.5 3.5" />
    </>
  ),
  flag: <path d="M5.5 21.5V3.5h13l-3.5 4.5 3.5 4.5h-13" />,
  clock: (
    <>
      <path d="M12 3 19.8 7.5v9L12 21l-7.8-4.5v-9Z" />
      <path d="M12 8v4.5l3 2" />
    </>
  ),
  star: <path d="m12 3 2.7 6 6.3.6-4.8 4.2 1.4 6.2L12 16.8 6.4 20l1.4-6.2L3 9.6 9.3 9Z" />,
} as const;

export type PolyIconName = keyof typeof GLYPHS;

export function PIcon({ name, size = 24, className }: { name: PolyIconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="miter"
      strokeLinecap="square"
      aria-hidden
    >
      {GLYPHS[name]}
    </svg>
  );
}
