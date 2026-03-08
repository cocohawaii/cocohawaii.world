'use client';

interface PaintShapeProps {
  color: keyof typeof colorMap;
  size?: 'sm' | 'md' | 'lg';
  darkBg?: boolean;
}

const colorMap = {
  purple: '#8b5cf6',
  pink: '#db2777',
  orange: '#ea580c',
  teal: '#0d9488',
  lightPink: '#f472b6',
  lightPurple: '#a78bfa',
  lightOrange: '#fb923c',
};

const sizeMap = { sm: 0.6, md: 1, lg: 1.5 };
const opacityBase = { drip: 0.75, splash: 0.7, splat: 0.65 };
const opacityRunway = { drip: 0.5, splash: 0.45, splat: 0.5 };

/** Realistic paint drip — narrow at top, bulbous blob, elongated tail */
function PaintDrip({ color, size = 'md', darkBg = false }: PaintShapeProps) {
  const c = colorMap[color];
  const k = sizeMap[size];
  const o = darkBg ? opacityRunway.drip : opacityBase.drip;
  const w = 32 * k;
  const h = 100 * k;
  return (
    <svg width={w} height={h} viewBox="0 0 32 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
      <path
        d="M16 0 Q 8 35 16 58 Q 24 35 16 0 Z M 16 58 Q 10 75 16 92 Q 22 75 16 58 Z"
        fill={c}
        fillOpacity={o}
      />
    </svg>
  );
}

/** Paint splash — central blob + radiating droplets */
function PaintSplash({ color, size = 'md', darkBg = false }: PaintShapeProps) {
  const c = colorMap[color];
  const k = sizeMap[size];
  const o = darkBg ? opacityRunway.splash : opacityBase.splash;
  const sz = 100 * k;
  return (
    <svg width={sz} height={sz} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
      <ellipse cx="50" cy="52" rx="22" ry="26" fill={c} fillOpacity={o} />
      <ellipse cx="28" cy="45" rx="10" ry="12" fill={c} fillOpacity={o * 0.85} />
      <ellipse cx="72" cy="48" rx="8" ry="10" fill={c} fillOpacity={o * 0.8} />
      <ellipse cx="45" cy="78" rx="12" ry="8" fill={c} fillOpacity={o * 0.9} />
      <ellipse cx="18" cy="62" rx="6" ry="8" fill={c} fillOpacity={o * 0.7} />
      <ellipse cx="82" cy="68" rx="7" ry="9" fill={c} fillOpacity={o * 0.75} />
      <circle cx="35" cy="28" r="5" fill={c} fillOpacity={o * 0.65} />
      <circle cx="65" cy="32" r="4" fill={c} fillOpacity={o * 0.6} />
    </svg>
  );
}

/** Paint splat — irregular blob like a drop that hit and spread */
function PaintSplat({ color, size = 'md', darkBg = false }: PaintShapeProps) {
  const c = colorMap[color];
  const k = sizeMap[size];
  const o = darkBg ? opacityRunway.splat : opacityBase.splat;
  const sz = 90 * k;
  return (
    <svg width={sz} height={sz} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
      <path
        d="M45 15 Q 62 28 58 48 Q 54 62 45 72 Q 32 78 22 68 Q 12 55 18 38 Q 25 22 38 18 Q 42 16 45 15 Z"
        fill={c}
        fillOpacity={o}
      />
    </svg>
  );
}

/** Heavy drip run — multiple drips from one source, paint running down */
function PaintDripRun({ color, size = 'md', darkBg = false }: PaintShapeProps) {
  const c = colorMap[color];
  const k = sizeMap[size];
  const o = darkBg ? opacityRunway.drip : opacityBase.drip;
  const w = 56 * k;
  const h = 120 * k;
  return (
    <svg width={w} height={h} viewBox="0 0 56 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
      <path d="M28 0 Q 18 40 28 70 Q 38 40 28 0 Z M 28 70 Q 20 95 28 118 Q 36 95 28 70 Z" fill={c} fillOpacity={o} />
      <path d="M12 25 Q 6 50 12 75 Q 18 50 12 25 Z M 12 75 Q 8 95 12 112 Q 16 95 12 75 Z" fill={c} fillOpacity={o * 0.92} />
      <path d="M44 32 Q 38 55 44 80 Q 50 55 44 32 Z M 44 80 Q 40 98 44 115 Q 48 98 44 80 Z" fill={c} fillOpacity={o * 0.88} />
    </svg>
  );
}

interface PaintDripsProps {
  variant: 'hero' | 'pillars' | 'collections' | 'featured' | 'cta' | 'closing' | 'runway';
  className?: string;
}

