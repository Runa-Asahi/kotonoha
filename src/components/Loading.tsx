export function Loading({ error, retry }: { error?: string | null; retry?: () => void }) {
  if (error)
    return (
      <div role="alert" className="card mt-10 p-6 text-center">
        <p className="text-again">{error}</p>
        {retry && <button className="btn-ink mt-4 w-full" onClick={retry}>重试</button>}
      </div>
    );
  return (
    <div role="status" aria-label="加载中" className="mt-10 space-y-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-[20px] bg-elevated/70" style={{ animationDelay: `${i * 120}ms` }} />)}
    </div>
  );
}
