import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface AdminEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function AdminEmptyState({ icon: Icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 bg-gray-800 border border-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-100 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
