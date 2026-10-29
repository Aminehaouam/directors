import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export const SCREEN_W = 390;
export const SCREEN_H = 844;
const BEZEL = 12;
export const FRAME_W = SCREEN_W + BEZEL * 2;
export const FRAME_H = SCREEN_H + BEZEL * 2;

function StatusIcons() {
  return (
    <svg width="68" height="12" viewBox="0 0 68 12" aria-hidden>
      <g fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
        <path d="M30 3.2a9 9 0 0 1 12 0l-1.4 1.5a7 7 0 0 0-9.2 0Z M32.6 6a5.2 5.2 0 0 1 6.8 0L38 7.5a3.2 3.2 0 0 0-4 0Z M36 9.2l1.4 1.5L36 12l-1.4-1.3Z" />
        <rect x="45.5" y="0.5" width="20" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.45" />
        <rect x="47.5" y="2.5" width="14" height="7" rx="1.6" />
        <rect x="66.5" y="4" width="1.5" height="4" rx="0.7" opacity="0.45" />
      </g>
    </svg>
  );
}

interface PhoneFrameProps {
  tone: 'dark' | 'light';
  label: string;
  children: ReactNode;
  /** Below 520px the focus phone drops its bezel and fills the viewport width. */
  fluid?: boolean;
}

export function PhoneFrame({ tone, label, children, fluid = false }: PhoneFrameProps) {
  return (
    <div className={`sh-phone${fluid ? ' sh-phone--fluid' : ''}`} data-tone={tone}>
      <div className="sh-phone__screen" role="region" aria-label={label}>
        <div className="sh-phone__status" aria-hidden>
          <span>9:41</span>
          <StatusIcons />
        </div>
        <div className="sh-phone__island" aria-hidden />
        <div className="sh-phone__app">{children}</div>
        <div className="sh-phone__home" aria-hidden />
      </div>
    </div>
  );
}

/** Scales a full-size phone down to fit its column without changing its layout. */
export function ScaledPhone({ children, max = 1 }: { children: ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(Math.min(max, el.clientWidth / FRAME_W));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [max]);

  return (
    <div ref={ref} className="sh-scaled" style={{ height: FRAME_H * scale }}>
      <div className="sh-scaled__inner" style={{ transform: `scale(${scale})`, left: `calc(50% - ${(FRAME_W * scale) / 2}px)` }}>
        {children}
      </div>
    </div>
  );
}
