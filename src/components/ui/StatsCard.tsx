import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'sky';
  isLoading?: boolean;
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  sky: 'bg-sky-50 text-sky-600 border-sky-200',
};

export default function StatsCard({ label, value, icon: Icon, color = 'indigo', isLoading }: StatsCardProps) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {isLoading ? (
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  );
}
