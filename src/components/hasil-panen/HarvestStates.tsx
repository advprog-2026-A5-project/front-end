"use client";

export function HarvestLoadingState({ text = "Memuat data..." }: { text?: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-8 text-center text-slate-300">
      {text}
    </div>
  );
}

export function HarvestEmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-8 text-center text-slate-300">
      {text}
    </div>
  );
}

export function HarvestErrorState({
  text,
  onRetry,
}: {
  text: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-red-200">
      <p className="font-semibold">Terjadi masalah</p>
      <p className="mt-1 text-sm">{text}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg border border-red-200/30 bg-red-900/20 px-3 py-1.5 text-sm font-medium hover:bg-red-900/30"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
