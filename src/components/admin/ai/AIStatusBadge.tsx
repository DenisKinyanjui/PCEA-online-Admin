import type { SermonJobStatus } from '../../../types';

interface AIStatusBadgeProps {
  status: SermonJobStatus;
  className?: string;
}

const CONFIG: Record<SermonJobStatus, { label: string; classes: string }> = {
  uploaded: { label: 'Uploaded', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Processing…', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Failed', classes: 'bg-red-50 text-red-700 border-red-200' },
};

export default function AIStatusBadge({ status, className = '' }: AIStatusBadgeProps) {
  const { label, classes } = CONFIG[status] ?? CONFIG.uploaded;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes} ${className}`}
    >
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      )}
      {label}
    </span>
  );
}
