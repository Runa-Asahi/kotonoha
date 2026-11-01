export function Loading({ error, retry }: { error?: string | null; retry?: () => void }) {
  if (error)
    return (
      <div role="alert" className="card mt-10 p-6 text-center">
        <p className="font-medium text-rose-600">{error}</p>
        {retry && <button className="btn-primary mt-4" onClick={retry}>重试</button>}
      </div>
    );
  return <p role="status" className="mt-16 text-center text-slate-500">词库加载中…</p>;
}
