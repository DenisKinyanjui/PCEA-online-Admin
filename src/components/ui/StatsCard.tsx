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

const graphColorMap = {
  indigo: 'text-indigo-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  sky: 'text-sky-400',
};

// Starts at bottom-centre of the card (0,100) and ends at
// the vertical centre of the right border (200,50)
const WAVE_PATH = `
  M0 100
  C50 100, 70 72, 100 76
  S160 50, 200 50
`;

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'indigo',
  isLoading,
}: StatsCardProps) {
  const gradientId = `graph-gradient-${color}`;

  return (
    <div className="relative overflow-hidden bg-blue-900/10 backdrop-blur border border-gray-800 p-5">

      {/* Graph: right half of the card, full height */}
      <svg
        className={`absolute inset-y-0 right-0 w-1/2 h-full pointer-events-none ${graphColorMap[color]}`}
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Filled area below the waveform */}
        <path
          d={`${WAVE_PATH} L200 100 L0 100 Z`}
          fill={`url(#${gradientId})`}
        />

        {/* Waveform */}
        <path
          d={WAVE_PATH}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="butt"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Card content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400 font-medium">
            {label}
          </p>

          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center ${colorMap[color]}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {isLoading ? (
          <div className="h-8 w-16 bg-gray-800 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-gray-100">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}