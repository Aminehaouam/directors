/** Soft, filled two-tone icons (24px grid, rounded everything). */

const GLYPHS = {
  learn: (
    <>
      <path d="M4 11.2 11 5a1.5 1.5 0 0 1 2 0l7 6.2V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7.8Z" opacity="0.35" />
      <path d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5h-5Z" />
      <path d="M2.7 11.4 11 4a1.5 1.5 0 0 1 2 0l8.3 7.4a1 1 0 0 1-1.3 1.5L12 5.8l-8 7.1a1 1 0 0 1-1.3-1.5Z" />
    </>
  ),
  practice: (
    <>
      <rect x="7" y="3" width="14" height="15" rx="3.5" opacity="0.35" />
      <rect x="3" y="6.5" width="14" height="15" rx="3.5" />
    </>
  ),
  progress: (
    <>
      <rect x="3" y="12" width="5" height="9" rx="2.5" opacity="0.35" />
      <rect x="9.5" y="4" width="5" height="17" rx="2.5" />
      <rect x="16" y="9" width="5" height="12" rx="2.5" opacity="0.35" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4.5" />
      <path d="M3.5 20.5c0-4 3.8-6.5 8.5-6.5s8.5 2.5 8.5 6.5c0 .8-.7 1.5-1.5 1.5H5c-.8 0-1.5-.7-1.5-1.5Z" opacity="0.35" />
    </>
  ),
  flame: (
    <>
      <path d="M12 22c4.4 0 7.5-2.9 7.5-7 0-3.8-2.6-6.3-4.3-8.6-.5 2-1.5 3.1-2.7 3.7.2-3.8-1.8-7-4.5-9.4.2 3.4-1.7 5.6-3.3 7.8C3.2 10.6 4.5 13.3 4.5 15c0 4.1 3.1 7 7.5 7Z" />
      <path d="M12 21c2 0 3.5-1.4 3.5-3.4 0-2-1.6-3.2-2.4-4.6-.6 1.4-1.6 2-2.6 2.2-.9-.6-1.2-1.5-1.2-1.5-.6.9-.8 2.3-.8 3.4 0 2.4 1.5 3.9 3.5 3.9Z" fill="#fff" opacity="0.55" />
    </>
  ),
  gem: (
    <>
      <path d="M6.5 3.5h11L22 9.2 12 21.5 2 9.2l4.5-5.7Z" />
      <path d="M2 9.2h20L12 21.5 2 9.2Z" opacity="0.6" fill="#000" fillOpacity="0.2" />
      <path d="M8 5h3.5L9 9H4.6L8 5Z" fill="#fff" opacity="0.6" />
    </>
  ),
  check: <path d="M9.6 17.3 4.8 12.5a1.6 1.6 0 1 1 2.3-2.3l2.5 2.5 7.3-7.3a1.6 1.6 0 1 1 2.3 2.3l-9.6 9.6Z" />,
  lock: (
    <>
      <path d="M7.5 10V8a4.5 4.5 0 0 1 9 0v2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4.5" y="9.5" width="15" height="12" rx="3.5" />
      <circle cx="12" cy="15.5" r="1.8" fill="#fff" opacity="0.8" />
    </>
  ),
  star: <path d="M12 2.8a1 1 0 0 1 .9.6l2.4 5 5.4.8a1 1 0 0 1 .6 1.7l-4 3.9.9 5.4a1 1 0 0 1-1.5 1.1L12 18.6l-4.8 2.6a1 1 0 0 1-1.5-1l.9-5.5-4-3.9a1 1 0 0 1 .6-1.7l5.4-.8 2.4-5a1 1 0 0 1 1-.5Z" />,
  sound: (
    <>
      <path d="M3.5 9.5A1.5 1.5 0 0 1 5 8h2.5l4.3-3.6a1 1 0 0 1 1.7.8v13.6a1 1 0 0 1-1.7.8L7.5 16H5a1.5 1.5 0 0 1-1.5-1.5v-5Z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  close: <path d="M6.3 6.3a1.6 1.6 0 0 1 2.3 0L12 9.7l3.4-3.4a1.6 1.6 0 1 1 2.3 2.3L14.3 12l3.4 3.4a1.6 1.6 0 1 1-2.3 2.3L12 14.3l-3.4 3.4a1.6 1.6 0 1 1-2.3-2.3L9.7 12 6.3 8.6a1.6 1.6 0 0 1 0-2.3Z" />,
  play: <path d="M8 5.6a1.5 1.5 0 0 1 2.3-1.3l9.2 6.4a1.5 1.5 0 0 1 0 2.5l-9.2 6.4A1.5 1.5 0 0 1 8 18.4V5.6Z" />,
  chat: (
    <>
      <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H11l-4.4 3.6c-.6.5-1.6 0-1.6-.8V16A3.5 3.5 0 0 1 4 12.5v-6Z" />
      <circle cx="8.5" cy="9.5" r="1.3" fill="#fff" />
      <circle cx="12" cy="9.5" r="1.3" fill="#fff" />
      <circle cx="15.5" cy="9.5" r="1.3" fill="#fff" />
    </>
  ),
  chest: (
    <>
      <path d="M3 10a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6v1H3v-1Z" opacity="0.6" />
      <rect x="3" y="11" width="18" height="9" rx="2.5" />
      <rect x="10.5" y="9.5" width="3" height="4.5" rx="1.2" fill="#fff" />
    </>
  ),
} as const;

export type SoftIconName = keyof typeof GLYPHS;

export function SIcon({ name, size = 24, className }: { name: SoftIconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {GLYPHS[name]}
    </svg>
  );
}
