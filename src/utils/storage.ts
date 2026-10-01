import { InspectionRecord, Employee, SystemSettings, CurrentUser } from '../types';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees';
import { INITIAL_RECORDS } from '../data/initialRecords';

const STORAGE_KEYS = {
  RECORDS: 'bme_oxygen_records_v5',
  EMPLOYEES: 'bme_oxygen_employees_v2',
  SETTINGS: 'bme_oxygen_settings_v1',
  USER: 'bme_oxygen_current_user_v1',
};

export const DEFAULT_SETTINGS: SystemSettings = {
  externalEmails: ['nhbmepaolo01@gmail.com'],
  reportHour: 16,
  reportMinute: 30,
  digitalLowThreshold: 20,
  gaugeLowThreshold: 20,
  totalLowThreshold: 40,
  sheetId: '1PIyrbX22UVaqqxzSZetUL_G1k6_n3XXu7hgPulAJVds',
  webhookUrl: 'https://webhook.site/7a150790-aaf4-4ba2-ba66-4731f6d1b91a',
  lineChannelAccessToken:
    '9muhzHMwL5AOje0lzuZKLIGvGJw72u72aFa2itjTUt9rDwPnyADBA+gTv/5YhH6v0s7vRKBNPaCGY+z+aUlPwM0CcZP0sci5T4EdSQORmTK8B4KPevTWCwYgyTrKEVmrwmSihd3GF4YSgeEzWlayGAdB04t89/1O/w1cDnyilFU=',
  lineGroupId: 'C0d56d86a30886df48499737f53e60b28',
  lineUserId: 'Ub95fbfe9db3b57c45039abe293c42453',
};

export const DEFAULT_GUEST_USER: CurrentUser = {
  id: 'guest',
  username: 'guest',
  name: 'บุคคลทั่วไป (ผู้เข้าชม)',
  nickname: 'Guest',
  position: 'ผู้เยี่ยมชม (ดูข้อมูลเท่านั้น)',
  role: 'guest',
  isLoggedIn: false,
};

export function loadSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    // Also sync to server in background
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadRecords(): InspectionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= INITIAL_RECORDS.length) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load records:', e);
  }
  // Initialize with the full provided historical dataset
  saveRecords(INITIAL_RECORDS);
  return INITIAL_RECORDS;
}

export function resetToInitialRecords(): InspectionRecord[] {
  saveRecords(INITIAL_RECORDS);
  return INITIAL_RECORDS;
}

export function saveRecords(records: InspectionRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    // Also sync to server in background
    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save records:', e);
  }
}

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load employees:', e);
  }
  saveEmployees(INITIAL_EMPLOYEES);
  return INITIAL_EMPLOYEES;
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    // Also sync to server in background
    fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employees),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save employees:', e);
  }
}

export function loadCurrentUser(): CurrentUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load current user:', e);
  }
  return DEFAULT_GUEST_USER;
}

export function saveCurrentUser(user: CurrentUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save current user:', e);
  }
}

// Calculate the next end of month at 16:30
export function getNextEndOfMonth1630(): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Last day of current month
  const lastDayCurrentMonth = new Date(year, month + 1, 0, 16, 30, 0);
  
  if (now.getTime() < lastDayCurrentMonth.getTime()) {
    return lastDayCurrentMonth;
  }
  // Otherwise last day of next month
  return new Date(year, month + 2, 0, 16, 30, 0);
}
