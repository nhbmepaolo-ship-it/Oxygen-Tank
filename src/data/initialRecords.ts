import { InspectionRecord } from '../types';
import { RAW_CSV_DATA } from './rawCsvData';

export function normalizeThaiYear(rawYear: string): string {
  const y = rawYear.trim();
  if (y === '2568' || y === '0068' || y === '68') return '2025';
  if (y === '2569' || y === '69') return '2026';
  return y;
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export function parseCsvRows(raw: string): InspectionRecord[] {
  const lines = raw.trim().split('\n');
  const records: InspectionRecord[] = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const parts = parseCsvLine(line);
    if (parts.length < 13) return;

    const rawTimestampDate = parts[0];
    const rawTime = parts[1] || '';
    const inspector = parts[2] || 'ไม่ระบุ';
    const rawCheckDate = parts[3] || rawTimestampDate;
    const ward4_9 = parts[4] || '-';
    const ward4_8_ari = parts[5] || '-';
    const building4_7_pt = parts[6] || '-';
    const ward4_6 = parts[7] || '-';
    const building4_3_opd = parts[8] || '-';
    const building4_2_icu = parts[9] || '-';
    const building4_1_storage = parts[10] || '-';

    const parseNum = (val: string): number => {
      if (!val) return 0;
      const clean = val.replace(/[^0-9]/g, '');
      const num = parseInt(clean, 10);
      return isNaN(num) ? 0 : num;
    };

    let readyDigitalTanks = parseNum(parts[11]);
    let readyGaugeTanks = parseNum(parts[12]);
    let issues = parts.slice(13).join(', ') || 'พร้อมใช้งาน';

    // Sanity check: In typical BME hospital operations, tanks count is in range 0-80
    // If readyDigitalTanks > 100 or readyGaugeTanks > 100, look for legitimate tank counts
    if (readyDigitalTanks > 100 || readyGaugeTanks > 100) {
      // Find candidate numbers in remaining parts
      const remainingNums = parts.slice(11).map(parseNum).filter((n) => n > 0 && n <= 100);
      if (remainingNums.length >= 2) {
        readyDigitalTanks = remainingNums[0];
        readyGaugeTanks = remainingNums[1];
      }
    }

    const totalReadyTanks = readyDigitalTanks + readyGaugeTanks;

    // Normalize date format: d/m/yyyy with standard year (2025 or 2026)
    let date = rawCheckDate;
    const dateParts = date.split('/');
    if (dateParts.length >= 3) {
      const normY = normalizeThaiYear(dateParts[2]);
      date = `${dateParts[0]}/${dateParts[1]}/${normY}`;
    }

    const timestamp = rawTime ? `${date}, ${rawTime}` : `${date}, 04:30:00`;

    // Low stock criteria: Digital < 20 OR Total ready < 40
    const isLowStock = readyDigitalTanks < 20 || totalReadyTanks < 40;

    records.push({
      id: `rec-${index + 1}`,
      timestamp,
      inspector,
      date,
      ward4_9,
      ward4_8_ari,
      building4_7_pt,
      ward4_6,
      building4_3_opd,
      building4_2_icu,
      building4_1_storage,
      readyDigitalTanks,
      readyGaugeTanks,
      totalReadyTanks,
      issues: issues.trim() || 'พร้อมใช้งาน',
      isLowStock,
      syncedToLine: true,
      syncedToSheet: true,
      createdAt: new Date().toISOString(),
    });
  });

  return records;
}

export const INITIAL_RECORDS: InspectionRecord[] = parseCsvRows(RAW_CSV_DATA);
