export function SermonDetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="admin-card p-5 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
        <div className="h-24 bg-gray-200 rounded" />
      </div>
      <div className="admin-card p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-24 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
