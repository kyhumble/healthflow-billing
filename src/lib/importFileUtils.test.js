import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractCsvHeadersFromText,
  extractHeadersAndSample,
  getRowsFromExtractionResult,
  validateImportFile,
} from './importFileUtils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(__dirname, '__fixtures__/import-columns-sample.csv');

test('extracts headers from representative sample csv fixture', () => {
  const csvText = readFileSync(fixturePath, 'utf-8');
  assert.deepEqual(extractCsvHeadersFromText(csvText), ['Patient Name', 'DOS', 'Balance', 'Claim #']);
});

test('extracts headers and sample row from extraction result rows', () => {
  const rows = getRowsFromExtractionResult({
    rows: [{ ' Patient Name ': 'Jane Doe', DOS: '2026-01-01', Balance: '123.45' }],
  });
  const parsed = extractHeadersAndSample(rows);

  assert.deepEqual(parsed.headers, ['Patient Name', 'DOS', 'Balance']);
  assert.deepEqual(parsed.sampleRow, {
    'Patient Name': 'Jane Doe',
    DOS: '2026-01-01',
    Balance: '123.45',
  });
  assert.equal(parsed.rowCount, 1);
});

test('returns user-facing error for empty file upload', () => {
  const result = validateImportFile({ name: 'claims.csv', size: 0 });
  assert.equal(result.valid, false);
  assert.match(result.error, /empty/i);
});

test('returns user-facing error for unsupported file type upload', () => {
  const result = validateImportFile({ name: 'claims.txt', size: 10 });
  assert.equal(result.valid, false);
  assert.match(result.error, /Only CSV or Excel/i);
});

test('reports missing header when csv first row has no column names', () => {
  const headers = extractCsvHeadersFromText(',,,\nvalue1,value2,value3,value4');
  assert.deepEqual(headers, []);
});
