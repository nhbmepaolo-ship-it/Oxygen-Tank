import { InspectionRecord } from '../types';
import { RAW_CSV_DATA } from './rawCsvData';

export function parseCsvRows(raw: string): InspectionRecord[] {
  const lines = raw.trim().split('\n');
  const records: InspectionRecord[] = [];

  lines.forEach((line, index) => {
    if (!line.trim()) return;
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 13) return;

    const timestamp = `${parts[0]}, ${parts[1]}`;
    const inspector = parts[2] || 'ไม่ระบุ';
    const date = parts[3] || parts[0];
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

    const readyDigitalTanks = parseNum(parts[11]);
    const readyGaugeTanks = parseNum(parts[12]);
    const totalReadyTanks = readyDigitalTanks + readyGaugeTanks;
    const issues = parts.slice(13).join(', ') || 'พร้อมใช้งาน';

    // Criteria: Digital < 20 or Total < 40 is low stock
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
