import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertTriangle, Check, Download, FileSpreadsheet, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { normalizeQuestionPrompt, parseCsvQuestions, parsePastedQuestions, type BulkQuestionDraft } from '../../utils/quizBulkImport';

interface ImportRow extends BulkQuestionDraft {
  include: boolean;
  errors: string[];
  duplicate: boolean;
  duplicateOf: string | null;
}

interface PreviewReply {
  index: number;
  errors: string[];
  duplicate: boolean;
  duplicateOf: string | null;
}

interface ImportResult {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  imported: number;
  errors: { index: number; prompt: string; errors: string[] }[];
  duplicateRows: { index: number; prompt: string; duplicateOf: string }[];
}

interface BulkQuestionImportProps {
  onClose: () => void;
  onImported: () => Promise<void>;
}

const CSV_TEMPLATE = 'prompt,optionA,optionB,optionC,optionD,correctAnswer,difficulty,category,scriptureReference,explanation,publishAt\n"Who built the ark?",Noah,Moses,David,Peter,A,easy,Bible,Genesis 6,"God instructed Noah to build the ark.",\n';
const SAMPLE_TEXT = `Question 1: Who built the ark?\nA. Noah\nB. Moses\nC. David\nD. Peter\nCorrect Answer: A\nDifficulty: easy\nCategory: Bible\nScripture Reference: Genesis 6\nExplanation: God instructed Noah to build the ark.\n---\nQuestion 2: What is a moral response to a neighbor in need?\nA. Ignore them\nB. Help them\nC. Mock them\nD. Leave\nCorrect Answer: B\nDifficulty: medium\nCategory: Moral\nExplanation: Show compassion to others.`;

function validateDraft(draft: BulkQuestionDraft): string[] {
  const errors = [...draft.parseErrors];
  if (!draft.prompt.trim()) errors.push('Question text is required');
  if (draft.prompt.length > 1200) errors.push('Question text exceeds 1200 characters');
  if (draft.options.length !== 4 || draft.options.some((option) => !option.trim())) errors.push('All four options A-D are required');
  if (draft.options.some((option) => option.length > 300)) errors.push('Options must be 300 characters or fewer');
  const correctAnswer = draft.correctAnswer.trim().toUpperCase();
  const correctIndex = correctAnswer.length === 1 ? correctAnswer.charCodeAt(0) - 65 : -1;
  if (correctIndex < 0 || correctIndex > 3) errors.push('Correct answer must be A, B, C, or D');
  if (!['easy', 'medium', 'hard'].includes(draft.difficulty.trim().toLowerCase())) errors.push('Difficulty must be easy, medium, or hard');
  if (!['bible', 'moral'].includes(draft.category.trim().toLowerCase())) errors.push('Category must be Bible or Moral');
  if (!draft.explanation.trim()) errors.push('Explanation is required');
  if (draft.explanation.length > 2000) errors.push('Explanation exceeds 2000 characters');
  if (draft.scriptureReference.length > 120) errors.push('Scripture reference exceeds 120 characters');
  if (draft.publishAt && Number.isNaN(new Date(draft.publishAt).getTime())) errors.push('Publish date is invalid');
  return [...new Set(errors)];
}

function rowFromDraft(draft: BulkQuestionDraft): ImportRow {
  const answer = draft.correctAnswer.trim();
  const matchingOption = draft.options.findIndex((option) => option.trim().toLowerCase() === answer.toLowerCase());
  const correctAnswer = /^[A-D]$/i.test(answer) ? answer.toUpperCase() : matchingOption >= 0 ? String.fromCharCode(65 + matchingOption) : answer.toUpperCase();
  const normalized = { ...draft, correctAnswer };
  const errors = validateDraft(normalized);
  return { ...normalized, include: errors.length === 0, errors, duplicate: false, duplicateOf: null };
}

function requestQuestion(row: ImportRow) {
  return {
    prompt: row.prompt,
    options: row.options,
    correctAnswer: row.correctAnswer,
    difficulty: row.difficulty,
    category: row.category,
    scriptureReference: row.scriptureReference,
    explanation: row.explanation,
    publishAt: row.publishAt,
  };
}

