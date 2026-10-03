import { BookOpen, Tag, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { SermonJob } from '../../../types';

interface AISermonPreviewCardProps {
  job: SermonJob;
  selectedTitle: string;
  onSelectTitle: (t: string) => void;
}

export default function AISermonPreviewCard({
  job,
  selectedTitle,
  onSelectTitle,
}: AISermonPreviewCardProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const { aiResult } = job;

  return (
    <div className="space-y-5">
      {/* Summary */}
      {aiResult.summary && (
        <div className="admin-card p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            AI Summary
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">{aiResult.summary}</p>
        </div>
      )}

      {/* Title Suggestions */}
      {aiResult.titleSuggestions.length > 0 && (
        <div className="admin-card p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Suggested Titles
          </h4>
          <div className="space-y-2">
            {aiResult.titleSuggestions.map((t) => (
              <button
                key={t}
                onClick={() => onSelectTitle(t)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-all ${
                  selectedTitle === t
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200 font-medium'
                    : 'bg-gray-800/40 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700'
                }`}
              >
                {selectedTitle === t && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 mb-0.5" />
                )}
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Key Themes & Verses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {aiResult.keyThemes.length > 0 && (
          <div className="admin-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Key Themes</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiResult.keyThemes.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-full text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {aiResult.keyVerses.length > 0 && (
          <div className="admin-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Key Verses</h4>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiResult.keyVerses.map((v) => (
                <span
                  key={v}
                  className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 rounded-full text-xs font-medium"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sections */}
      {aiResult.sections.length > 0 && (
        <div className="admin-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/40">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-gray-500" />
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Sermon Sections ({aiResult.sections.length})
              </h4>
            </div>
          </div>
          <div className="divide-y divide-gray-800">
            {aiResult.sections.map((section, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 text-left transition-colors"
                >
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      section.type === 'introduction'
                        ? 'bg-blue-500/10 text-blue-300'
                        : section.type === 'conclusion'
                        ? 'bg-purple-500/10 text-purple-300'
                        : 'bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    {section.type}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-200 truncate">
                    {section.title || `Section ${idx + 1}`}
                  </span>
                  {expandedSection === idx ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>

                {expandedSection === idx && (
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-sm text-gray-300 leading-relaxed">{section.content}</p>
                    {section.scripture.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {section.scripture.map((ref) => (
                          <span
                            key={ref}
                            className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 rounded-full text-xs"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
