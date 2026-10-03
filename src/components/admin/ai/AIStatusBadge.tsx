import type { SermonJobStatus } from '../../../types';

interface AIStatusBadgeProps {
  status: SermonJobStatus;
  className?: string;
}

const CONFIG: Record<SermonJobStatus, { label: string; classes: string }> = {
  uploaded: { label: 'Uploaded', classes: 'bg-blue-500/10 text-blue-300 border-blue-500/25' },
  processing: { label: 'Processing…', classes: 'bg-amber-500/10 text-amber-300 border-amber-500/25' },
  completed: { label: 'Completed', classes: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' },
  failed: { label: 'Failed', classes: 'bg-red-500/10 text-red-300 border-red-500/25' },
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
