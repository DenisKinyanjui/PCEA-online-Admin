import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'amber' | 'sky';
  isLoading?: boolean;
}

const colorMap = {
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  sky: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
};

export default function StatsCard({ label, value, icon: Icon, color = 'indigo', isLoading }: StatsCardProps) {
  return (
    <div className="admin-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {isLoading ? (
        <div className="h-8 w-16 bg-gray-800 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-gray-100">{value}</p>
      )}
    </div>
  );
}
