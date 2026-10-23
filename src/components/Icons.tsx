import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...rest,
  };
}

/** Brand emblem: overlapping cards with champagne heart & sparkles */
export const BrandEmblem = ({ size = 44, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F3DEC5" />
        <stop offset="50%" stopColor="#DFB992" />
        <stop offset="100%" stopColor="#B68658" />
      </linearGradient>
    </defs>
    <rect
      x="2"
      y="2"
      width="60"
      height="60"
      rx="16"
      fill="#0D0B09"
      stroke="url(#goldGrad)"
      strokeWidth="1.5"
      strokeOpacity="0.6"
    />
    {/* Back tilted card */}
    <g transform="rotate(14 36 33)">
      <rect x="21" y="17" width="26" height="26" rx="6" fill="url(#goldGrad)" fillOpacity="0.88" />
    </g>
    {/* Front tilted dark card with heart */}
    <g transform="rotate(-10 27 34)">
      <rect
        x="13"
        y="19"
        width="28"
        height="28"
        rx="6.5"
        fill="#110E0C"
        stroke="url(#goldGrad)"
        strokeWidth="1.6"
      />
      <path
        d="M27 39.2s-6.2-3.8-7.8-7.2c-1.1-2.4.3-5.1 3-5.1 1.6 0 2.7.9 3.3 1.9h3c.6-1 1.7-1.9 3.3-1.9 2.7 0 4.1 2.7 3 5.1-1.6 3.4-7.8 7.2-7.8 7.2Z"
        fill="url(#goldGrad)"
      />
    </g>
    {/* Sparkles */}
    <path
      d="M46.5 10l1.3 3.4 3.4 1.3-3.4 1.3-1.3 3.4-1.3-3.4-3.4-1.3 3.4-1.3 1.3-3.4Z"
      fill="#F3DEC5"
    />
    <path
      d="M53 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"
      fill="#DFB992"
    />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);
export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);
export const IconHeart = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path
      d="M12 20s-7-4.4-9.2-8.6C1.3 8.5 3 5 6.4 5c2 0 3.3 1.1 4 2.3h3.2c.7-1.2 2-2.3 4-2.3 3.4 0 5.1 3.5 3.6 6.4C19 15.6 12 20 12 20Z"
      transform="translate(0 -.5)"
    />
  </svg>
);
export const IconShare = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
);
export const IconLink = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);
export const IconImagePlus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
    <path d="M16 5h6M19 2v6" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
  </svg>
);
export const IconSparkles = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
  </svg>
);
export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const IconUndo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
);
export const IconRedo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
  </svg>
);
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);
export const IconText = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7V4h16v3M9 20h6M12 4v16" />
  </svg>
);
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconPlusCircle = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);
export const IconHome = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2V10Z" />
  </svg>
);
export const IconMoreHorizontal = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    <circle cx="5" cy="12" r="1.2" fill="currentColor" />
  </svg>
);
export const IconFolder = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </svg>
);
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
export const IconLayers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 2 10 5-10 5L2 7l10-5Z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
export const IconUp = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m18 15-6-6-6 6" />
  </svg>
);
export const IconDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const IconCamera = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);
export const IconFlip = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v18M16 7l4 5-4 5V7ZM8 7l-4 5 4 5V7Z" />
  </svg>
);
export const IconBrush = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9.1 13.5 18.4 4.2a2.1 2.1 0 0 1 3 3L12 16.5" />
    <path d="M7 14c-2 0-3 1.5-3 3 0 1.2-.5 2.3-2 3 3 1 7 .5 8-2.5.5-1.6-.8-3.5-3-3.5Z" />
  </svg>
);
export const IconEraser = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19" />
    <path d="M22 21H7M5 11l9 9" />
  </svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const IconLock = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* --- Luxury Line-Art Category Icons matching reference --- */
export const IconSun = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M16 3v4M8 3v4M3 10h18" />
    <path d="m9.5 15 2 2 3.5-3.5" />
  </svg>
);

export const IconTooth = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4c-2.2 0-3.5 1.8-3.5 4.2 0 2.3.9 4.1 1.6 6.1.6 1.8.8 5.2 2.3 5.2 1.2 0 1.6-3.2 2.8-4.2.5-.4 1.1-.6 1.8-.6s1.3.2 1.8.6c1.2 1 1.6 4.2 2.8 4.2 1.5 0 1.7-3.4 2.3-5.2.7-2 1.6-3.8 1.6-6.1C20.5 5.8 19.2 4 17 4c-1.8 0-3.2 1.1-5 1.1S8.8 4 7 4Z" />
  </svg>
);

export const IconLotus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5c2.2 2.6 3.2 5.6 2.5 9.5-.7-3.9-2.5-6.9-2.5-9.5Z" />
    <path d="M12 5C9.8 7.6 8.8 10.6 9.5 14.5 12 14.5 14.5 14.5 12 5Z" />
    <path d="M12 14.5c2.8 0 5.5-1.5 6.8-4.5-2.6-.2-4.8 1.2-6.8 4.5Z" />
    <path d="M12 14.5c-2.8 0-5.5-1.5-6.8-4.5 2.6-.2 4.8 1.2 6.8 4.5Z" />
    <path d="M4 17c4.5 1.8 11.5 1.8 16 0" />
  </svg>
);

export const IconDumbbell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5v11M17.5 6.5v11M3.5 8.5v7M20.5 8.5v7M6.5 12h11" />
  </svg>
);

export const IconPlane = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
  </svg>
);

export const IconCoffee = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
    <path d="M6 2v3M10 2v3M14 2v3" />
  </svg>
);

export const IconPaw = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="4" r="2" />
    <circle cx="18" cy="8" r="2" />
    <circle cx="20" cy="16" r="2" />
    <circle cx="4" cy="8" r="2" />
    <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
  </svg>
);

export const IconSmile = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

export const IconArrowUpRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M7 7h10v10" />
  </svg>
);

export function CategoryIcon({ slug, name, size = 26 }: { slug: string; name?: string; size?: number }) {
  const key = `${slug} ${name || ''}`.toLowerCase();
  if (key.includes('bom-dia') || key.includes('bom dia') || key.includes('sol')) return <IconSun size={size} />;
  if (key.includes('odonto') || key.includes('dent') || key.includes('sorriso')) return <IconTooth size={size} />;
  if (key.includes('frase') || key.includes('corac') || key.includes('coraç') || key.includes('amor') || key.includes('texto'))
    return <IconHeart size={size} />;
  if (key.includes('data') || key.includes('festa') || key.includes('comemor')) return <IconCalendar size={size} />;
  if (key.includes('beleza') || key.includes('estetica') || key.includes('estética') || key.includes('natureza'))
    return <IconLotus size={size} />;
  if (key.includes('fitness') || key.includes('treino') || key.includes('academia')) return <IconDumbbell size={size} />;
  if (key.includes('viage')) return <IconPlane size={size} />;
  if (key.includes('rotina') || key.includes('cafe') || key.includes('café') || key.includes('objeto'))
    return <IconCoffee size={size} />;
  if (key.includes('pet') || key.includes('anima') || key.includes('cachorro') || key.includes('gato'))
    return <IconPaw size={size} />;
  if (key.includes('emoc') || key.includes('emoç') || key.includes('meme')) return <IconSmile size={size} />;
  if (key.includes('seta')) return <IconArrowUpRight size={size} />;
  return <IconSparkles size={size} />;
}