export default function PaintDrips({ variant, className = '' }: PaintDripsProps) {
  const base = 'absolute pointer-events-none select-none overflow-visible ' + className;

  if (variant === 'hero') {
    return (
      <div aria-hidden className={base} style={{ inset: 0 }}>
        <div className="absolute top-6 left-[4%] rotate-[-18deg] opacity-90">
          <PaintDrip color="purple" size="lg" />
        </div>
        <div className="absolute top-20 right-[6%] rotate-[12deg] opacity-85">
          <PaintSplash color="pink" size="lg" />
        </div>
        <div className="absolute bottom-24 left-[10%] rotate-[22deg] opacity-90">
          <PaintDripRun color="orange" size="md" />
        </div>
        <div className="absolute bottom-16 right-[12%] rotate-[-8deg] opacity-85">
          <PaintSplat color="teal" size="md" />
        </div>
        <div className="absolute top-1/2 right-[2%] -translate-y-1/2 rotate-[-5deg] opacity-80">
          <PaintDrip color="pink" size="md" />
        </div>
        <div className="absolute top-1/3 left-[1%] rotate-[6deg] opacity-85">
          <PaintDrip color="purple" size="sm" />
        </div>
        <div className="absolute bottom-8 left-[6%] rotate-[-15deg] opacity-80">
          <PaintSplash color="orange" size="sm" />
        </div>
        <div className="absolute top-16 right-[14%] rotate-[25deg] opacity-75">
          <PaintSplat color="pink" size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'pillars') {
    return (
      <div aria-hidden className={base} style={{ inset: 0 }}>
        <div className="absolute top-2 left-[2%] rotate-[-14deg] opacity-85">
          <PaintDrip color="purple" size="md" />
        </div>
        <div className="absolute top-6 right-[4%] rotate-[16deg] opacity-80">
          <PaintSplash color="orange" size="sm" />
        </div>
        <div className="absolute bottom-2 left-[6%] rotate-[18deg] opacity-80">
          <PaintSplat color="pink" size="sm" />
        </div>
        <div className="absolute bottom-4 right-[8%] rotate-[-20deg] opacity-85">
          <PaintDripRun color="teal" size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'collections') {
    return (
      <div aria-hidden className={base} style={{ inset: 0 }}>
        <div className="absolute top-10 left-[3%] rotate-[-22deg] opacity-85">
          <PaintDripRun color="pink" size="lg" />
        </div>
        <div className="absolute top-16 right-[5%] rotate-[14deg] opacity-80">
          <PaintSplash color="purple" size="md" />
        </div>
        <div className="absolute bottom-20 left-[5%] rotate-[8deg] opacity-80">
          <PaintDrip color="orange" size="md" />
        </div>
        <div className="absolute bottom-16 right-[3%] rotate-[-12deg] opacity-85">
          <PaintSplat color="teal" size="md" />
        </div>
        <div className="absolute top-1/2 left-[1%] -translate-y-1/2 rotate-[-10deg] opacity-75">
          <PaintSplash color="pink" size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div aria-hidden className={base} style={{ inset: 0 }}>
        <div className="absolute top-6 right-[4%] rotate-[20deg] opacity-85">
          <PaintSplash color="purple" size="md" />
        </div>
        <div className="absolute top-14 left-[3%] rotate-[-16deg] opacity-80">
          <PaintDrip color="orange" size="md" />
        </div>
        <div className="absolute bottom-10 left-[6%] rotate-[10deg] opacity-80">
          <PaintSplat color="pink" size="sm" />
        </div>
        <div className="absolute bottom-6 right-[7%] rotate-[-18deg] opacity-85">
          <PaintDripRun color="teal" size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'cta') {
    return (
      <div aria-hidden className={base} style={{ inset: 0 }}>
        <div className="absolute top-8 left-[4%] rotate-[-10deg] opacity-90">
          <PaintDripRun color="purple" size="lg" />
        </div>
        <div className="absolute top-14 right-[5%] rotate-[14deg] opacity-85">
          <PaintSplash color="pink" size="lg" />
        </div>
        <div className="absolute bottom-8 left-[6%] rotate-[12deg] opacity-85">
          <PaintSplat color="orange" size="md" />
        </div>
        <div className="absolute bottom-12 right-[4%] rotate-[-14deg] opacity-90">
          <PaintDrip color="teal" size="md" />
        </div>
        <div className="absolute top-1/2 left-[1%] -translate-y-1/2 rotate-[-6deg] opacity-80">
          <PaintDrip color="pink" size="sm" />
        </div>
        <div className="absolute top-1/2 right-[1%] -translate-y-1/2 rotate-[8deg] opacity-80">
          <PaintSplash color="purple" size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'closing') {
    return (
      <div aria-hidden className={base} style={{ inset: 0 }}>
        <div className="absolute top-4 left-[8%] rotate-[-18deg] opacity-85">
          <PaintDrip color="purple" size="md" />
        </div>
        <div className="absolute top-6 right-[10%] rotate-[16deg] opacity-80">
          <PaintSplash color="pink" size="md" />
        </div>
        <div className="absolute bottom-4 left-[12%] rotate-[8deg] opacity-80">
          <PaintSplat color="orange" size="sm" />
        </div>
        <div className="absolute bottom-6 right-[8%] rotate-[-16deg] opacity-85">
          <PaintDripRun color="teal" size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'runway') {
    return (
      <div aria-hidden className={base} style={{ inset: 0 }}>
        <div className="absolute top-10 left-[6%] rotate-[-16deg] opacity-90">
          <PaintDrip color="lightPink" size="lg" darkBg />
        </div>
        <div className="absolute top-18 right-[8%] rotate-[12deg] opacity-85">
          <PaintSplash color="lightPurple" size="md" darkBg />
        </div>
        <div className="absolute bottom-14 left-[8%] rotate-[18deg] opacity-85">
          <PaintSplat color="lightOrange" size="md" darkBg />
        </div>
        <div className="absolute bottom-18 right-[6%] rotate-[-10deg] opacity-90">
          <PaintDripRun color="lightPink" size="md" darkBg />
        </div>
        <div className="absolute top-1/2 left-[2%] -translate-y-1/2 rotate-[-8deg] opacity-80">
          <PaintDrip color="lightPurple" size="sm" darkBg />
        </div>
        <div className="absolute top-1/2 right-[2%] -translate-y-1/2 rotate-[6deg] opacity-80">
          <PaintSplash color="lightOrange" size="sm" darkBg />
        </div>
      </div>
    );
  }

  return null;
}
