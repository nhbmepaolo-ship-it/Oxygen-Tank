import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionRecord } from '../types';

export const SHEET_HEADERS = [
  'ประทับเวลา',
  'ชื่อผู้ตรวจเช็ค',
  'วันที่ตรวจเช็ค',
  'Ward4/9',
  'Ward4/8 (ARI)',
  'อาคาร4/7 (PT)',
  'Ward4/6',
  'อาคาร4/3 (OPD)',
  'อาคาร4/2 (ICU)',
  'อาคาร4/1 (ห้องเก็บอ๊อกซิเจน)',
  'จำนวนถังดิจิตอลรุ่นใหม่ที่พร้อมใช้งาน(ถัง)',
  'จำนวนถังแบบหัวเกย์รุ่นเก่าที่พร้อมใช้งาน',
  'ประเด็นปัญหาที่พบในการตรวจเช็ค',
];

export function exportToExcel(records: InspectionRecord[], filename = 'BME_Oxygen_Inspection_Report.xlsx') {
  const data = records.map((r) => ({
    'ประทับเวลา': r.timestamp,
    'ชื่อผู้ตรวจเช็ค': r.inspector,
    'วันที่ตรวจเช็ค': r.date,
    'Ward4/9': r.ward4_9,
    'Ward4/8 (ARI)': r.ward4_8_ari,
    'อาคาร4/7 (PT)': r.building4_7_pt,
    'Ward4/6': r.ward4_6,
    'อาคาร4/3 (OPD)': r.building4_3_opd,
    'อาคาร4/2 (ICU)': r.building4_2_icu,
    'อาคาร4/1 (ห้องเก็บอ๊อกซิเจน)': r.building4_1_storage,
    'ถังดิจิตอลรุ่นใหม่(ถัง)': r.readyDigitalTanks,
    'ถังหัวเกย์รุ่นเก่า(ถัง)': r.readyGaugeTanks,
    'รวมถังพร้อมใช้': r.totalReadyTanks,
    'สถานะสั่งซื้อ': r.isLowStock ? '🚨 ต่ำกว่าเกณฑ์ (สั่งด่วน)' : 'ปกติ',
    'ประเด็นปัญหาที่พบ': r.issues,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Oxygen_Checks');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // timestamp
    { wch: 18 }, // inspector
    { wch: 14 }, // date
    { wch: 12 }, // 4/9
    { wch: 14 }, // 4/8
    { wch: 14 }, // 4/7
    { wch: 12 }, // 4/6
    { wch: 14 }, // 4/3
    { wch: 14 }, // 4/2
    { wch: 22 }, // 4/1
    { wch: 18 }, // digital
    { wch: 18 }, // gauge
    { wch: 15 }, // total
    { wch: 20 }, // status
    { wch: 30 }, // issues
  ];

  XLSX.writeFile(workbook, filename);
}

export function downloadNewSheetTemplate(sheetId?: string) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    SHEET_HEADERS,
    // Sample first row
    [
      new Date().toLocaleString('th-TH'),
      'เอกพงษ์',
      new Date().toLocaleDateString('th-TH'),
      'FULL',
      '110',
      '550',
      'FULL',
      '450',
      'FULL',
      '500',
      '35',
      '30',
      'พร้อมใช้งาน',
    ],
  ]);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'OxygenDailyLog');
  const filename = sheetId
    ? `GoogleSheet_Template_${sheetId.substring(0, 8)}.xlsx`
    : 'Oxygen_Daily_Log_Template.xlsx';
  XLSX.writeFile(wb, filename);
}

export function exportToPDF(
  records: InspectionRecord[],
  title = 'รายงานสรุปการตรวจเช็คถังออกซิเจน แผนก BME',
  subtitle = 'ระบบบันทึกและติดตามสถานะออกซิเจนประจำวัน'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Title
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('BME Hospital Oxygen Tank Daily Inspection Report', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${title} | ${subtitle}`, 14, 21);
  doc.text(`Exported: ${new Date().toLocaleString('th-TH')} | Total Records: ${records.length}`, 14, 27);

  // Summary statistics calculation
  const totalChecks = records.length;
  const lowStockCount = records.filter((r) => r.isLowStock).length;
  const avgTotal = totalChecks ? Math.round(records.reduce((acc, r) => acc + r.totalReadyTanks, 0) / totalChecks) : 0;
  const latest = records[0] || null;

  // Mini summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 31, 269, 14, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Latest Stock: Digital ${latest?.readyDigitalTanks ?? 0} | Gauge ${latest?.readyGaugeTanks ?? 0} | Total ${latest?.totalReadyTanks ?? 0} tanks  ||  Average Available: ${avgTotal} tanks  ||  Days Below Reorder Threshold: ${lowStockCount} days`,
    18,
    40
  );

  const tableBody = records.map((r) => [
    r.date,
    r.timestamp.split(',')[1]?.trim() || '',
    r.inspector,
    r.ward4_9,
    r.ward4_8_ari,
    r.building4_7_pt,
    r.ward4_6,
    r.building4_3_opd,
    r.building4_2_icu,
    r.building4_1_storage,
    r.readyDigitalTanks.toString(),
    r.readyGaugeTanks.toString(),
    r.totalReadyTanks.toString(),
    r.isLowStock ? 'ORDER NEEDED' : 'NORMAL',
    r.issues.length > 25 ? r.issues.substring(0, 23) + '...' : r.issues,
  ]);

  autoTable(doc, {
    startY: 48,
    head: [
      [
        'Date',
        'Time',
        'Inspector',
        'W4/9',
        'W4/8 ARI',
        'B4/7 PT',
        'W4/6',
        'OPD 4/3',
        'ICU 4/2',
        'Storage 4/1',
        'Digital',
        'Gauge',
        'Total',
        'Status',
        'Issues/Remarks',
      ],
    ],
    body: tableBody,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save('BME_Oxygen_Inspection_Report.pdf');
}
