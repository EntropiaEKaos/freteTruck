export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
        <div className="space-y-2 text-right shrink-0">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12 ml-auto" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-16" />
        <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-14" />
        <div className="h-6 bg-slate-100 dark:bg-slate-700 rounded-full w-18" />
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-72 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
