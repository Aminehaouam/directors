/**
 * Pip, reduced to five flat shapes: body, wing, eye, beak and a leaf tuft.
 * Colours come from the direction's CSS variables so it re-themes for free.
 */
export function Mascot({ size = 64, mood = 'idle' }: { size?: number; mood?: 'idle' | 'happy' }) {
  return (
    <svg className={`mn-mascot mn-mascot--${mood}`} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Pip the bird">
      <path className="mn-mascot__tuft" d="M30 13c-1-5 2-9 7-10-1 4-3 8-7 10Z" fill="var(--mn-green-2)" />
      <circle cx="31" cy="35" r="21" fill="var(--mn-green-3)" />
      <path d="M12.5 38a14 14 0 0 0 19 13.5c-8-2.5-12-8-12-15.5Z" fill="var(--mn-green-2)" />
      {mood === 'happy' ? (
        <path d="M34 29.5q4-4.5 8 0" fill="none" stroke="var(--mn-ink)" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="38" cy="29" r="5.5" fill="#fff" />
          <circle className="mn-mascot__pupil" cx="39.5" cy="29.5" r="2.7" fill="var(--mn-ink)" />
        </>
      )}
      <path d="M50 33.5 60 37l-10 3.5Z" fill="var(--mn-amber)" />
      <path d="M25 56v4M35 56v4" stroke="var(--mn-amber)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
