const ACCEPTED_IMPORT_TYPES = ['csv', 'xlsx', 'xls'];
const SUPPORTED_DELIMITERS = [',', ';', '\t', '|'];

export function getFileExtension(fileName = '') {
  const [ext = ''] = fileName.toLowerCase().split('.').slice(-1);
  return ext.trim();
}

export function validateImportFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select a file to upload.' };
  }

  const ext = getFileExtension(file.name);
  if (!ACCEPTED_IMPORT_TYPES.includes(ext)) {
    return { valid: false, error: 'Only CSV or Excel (.xlsx, .xls) files are supported.' };
  }

  if (typeof file.size === 'number' && file.size === 0) {
    return { valid: false, error: 'The selected file is empty. Please upload a file with a header row.' };
  }

  return { valid: true, error: '' };
}

export function normalizeHeader(header) {
  if (header == null) return '';
  return String(header).replace(/^\uFEFF/, '').replace(/\s+/g, ' ').trim();
}

export function getRowsFromExtractionResult(result) {
  const candidates = [
    result?.output?.rows,
    result?.rows,
    result?.data?.rows,
    result?.output?.data?.rows,
    result?.output,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeExtractedRows(candidate);
    if (normalized.length) return normalized;
  }

  return [];
}

function normalizeExtractedRows(candidate) {
  if (!Array.isArray(candidate)) return [];
  if (candidate.length === 0) return [];

  if (
    candidate.length === 1 &&
    candidate[0] &&
    typeof candidate[0] === 'object' &&
    !Array.isArray(candidate[0]) &&
    Array.isArray(candidate[0].rows)
  ) {
    return normalizeExtractedRows(candidate[0].rows);
  }

  if (
    candidate.every(
      row => row && typeof row === 'object' && !Array.isArray(row) && Array.isArray(row.rows)
    )
  ) {
    return candidate
      .flatMap(row => normalizeExtractedRows(row.rows))
      .filter(row => row != null);
  }

  return candidate;
}

export function extractHeadersAndSample(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { headers: [], normalizedHeaders: [], sampleRow: {}, rowCount: 0 };
  }

  const objectRows = rows.filter(row => row && typeof row === 'object' && !Array.isArray(row));
  if (objectRows.length > 0) {
    const seenNormalized = new Set();
    const headers = [];
    const sampleRow = {};
    const firstRow = objectRows[0] || {};
    objectRows.forEach(row => {
      Object.keys(row).forEach((key) => {
        const rawHeader = String(key);
        const normalized = normalizeHeader(rawHeader);
        if (!normalized || seenNormalized.has(normalized)) return;
        seenNormalized.add(normalized);
        headers.push(normalized);
        if (Object.prototype.hasOwnProperty.call(firstRow, key)) {
          sampleRow[normalized] = firstRow[key];
        }
      });
    });

    return { headers, normalizedHeaders: headers, sampleRow, rowCount: objectRows.length };
  }

  const firstRow = rows[0];
  if (!Array.isArray(firstRow)) {
    return { headers: [], normalizedHeaders: [], sampleRow: {}, rowCount: 0 };
  }

  const headerEntries = firstRow.reduce((acc, header) => {
    const rawHeader = String(header ?? '');
    const normalized = normalizeHeader(rawHeader);
    if (!normalized) return acc;
    acc.push({ rawHeader, normalized });
    return acc;
  }, []);
  const headers = headerEntries.map(({ rawHeader }) => rawHeader);
  const normalizedHeaders = headerEntries.map(({ normalized }) => normalized);
  const sampleValues = Array.isArray(rows[1]) ? rows[1] : [];
  const sampleRow = Object.fromEntries(headers.map((header, index) => [header, sampleValues[index]]));

  return { headers, normalizedHeaders, sampleRow, rowCount: Math.max(rows.length - 1, 0) };
}

function splitCsvLine(line, delimiter) {
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && char === delimiter) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function detectDelimiter(line) {
  return SUPPORTED_DELIMITERS.reduce((best, delimiter) => {
    const count = line.split(delimiter).length - 1;
    return count > best.count ? { delimiter, count } : best;
  }, { delimiter: ',', count: -1 }).delimiter;
}

export function extractCsvHeadersFromText(content = '') {
  const lines = String(content).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);
  return splitCsvLine(lines[0], delimiter)
    .map(normalizeHeader)
    .filter(Boolean);
}
