export interface InspectionRecord {
  id: string;
  timestamp: string; // e.g. "1/10/2026, 2:15:02"
  inspector: string; // e.g. "อรรถพล"
  inspectorId?: string; // e.g. "500009"
  date: string; // e.g. "1/10/2026"
  ward4_9: string;
  ward4_8_ari: string;
  building4_7_pt: string;
  ward4_6: string;
  building4_3_opd: string;
  building4_2_icu: string;
  building4_1_storage: string;
  readyDigitalTanks: number; // ถังดิจิตอลรุ่นใหม่
  readyGaugeTanks: number; // ถังหัวเกย์รุ่นเก่า
  totalReadyTanks: number; // รวม
  issues: string; // ประเด็นปัญหาที่พบ
  isLowStock: boolean; // true if below threshold
  syncedToLine?: boolean;
  syncedToSheet?: boolean;
  createdAt: string;
}

export type UserRole = 'guest' | 'staff' | 'head' | 'admin';

export interface Employee {
  id: string; // e.g. "500001"
  code: string; // e.g. "500001"
  name: string; // e.g. "เอกพงษ์ โกมล"
  nickname: string; // e.g. "เอ็ม"
  position: string; // e.g. "หัวหน้าหน่วย", "พนักงานรับส่งผู้ป่วย"
  phone?: string;
  status: 'active' | 'resigned';
  role: UserRole;
  password?: string;
  resignedDate?: string;
  resignedReason?: string;
  updatedAt?: string;
}

export interface SystemSettings {
  externalEmails: string[]; // e.g. ["nhbmepaolo01@gmail.com"]
  reportHour: number; // 16
  reportMinute: number; // 30
  digitalLowThreshold: number; // default: 20
  gaugeLowThreshold: number; // default: 20
  totalLowThreshold: number; // default: 40
  sheetId: string; // "1PIyrbX22UVaqqxzSZetUL_G1k6_n3XXu7hgPulAJVds"
  webhookUrl: string; // "https://webhook.site/7a150790-aaf4-4ba2-ba66-4731f6d1b91a"
  lineChannelAccessToken: string;
  lineGroupId: string; // "C0d56d86a30886df48499737f53e60b28"
  lineUserId: string; // "Ub95fbfe9db3b57c45039abe293c42453"
  googleAppsScriptUrl?: string;
  lastMonthlyReportSent?: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  nickname: string;
  position: string;
  role: UserRole;
  isLoggedIn: boolean;
}