function countInBatchDuplicates(rows: ImportRow[]) {
  const firstByPrompt = new Map<string, number>();
  return rows.map((row, index) => {
    if (row.errors.length) return row;
    const key = normalizeQuestionPrompt(row.prompt);
    const firstIndex = firstByPrompt.get(key);
    if (firstIndex !== undefined) return { ...row, duplicate: true, duplicateOf: rows[firstIndex].prompt, include: false };
    firstByPrompt.set(key, index);
    return row;
  });
}

export default function BulkQuestionImport({ onClose, onImported }: BulkQuestionImportProps) {
  const [input, setInput] = useState('');
  const [format, setFormat] = useState<'paste' | 'csv'>('paste');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => ({
    detected: rows.length,
    valid: rows.filter((row) => !row.errors.length && !row.duplicate).length,
    invalid: rows.filter((row) => row.errors.length > 0).length,
    duplicates: rows.filter((row) => row.duplicate).length,
    selected: rows.filter((row) => row.include && !row.errors.length && !row.duplicate).length,
  }), [rows]);

  const parseInput = async () => {
    setError(''); setResult(null);
    const parsed = format === 'csv' ? parseCsvQuestions(input) : { questions: parsePastedQuestions(input), errors: [] };
    if (parsed.errors.length) { setError(parsed.errors.join(' ')); setRows([]); return; }
    if (!parsed.questions.length) { setError('No numbered questions were detected. Check the format and try again.'); setRows([]); return; }
    if (parsed.questions.length > 200) { setError('Import up to 200 questions at a time.'); setRows([]); return; }
    const drafts = countInBatchDuplicates(parsed.questions.map(rowFromDraft));
    await validateWithServer(drafts);
  };

  const validateWithServer = async (drafts: ImportRow[]) => {
    setChecking(true); setError(''); setResult(null);
    try {
      const { data } = await axiosInstance.post<{ data: PreviewReply[] }>('/quiz/manage/questions/bulk/preview', { questions: drafts.map(requestQuestion) });
      const updated = drafts.map((row, index) => {
        const serverRow = data.data[index];
        const errors = [...new Set([...row.errors, ...(serverRow?.errors ?? [])])];
        const duplicate = row.duplicate || Boolean(serverRow?.duplicate);
        return {
          ...row,
          errors,
          duplicate,
          duplicateOf: row.duplicateOf ?? serverRow?.duplicateOf ?? null,
          include: row.include && errors.length === 0 && !duplicate,
        };
      });
      setRows(updated);
    } catch (err) {
      setRows(drafts);
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Server validation failed. You can still correct the preview and recheck it.');
    } finally { setChecking(false); }
  };

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Choose a CSV file.');
      event.target.value = '';
      return;
    }
    setFormat('csv');
    setResult(null);
    setError('');
    setInput(await file.text());
    setRows([]);
    event.target.value = '';
  };

  const updateRow = (rowIndex: number, update: Partial<ImportRow>) => {
    setRows((current) => current.map((row, index) => {
      if (index !== rowIndex) return row;
      const next = { ...row, ...update };
      const errors = validateDraft(next);
      const include = Object.hasOwn(update, 'include')
        ? Boolean(update.include)
        : errors.length === 0 && (row.include || row.errors.length > 0);
      return { ...next, errors, duplicate: false, duplicateOf: null, include: include && errors.length === 0 };
    }));
    setResult(null);
  };

  const recheckRows = () => validateWithServer(countInBatchDuplicates(rows.map((row) => ({ ...row, errors: validateDraft(row), duplicate: false, duplicateOf: null }))));

  const importQuestions = async () => {
    const selected = rows.filter((row) => row.include && !row.errors.length && !row.duplicate);
    if (!selected.length) return;
    setImporting(true); setError(''); setResult(null);
    try {
      const { data } = await axiosInstance.post<ImportResult>('/quiz/manage/questions/bulk/import', { questions: selected.map(requestQuestion) });
      setResult(data);
      setRows((current) => current.map((row) => ({ ...row, include: false })));
      await onImported();
    } catch (err) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Bulk import could not be completed. No questions were confirmed as imported.');
    } finally { setImporting(false); }
  };

  const addEmptyRow = () => {
    const draft: BulkQuestionDraft = { prompt: '', options: ['', '', '', ''], correctAnswer: '', difficulty: '', category: '', scriptureReference: '', explanation: '', publishAt: '', sourceLine: 0, parseErrors: [] };
    setRows((current) => [...current, { ...rowFromDraft(draft), include: false }]);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-2 sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="bulk-import-title" className="w-full max-w-6xl max-h-[96vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-950 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-950 px-4 py-4 sm:px-6">
          <div><h2 id="bulk-import-title" className="text-lg font-bold text-gray-100">Bulk Import Questions</h2><p className="text-xs text-gray-400 mt-1">Review and confirm before anything is saved.</p></div>
          <button onClick={onClose} aria-label="Close bulk import" className="p-2 text-gray-400 hover:text-gray-100"><X className="h-5 w-5" /></button>
        </header>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setFormat('paste'); setRows([]); setResult(null); }} className={`btn-secondary ${format === 'paste' ? 'border-indigo-400 text-indigo-200' : ''}`}>Paste text</button>
            <button onClick={() => { setFormat('csv'); setRows([]); setResult(null); }} className={`btn-secondary ${format === 'csv' ? 'border-indigo-400 text-indigo-200' : ''}`}><FileSpreadsheet className="h-4 w-4" /> CSV</button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
            {format === 'csv' && <button onClick={() => fileInput.current?.click()} className="btn-secondary"><Upload className="h-4 w-4" />Choose CSV</button>}
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(CSV_TEMPLATE)}`} download="bible-quiz-import-template.csv" className="ml-auto inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"><Download className="h-4 w-4" />Download CSV template</a>
          </div>

          <section className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex flex-wrap justify-between gap-2 mb-2"><label htmlFor="bulk-question-input" className="text-sm font-semibold text-gray-200">{format === 'paste' ? 'Paste numbered questions' : 'CSV contents'}</label>{format === 'paste' && <button onClick={() => setInput(SAMPLE_TEXT)} className="text-xs text-indigo-300 hover:text-indigo-200">Load format example</button>}</div>
            {format === 'paste' && <p className="text-xs text-gray-400 mb-3">Use numbered blocks with A-D options, then Correct Answer, Difficulty, Category, optional Scripture Reference, and Explanation fields. Separate questions with a blank line or <code>---</code>.</p>}
            {format === 'csv' && <p className="text-xs text-gray-400 mb-3">Required columns: prompt, optionA-D, correctAnswer, difficulty, category, explanation. Scripture reference and publishAt are optional.</p>}
            <textarea id="bulk-question-input" value={input} onChange={(event) => { setInput(event.target.value); setRows([]); setResult(null); }} rows={format === 'paste' ? 10 : 7} placeholder={format === 'paste' ? SAMPLE_TEXT : CSV_TEMPLATE} className="admin-textarea font-mono text-xs" />
            <div className="flex flex-wrap gap-2 mt-3"><button disabled={checking || !input.trim()} onClick={parseInput} className="btn-primary"><Check className="h-4 w-4" />{checking ? 'Checking…' : 'Preview questions'}</button>{rows.length > 0 && <button disabled={checking} onClick={recheckRows} className="btn-secondary">Recheck preview</button>}</div>
          </section>

          {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          {result && <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Imported {result.imported} of {result.total} selected questions. {result.invalid} invalid and {result.duplicates} duplicate.</div>}

          {rows.length > 0 && <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">{[
              ['Detected', counts.detected], ['Valid', counts.valid], ['Invalid', counts.invalid], ['Duplicates', counts.duplicates], ['Selected', counts.selected],
            ].map(([label, count]) => <div key={label} className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2"><p className="text-[11px] uppercase text-gray-500">{label}</p><p className="text-lg font-bold text-gray-100">{count}</p></div>)}</div>

            <div className="space-y-3">
              {rows.map((row, index) => <article key={`${row.sourceLine}-${index}`} className={`rounded-lg border p-4 space-y-3 ${row.duplicate ? 'border-amber-500/50 bg-amber-500/5' : row.errors.length ? 'border-red-500/40 bg-red-500/5' : 'border-gray-800 bg-gray-900/50'}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={row.include} disabled={row.errors.length > 0 || row.duplicate || importing} onChange={(event) => updateRow(index, { include: event.target.checked })} />Include</label>
                  <span className="text-xs text-gray-500">{row.sourceLine ? `Source line ${row.sourceLine}` : 'Added row'}</span>
                  {row.duplicate && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300"><AlertTriangle className="h-3.5 w-3.5" />Duplicate{row.duplicateOf ? ` of “${row.duplicateOf}”` : ''}</span>}
                  {row.errors.length > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-300"><AlertTriangle className="h-3.5 w-3.5" />Needs correction</span>}
                  {!row.errors.length && !row.duplicate && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" />Valid</span>}
                  <button disabled={importing} onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Remove question ${index + 1}`} className="ml-auto p-1.5 text-gray-500 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
                </div>

                {row.errors.length > 0 && <ul className="list-disc pl-5 text-xs text-red-300">{row.errors.map((message) => <li key={message}>{message}</li>)}</ul>}
                {row.duplicate && <p className="text-xs text-amber-200">This question matches a question already saved or another row in the batch. Edit the wording or remove this row.</p>}

                <div><label className="admin-label">Question</label><textarea value={row.prompt} onChange={(event) => updateRow(index, { prompt: event.target.value })} rows={2} className="admin-textarea" /></div>
                <div className="grid sm:grid-cols-2 gap-2">{row.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2"><span className="w-5 text-xs font-bold text-gray-400">{String.fromCharCode(65 + optionIndex)}</span><input value={option} onChange={(event) => updateRow(index, { options: row.options.map((value, current) => current === optionIndex ? event.target.value : value) })} className="admin-input" /></div>)}</div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <div><label className="admin-label">Correct answer</label><select value={row.correctAnswer} onChange={(event) => updateRow(index, { correctAnswer: event.target.value })} className="admin-select"><option value="">Select answer</option>{['A', 'B', 'C', 'D'].map((letter) => <option key={letter} value={letter}>{letter}</option>)}</select></div>
                  <div><label className="admin-label">Difficulty</label><select value={row.difficulty.toLowerCase()} onChange={(event) => updateRow(index, { difficulty: event.target.value })} className="admin-select"><option value="">Select difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
                  <div><label className="admin-label">Category</label><select value={row.category.toLowerCase()} onChange={(event) => updateRow(index, { category: event.target.value })} className="admin-select"><option value="">Select category</option><option value="bible">Bible</option><option value="moral">Moral</option></select></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2"><div><label className="admin-label">Scripture reference (optional)</label><input value={row.scriptureReference} onChange={(event) => updateRow(index, { scriptureReference: event.target.value })} className="admin-input" /></div><div><label className="admin-label">Publish at (optional)</label><input type="datetime-local" value={row.publishAt} onChange={(event) => updateRow(index, { publishAt: event.target.value })} className="admin-input" /></div></div>
                <div><label className="admin-label">Explanation</label><textarea value={row.explanation} onChange={(event) => updateRow(index, { explanation: event.target.value })} rows={2} className="admin-textarea" /></div>
              </article>)}
              <button onClick={addEmptyRow} className="btn-secondary"><Plus className="h-4 w-4" />Add question row</button>
            </div>

            <footer className="sticky bottom-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-gray-800 bg-gray-950 py-4">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button disabled={importing || checking || counts.selected === 0} onClick={importQuestions} className="btn-primary">{importing ? <><Loader2 className="h-4 w-4 animate-spin" />Importing…</> : `Import ${counts.selected} valid question${counts.selected === 1 ? '' : 's'}`}</button>
            </footer>
          </>}
        </div>
      </section>
    </div>
  );
}