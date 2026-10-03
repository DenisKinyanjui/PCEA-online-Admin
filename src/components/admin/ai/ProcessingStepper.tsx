import { CheckCircle, XCircle, Loader, Circle } from 'lucide-react';
import type { SermonJob } from '../../../types';

interface ProcessingStepperProps {
  job: SermonJob;
}

interface Step {
  key: keyof SermonJob['stages'];
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { key: 'transcribing', label: 'Transcribing', description: 'Converting audio / extracting document text' },
  { key: 'analyzing', label: 'Analyzing', description: 'Understanding sermon structure and themes' },
  { key: 'structuring', label: 'Structuring', description: 'Building organized sermon sections' },
  { key: 'saving', label: 'Saving', description: 'Storing AI-generated content' },
];

export default function ProcessingStepper({ job }: ProcessingStepperProps) {
  return (
    <div className="space-y-3">
      {STEPS.map((step, idx) => {
        const stage = job.stages[step.key];
        const { status } = stage;

        const isDone = status === 'done';
        const isProcessing = status === 'processing';
        const isFailed = status === 'failed';
        const isPending = status === 'pending';

        return (
          <div key={step.key} className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {isDone && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              {isProcessing && <Loader className="h-5 w-5 text-indigo-500 animate-spin" />}
              {isFailed && <XCircle className="h-5 w-5 text-red-400" />}
              {isPending && <Circle className="h-5 w-5 text-gray-600" />}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isDone
                      ? 'text-emerald-300'
                      : isProcessing
                      ? 'text-indigo-300'
                      : isFailed
                      ? 'text-red-300'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
                {isProcessing && (
                  <span className="text-xs text-indigo-500 animate-pulse">In progress…</span>
                )}
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isPending ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {isFailed && stage.error ? stage.error : step.description}
              </p>
            </div>

            {/* Step number for pending */}
            {isPending && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 text-gray-500 text-xs flex items-center justify-center font-medium mt-0.5">
                {idx + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
