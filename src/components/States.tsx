import type { ReactNode } from 'react';

export function Spinner({ label = 'Carregando…', className = '' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 text-slate-500 ${className}`} role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="m-3 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="m-2 h-10 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  emoji = '🔍',
  action,
}: {
  title: string;
  description?: string;
  emoji?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <div className="mb-3 text-5xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-rose-100 bg-rose-50 px-6 py-10 text-center" role="alert">
      <div className="mb-2 text-4xl" aria-hidden>
        😵
      </div>
      <p className="font-medium text-rose-800">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-4">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
