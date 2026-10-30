import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuestionPrompt, parseCsvQuestions, parsePastedQuestions } from '../src/utils/quizBulkImport.ts';

test('parses numbered question blocks with A-D options and metadata', () => {
  const questions = parsePastedQuestions([
    'Question 1: Who built the ark?',
    'A. Noah',
    'B. Moses',
    'C. David',
    'D. Peter',
    'Correct Answer: A',
    'Difficulty: easy',
    'Category: Bible',
    'Scripture Reference: Genesis 6',
    'Explanation: God instructed Noah to build it.',
    '---',
    '2. What is a moral response to a neighbor in need?',
    'A) Ignore them',
    'B) Help them',
    'C) Mock them',
    'D) Leave',
    'Correct: B',
    'Difficulty: medium',
    'Category: Moral',
    'Explanation: Show compassion.',
  ].join('\n'));

  assert.equal(questions.length, 2);
  assert.equal(questions[0].correctAnswer, 'A');
  assert.equal(questions[0].scriptureReference, 'Genesis 6');
  assert.equal(questions[1].category, 'Moral');
  assert.deepEqual(questions.map((question) => question.parseErrors), [[], []]);
});

test('reports malformed text option lines for preview', () => {
  const [question] = parsePastedQuestions('Question 1: What is true?\nA. One\nB. Two\nCorrect Answer: E');
  assert.ok(question.parseErrors.some((error) => error.includes('four options')));
  assert.equal(question.correctAnswer, 'E');
});

test('parses CSV quoted commas, escaped quotes, and multiple records', () => {
  const csv = [
    'prompt,optionA,optionB,optionC,optionD,correctAnswer,difficulty,category,scriptureReference,explanation',
    '"Who built it?",Noah,Moses,David,Peter,Noah,easy,Bible,Genesis 6,"A quoted, clear explanation"',
    '"What did he say?",Yes,No,Maybe,Later,B,hard,Moral,,"He said ""be kind"" to them."',
  ].join('\n');
  const result = parseCsvQuestions(csv);
  assert.deepEqual(result.errors, []);
  assert.equal(result.questions.length, 2);
  assert.equal(result.questions[0].correctAnswer, 'A');
  assert.equal(result.questions[0].explanation, 'A quoted, clear explanation');
  assert.equal(result.questions[1].explanation, 'He said "be kind" to them.');
});

test('flags missing CSV columns and malformed quoting', () => {
  assert.ok(parseCsvQuestions('prompt,optionA\nQuestion,Answer').errors[0].includes('Missing CSV columns'));
  assert.ok(parseCsvQuestions('prompt,optionA\n"unclosed').errors[0].includes('unclosed quoted field'));
});

test('normalizes prompt whitespace and case for duplicate detection', () => {
  assert.equal(normalizeQuestionPrompt('  WHO   built the Ark? '), 'who built the ark?');
});

test('accepts a UTF-8 BOM before CSV headers', () => {
  const result = parseCsvQuestions('\uFEFFprompt,optionA,optionB,optionC,optionD,correctAnswer,difficulty,category,explanation\nQuestion,One,Two,Three,Four,A,easy,Bible,Explanation');
  assert.deepEqual(result.errors, []);
  assert.equal(result.questions.length, 1);
});