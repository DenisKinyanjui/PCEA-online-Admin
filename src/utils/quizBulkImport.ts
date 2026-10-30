export interface BulkQuestionDraft {
  prompt: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
  category: string;
  scriptureReference: string;
  explanation: string;
  publishAt: string;
  sourceLine: number;
  parseErrors: string[];
}

export interface CsvParseResult {
  questions: BulkQuestionDraft[];
  errors: string[];
}

const QUESTION_START = /^\s*(?:question\s*)?\d+\s*[:.)-]\s*(.*)$/i;
const OPTION_LINE = /^\s*([A-D])\s*[.)]\s*(.*)$/i;
const FIELD_LINE = /^\s*(difficulty|category|correct(?:\s+answer)?|scripture(?:\s+reference)?|explanation|publish(?:\s+at)?)\s*:\s*(.*)$/i;

function makeDraft(sourceLine: number, values: Partial<BulkQuestionDraft>, parseErrors: string[] = []): BulkQuestionDraft {
  const options = values.options ?? ['', '', '', ''];
  const answer = values.correctAnswer?.trim() ?? '';
  const matchingOption = options.findIndex((option) => option.trim().toLowerCase() === answer.toLowerCase());
  const correctAnswer = /^[A-D]$/i.test(answer) ? answer.toUpperCase() : matchingOption >= 0 ? String.fromCharCode(65 + matchingOption) : answer.toUpperCase();
  return {
    prompt: values.prompt?.trim() ?? '',
    options,
    correctAnswer,
    difficulty: values.difficulty?.trim().toLowerCase() ?? '',
    category: values.category?.trim() ?? '',
    scriptureReference: values.scriptureReference?.trim() ?? '',
    explanation: values.explanation?.trim() ?? '',
    publishAt: values.publishAt?.trim() ?? '',
    sourceLine,
    parseErrors,
  };
}

export function parsePastedQuestions(input: string): BulkQuestionDraft[] {
  const lines = input.replace(/\r\n?/g, '\n').split('\n');
  const blocks: { line: number; lines: string[] }[] = [];
  lines.forEach((line, index) => {
    const start = line.match(QUESTION_START);
    if (start) blocks.push({ line: index + 1, lines: [start[1]] });
    else if (blocks.length && line.trim() !== '---') blocks[blocks.length - 1].lines.push(line);
  });

  return blocks.map(({ line, lines: block }) => {
    const options = ['', '', '', ''];
    const errors: string[] = [];
    const values: Partial<BulkQuestionDraft> = { options };
    let optionMode = false;
    let activeField: 'prompt' | 'explanation' | null = 'prompt';
    for (const currentLine of block) {
      const option = currentLine.match(OPTION_LINE);
      if (option) {
        const index = option[1].toUpperCase().charCodeAt(0) - 65;
        if (options[index]) errors.push(`Option ${option[1].toUpperCase()} is repeated`);
        options[index] = option[2].trim();
        optionMode = true;
        activeField = null;
        continue;
      }
      const field = currentLine.match(FIELD_LINE);
      if (field) {
        const key = field[1].toLowerCase().replace(/\s+/g, ' ');
        const value = field[2].trim();
        if (key === 'difficulty') values.difficulty = value;
        else if (key === 'category') values.category = value;
        else if (key === 'correct' || key === 'correct answer') values.correctAnswer = value;
        else if (key === 'scripture' || key === 'scripture reference') values.scriptureReference = value;
        else if (key === 'publish' || key === 'publish at') values.publishAt = value;
        else { values.explanation = value; activeField = 'explanation'; }
        continue;
      }
      if (!currentLine.trim()) continue;
      if (activeField === 'explanation') values.explanation = `${values.explanation ?? ''}\n${currentLine.trim()}`.trim();
      else if (!optionMode && activeField === 'prompt') values.prompt = `${values.prompt ?? ''}\n${currentLine.trim()}`.trim();
      else errors.push(`Unrecognized line: ${currentLine.trim()}`);
    }
    if (options.some((option) => !option)) errors.push('All four options A-D are required');
    return makeDraft(line, values, errors);
  });
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field');
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

const headerKey = (value: string) => value.trim().toLowerCase().replace(/[\s_-]/g, '');

export function parseCsvQuestions(input: string): CsvParseResult {
  let rows: string[][];
  try { rows = parseCsvRows(input.replace(/^\uFEFF/, '')); }
  catch (error) { return { questions: [], errors: [(error as Error).message] }; }
  const firstNonEmpty = rows.findIndex((row) => row.some((cell) => cell.trim()));
  if (firstNonEmpty < 0) return { questions: [], errors: ['CSV file is empty'] };
  const headers = rows[firstNonEmpty].map(headerKey);
  const aliases: Record<string, string[]> = {
    prompt: ['prompt', 'question'],
    optionA: ['optiona', 'a'], optionB: ['optionb', 'b'], optionC: ['optionc', 'c'], optionD: ['optiond', 'd'],
    correctAnswer: ['correctanswer', 'correct'],
    difficulty: ['difficulty'], category: ['category'],
    scriptureReference: ['scripturereference', 'scripture'], explanation: ['explanation'], publishAt: ['publishat'],
  };
  const indexes = Object.fromEntries(Object.entries(aliases).map(([key, names]) => [key, headers.findIndex((header) => names.includes(header))]));
  const required = ['prompt', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'difficulty', 'category', 'explanation'];
  const missing = required.filter((key) => indexes[key] < 0);
  if (missing.length) return { questions: [], errors: [`Missing CSV columns: ${missing.join(', ')}`] };
  const questions = rows.slice(firstNonEmpty + 1).flatMap((cells, rowIndex) => {
    if (!cells.some((cell) => cell.trim())) return [];
    const value = (key: string) => indexes[key] < 0 ? '' : (cells[indexes[key]] ?? '').trim();
    const options = ['optionA', 'optionB', 'optionC', 'optionD'].map(value);
    const answer = value('correctAnswer');
    return [makeDraft(firstNonEmpty + rowIndex + 2, {
      prompt: value('prompt'), options, correctAnswer: answer,
      difficulty: value('difficulty').toLowerCase(), category: value('category'),
      scriptureReference: value('scriptureReference'), explanation: value('explanation'), publishAt: value('publishAt'),
    })];
  });
  return { questions, errors: [] };
}

export function normalizeQuestionPrompt(prompt: string): string {
  return prompt.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}