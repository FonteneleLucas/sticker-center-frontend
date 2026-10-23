import type { ReactNode } from 'react';

export function Spinner({ label = 'Carregando…', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 text-[#C8B6A6] ${className}`} role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#DFB992]/25 border-t-[#DFB992]" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-[#DFB992]/15 bg-[#141210] shadow-card"
        >
          <div className="aspect-[3/4] animate-pulse bg-[#1E1B18]" />
          <div className="h-7 animate-pulse bg-[#141210]" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  emoji = '✦',
  action,
}: {
  title: string;
  description?: string;
  emoji?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#DFB992]/25 bg-[#12100E] px-6 py-12 text-center">
      <div className="mb-3 text-4xl text-[#DFB992]" aria-hidden>
        {emoji}
      </div>
      <h3 className="font-serif text-xl font-semibold text-[#F5EDE4]">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-[#9A8978]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center rounded-3xl border border-rose-500/30 bg-[#1A1111] px-6 py-10 text-center"
      role="alert"
    >
      <div className="mb-2 text-3xl text-rose-400" aria-hidden>
        ✦
      </div>
      <p className="font-medium text-rose-200">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
