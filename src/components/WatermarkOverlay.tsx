import { memo } from 'react';
import { IconLock } from './Icons';

/**
 * Luxury watermark overlay for Premium stickers:
 * - Repeated diagonal watermark text pattern
 * - Frosted center seal with lock icon
 * - Absolute pointer-events-none, user-select-none overlay
 */
export const WatermarkOverlay = memo(function WatermarkOverlay({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex select-none flex-col items-center justify-center overflow-hidden"
    >
      {/* Semi-transparent frosted backdrop tint */}
      <div className="absolute inset-0 bg-[#090807]/25 backdrop-blur-[1.5px]" />

      {/* Diagonal repeating watermark text stripes */}
      <div className="absolute -inset-10 flex -rotate-[28deg] flex-col justify-around opacity-30 select-none">
        {Array.from({ length: isLg ? 10 : 7 }).map((_, i) => (
          <div
            key={i}
            className="flex whitespace-nowrap text-[10px] font-extrabold tracking-[0.25em] text-[#DFB992] uppercase sm:text-xs"
          >
            {Array.from({ length: 6 }).map((_, j) => (
              <span key={j} className="mx-3">
                STORIES &amp; STICKERS • PREMIUM •
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Central luxury seal */}
      <div className="relative z-10 flex flex-col items-center justify-center rounded-2xl border border-[#DFB992]/40 bg-[#120F0D]/85 px-3 py-2 text-center shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#DFB992]/60 bg-[#DFB992]/15 text-[#DFB992]">
          <IconLock size={14} />
        </div>
        <span className="mt-1 font-serif text-[10px] font-bold tracking-widest text-[#F2DEC9] uppercase sm:text-[11px]">
          Premium
        </span>
      </div>
    </div>
  );
});
