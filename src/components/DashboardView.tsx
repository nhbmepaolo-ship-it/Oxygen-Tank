import React, { useState, useMemo } from 'react';
import { InspectionRecord, SystemSettings } from '../types';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  TrendingDown,
  TrendingUp,
  Gauge,
  Box,
  Layers,
  Wrench,
  FileSpreadsheet,
  Download,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Building2,
  Stethoscope,
  Check,
  Info,
  ChevronLeft,
  Flame,
  BarChart3,
  CalendarDays,
  UserCheck,
  RotateCcw,
  Bell,
  Send,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { sendLineAndWebhookNotifications } from '../utils/lineService';

interface DashboardViewProps {
  records: InspectionRecord[];
  settings: SystemSettings;
  onOpenNewCheck: () => void;
  onNavigateToRecords: () => void;
  canRecord: boolean;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onResetData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  settings,
  onOpenNewCheck,
  onNavigateToRecords,
  canRecord,
  onExportExcel,
  onExportPDF,
  onResetData,
}) => {
  // Default to 'all' so that user immediately sees rich, complete data on page load
  const [filterMode, setFilterMode] = useState<'all' | 'monthly' | 'daily' | 'yearly'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('9'); // September 2026 has 29 records
  const [selectedDate, setSelectedDate] = useState<string>('1/10/2026');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'issues'>('all');
  const [hoveredRecord, setHoveredRecord] = useState<InspectionRecord | null>(null);
  const [pinnedRecord, setPinnedRecord] = useState<InspectionRecord | null>(null);
  const [chartViewType, setChartViewType] = useState<'grouped' | 'stacked'>('grouped');

  const THAI_MONTHS = [
    { num: '1', name: 'มกราคม', short: 'ม.ค.' },
    { num: '2', name: 'กุมภาพันธ์', short: 'ก.พ.' },
    { num: '3', name: 'มีนาคม', short: 'มี.ค.' },
    { num: '4', name: 'เมษายน', short: 'เม.ย.' },
    { num: '5', name: 'พฤษภาคม', short: 'พ.ค.' },
    { num: '6', name: 'มิถุนายน', short: 'มิ.ย.' },
    { num: '7', name: 'กรกฎาคม', short: 'ก.ค.' },
    { num: '8', name: 'สิงหาคม', short: 'ส.ค.' },
    { num: '9', name: 'กันยายน', short: 'ก.ย.' },
    { num: '10', name: 'ตุลาคม', short: 'ต.ค.' },
    { num: '11', name: 'พฤศจิกายน', short: 'พ.ย.' },
    { num: '12', name: 'ธันวาคม', short: 'ธ.ค.' },
  ];

  // Helper to extract normalized year, month, day
  const getNormalizedDateParts = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length < 3) return { day: '1', month: '1', year: '2026' };
    const day = parts[0];
    const month = parts[1];
    let year = parts[2];
    if (year === '2568' || year === '0068' || year === '68') year = '2025';
    if (year === '2569' || year === '69') year = '2026';
    return { day, month, year };
  };

  // Month counts calculation for current year
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const { month, year } = getNormalizedDateParts(r.date);
      if (year === selectedYear) {
        counts[month] = (counts[month] || 0) + 1;
      }
    });
    return counts;
  }, [records, selectedYear]);

  // Unique list of dates in records for daily filter selector
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.date));
    return Array.from(set).reverse();
  }, [records]);

  // Latest inspection overall
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  // Filtered records based on active mode
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const { day, month, year } = getNormalizedDateParts(r.date);

      let matchPeriod = true;
      if (filterMode === 'daily') {
        const normSelected = getNormalizedDateParts(selectedDate);
        matchPeriod =
          r.date === selectedDate ||
          `${day}/${month}/${year}` === `${normSelected.day}/${normSelected.month}/${normSelected.year}`;
      } else if (filterMode === 'monthly') {
        const matchesYear = year === selectedYear || year.endsWith(selectedYear.slice(-2));
        const matchesMonth = month === selectedMonth;
        matchPeriod = matchesYear && matchesMonth;
      } else if (filterMode === 'yearly') {
        matchPeriod = year === selectedYear || year.endsWith(selectedYear.slice(-2));
      } else if (filterMode === 'all') {
        matchPeriod = true;
      }

      if (!matchPeriod) return false;

      // Status filter
      if (statusFilter === 'critical') return r.isLowStock;
      if (statusFilter === 'issues') {
        return Boolean(
          r.issues &&
          r.issues !== 'พร้อมใช้งาน' &&
          r.issues !== 'พร้อมใช้' &&
          r.issues !== '-' &&
          r.issues !== '*'
        );
      }
      return true;
    });
  }, [records, filterMode, selectedYear, selectedMonth, selectedDate, statusFilter]);

  // Overall key metrics in current filtered view
  const totalChecks = filteredRecords.length;
  const criticalDays = filteredRecords.filter((r) => r.isLowStock).length;
  const issueReports = filteredRecords.filter(
    (r) =>
      r.issues &&
      r.issues !== 'พร้อมใช้งาน' &&
      r.issues !== 'พร้อมใช้' &&
      r.issues !== '-' &&
      r.issues !== '*'
  ).length;

  const averageTotal =
    totalChecks > 0
      ? Math.round(filteredRecords.reduce((sum, r) => sum + r.totalReadyTanks, 0) / totalChecks)
      : 0;
  const averageDigital =
    totalChecks > 0
      ? Math.round(filteredRecords.reduce((sum, r) => sum + r.readyDigitalTanks, 0) / totalChecks)
      : 0;
  const averageGauge =
    totalChecks > 0
      ? Math.round(filteredRecords.reduce((sum, r) => sum + r.readyGaugeTanks, 0) / totalChecks)
      : 0;

  const minTotal =
    totalChecks > 0 ? Math.min(...filteredRecords.map((r) => r.totalReadyTanks)) : 0;
  const maxTotal =
    totalChecks > 0 ? Math.max(...filteredRecords.map((r) => r.totalReadyTanks)) : 0;

  // Yearly monthly aggregation when filterMode === 'yearly'
  const yearlyMonthlyData = useMemo(() => {
    if (filterMode !== 'yearly') return [];

    return THAI_MONTHS.map((m) => {
      const monthRecords = records.filter((r) => {
        const { month, year } = getNormalizedDateParts(r.date);
        const matchYear = year === selectedYear || year.endsWith(selectedYear.slice(-2));
        return matchYear && month === m.num;
      });

      const count = monthRecords.length;
      const avgDigital =
        count > 0 ? Math.round(monthRecords.reduce((s, r) => s + r.readyDigitalTanks, 0) / count) : 0;
      const avgGauge =
        count > 0 ? Math.round(monthRecords.reduce((s, r) => s + r.readyGaugeTanks, 0) / count) : 0;
      const avgTot =
        count > 0 ? Math.round(monthRecords.reduce((s, r) => s + r.totalReadyTanks, 0) / count) : 0;
      const critCount = monthRecords.filter((r) => r.isLowStock).length;

      return {
        month: m.name,
        short: m.short,
        num: m.num,
        count,
        avgDigital,
        avgGauge,
        avgTot,
        critCount,
        hasData: count > 0,
      };
    });
  }, [records, filterMode, selectedYear]);

  // Subset of records for daily/monthly trend chart
  const chartRecords = useMemo(() => {
    if (filterMode === 'yearly') return [];
    if (filterMode === 'daily') {
      // Find index of selected date, take previous 7 days + that date for context
      const idx = records.findIndex((r) => r.date === selectedDate);
      if (idx !== -1) {
        return records.slice(Math.max(0, idx - 6), idx + 1);
      }
      return records.slice(-7);
    }
    if (filterMode === 'monthly') {
      return [...filteredRecords];
    }
    // Mode 'all': return the latest 30 chronological records
    const list = [...filteredRecords];
    return list.slice(-30);
  }, [records, filteredRecords, filterMode, selectedDate]);

  const isLatestCritical = latestRecord?.isLowStock ?? false;

  // Station status formatting helper
  const getStationBadge = (val?: string) => {
    if (!val || val === '-' || val === '.' || val === '0') {
      return { text: 'ไม่ประจำจุด / 0', icon: '⚪', bg: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
    const clean = val.toUpperCase();
    if (clean.includes('FULL') || clean.includes('เต็ม')) {
      return { text: 'เต็มถัง (FULL)', icon: '🟢', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' };
    }
    if (clean.includes('ไม่มี') || clean.includes('ไม่พบ') || clean.includes('ชำรุด') || clean.includes('หาย')) {
      return { text: val, icon: '🔴', bg: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' };
    }
    return { text: `${val}`, icon: '🔵', bg: 'bg-teal-50 text-teal-900 border-teal-200 font-mono font-bold' };
  };

  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isTestingLine, setIsTestingLine] = useState(false);
  const [lineTestToast, setLineTestToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleQuickLineTest = async () => {
    if (!latestRecord) return;
    setIsTestingLine(true);
    setLineTestToast(null);
    try {
      const res = await sendLineAndWebhookNotifications(latestRecord, settings);
      if (res.success || res.lineStatus === 'delivered') {
        setLineTestToast({
          text: `ส่งการ์ดตรวจเช็คเข้า LINE กลุ่มเรียบร้อยแล้ว! (Message ID: ${res.sentMessageId || 'DELIVERED'})`,
          type: 'success',
        });
      } else {
        setLineTestToast({
          text: `แจ้งเตือน LINE: ${res.lineStatus} (${res.error || 'โปรดตรวจสอบการเชื่อมต่อ'})`,
          type: 'error',
        });
      }
      setTimeout(() => setLineTestToast(null), 6000);
    } catch (err: any) {
      setLineTestToast({
        text: `ส่ง LINE ไม่สำเร็จ: ${err.message}`,
        type: 'error',
      });
      setTimeout(() => setLineTestToast(null), 6000);
    } finally {
      setIsTestingLine(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-slate-800">
      {/* QUICK ACTIONS & EXPLAINER TOOLBAR */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-800/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
              <span>ศูนย์รวมสต็อกออกซิเจน BME: แบบไหนเหลือเท่าไหร่?</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 font-mono border border-teal-400/30">
                Live Status
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              แยกตาม 3 หมวด: ถังดิจิตอลรุ่นใหม่ (LCD), ถังหัวเกย์รุ่นเก่า (เข็ม), และแรงดันท่อส่งก๊าซ 7 จุดตรวจ
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-teal-500/20 transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>วิธีดูว่าแบบไหนเหลือเท่าไหร่</span>
          </button>

          <button
            type="button"
            disabled={isTestingLine || !latestRecord}
            onClick={handleQuickLineTest}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isTestingLine
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>{isTestingLine ? 'กำลังส่งแจ้งเตือน...' : '📲 ทดสอบส่ง LINE กลุ่ม'}</span>
          </button>
        </div>
      </div>

      {/* LINE TEST FEEDBACK TOAST */}
      {lineTestToast && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-in fade-in zoom-in-95 duration-200 ${
            lineTestToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-lg">{lineTestToast.type === 'success' ? '✅' : '❌'}</span>
            <span>{lineTestToast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setLineTestToast(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-3 text-xs"
          >
            ✕ ปิด
          </button>
        </div>
      )}

      {/* DATA RESCUE BANNER IF RECORDS ARE EMPTY */}
      {records.length === 0 && (
        <div className="p-4 bg-amber-500 text-white rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
            <div>
              <p className="font-bold text-sm">ไม่พบข้อมูลประวัติในระบบ</p>
              <p className="text-xs text-amber-100">คลิกปุ่มเพื่อโหลดข้อมูลประวัติการตรวจเช็คเดิมทั้งหมด 274 รายการกลับคืนมา</p>
            </div>
          </div>
          {onResetData && (
            <button
              onClick={onResetData}
              className="px-4 py-2 bg-white text-amber-900 rounded-xl text-xs font-black hover:bg-amber-50 transition-all shadow-xs flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>โหลดข้อมูล 274 รายการ</span>
            </button>
          )}
        </div>
      )}

      {/* 1. TOP OVERVIEW HERO BANNER */}
      {latestRecord && isLatestCritical ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white shadow-lg p-5 sm:p-6 border border-rose-400/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="p-3 bg-white/20 rounded-2xl shrink-0 backdrop-blur-md shadow-inner animate-pulse text-2xl">
                🚨
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base sm:text-lg text-white">
                    ถังออกซิเจนเหลือน้อยถึงเกณฑ์สั่งซื้อด่วน!
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-white text-rose-700 rounded-full shadow-xs">
                    วิกฤต
                  </span>
                </div>
                <p className="text-rose-100 text-xs sm:text-sm leading-relaxed">
                  📟 ถังดิจิตอล: <strong>{latestRecord?.readyDigitalTanks} ถัง</strong> (เกณฑ์: {settings.digitalLowThreshold}) • 📦 รวมพร้อมใช้: <strong>{latestRecord?.totalReadyTanks} ถัง</strong> (เกณฑ์: {settings.totalLowThreshold})
                </p>
                <div className="text-[11px] text-white/90 flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
                  <span>📅 ตรวจล่าสุด: {latestRecord?.date} ({latestRecord?.timestamp.split(',')[1]?.trim()})</span>
                  <span>•</span>
                  <span>👤 ผู้ตรวจ: {latestRecord?.inspector}</span>
                  <span>•</span>
                  <span className="bg-rose-900/40 px-2 py-0.5 rounded-md">💬 ส่ง LINE Alert แล้ว</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
              <button
                onClick={onNavigateToRecords}
                className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <span>เปิดดูรายการตรวจเช็ค</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : latestRecord ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg p-5 sm:p-6 border border-teal-400/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="p-3 bg-white/20 rounded-2xl shrink-0 backdrop-blur-md shadow-inner text-2xl">
                ✅
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base sm:text-lg text-white">
                    สถานะปริมาณถังออกซิเจน: ปกติ & พร้อมใช้งาน
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-white/25 text-white rounded-full">
                    ปลอดภัย
                  </span>
                </div>
                <p className="text-teal-100 text-xs sm:text-sm leading-relaxed">
                  📟 ดิจิตอลพร้อมใช้ {latestRecord?.readyDigitalTanks ?? 0} ถัง • 🎛️ หัวเกย์ {latestRecord?.readyGaugeTanks ?? 0} ถัง • 📦 รวมพร้อมใช้ {latestRecord?.totalReadyTanks ?? 0} ถัง
                </p>
                <p className="text-[11px] text-teal-200 leading-normal">
                  🔧 ประเด็นปัญหาล่าสุด: {latestRecord?.issues || 'พร้อมใช้งาน'}
                </p>
              </div>
            </div>

            <div className="text-right self-start sm:self-center flex flex-col items-start sm:items-end gap-1">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
                📅 ตรวจล่าสุด: {latestRecord?.date} ({latestRecord?.inspector})
              </span>
              <span className="text-[11px] text-teal-100">
                ฐานข้อมูลรวม {records.length} วันตรวจเช็ค
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 2. THREE KEY OXYGEN STOCK CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Digital Ready Tanks */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-base shrink-0">
                📟
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block leading-snug">
                  ถังดิจิตอลรุ่นใหม่
                </span>
                <span className="text-[11px] text-slate-400 block leading-normal">Digital Tank (LCD)</span>
              </div>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                (latestRecord?.readyDigitalTanks ?? 0) < settings.digitalLowThreshold
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              {(latestRecord?.readyDigitalTanks ?? 0) < settings.digitalLowThreshold
                ? '⚠️ ต่ำกว่าเกณฑ์'
                : '✅ ปกติ'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-y-1.5 gap-x-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-2.5xl font-black text-slate-900 leading-tight">
                {latestRecord?.readyDigitalTanks ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-600">ถังพร้อมใช้</span>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 leading-normal">
              เกณฑ์สั่งซื้อ: <strong className="text-slate-800 font-bold">&lt; {settings.digitalLowThreshold} ถัง</strong>
            </div>
          </div>

          {/* Progress gauge bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (latestRecord?.readyDigitalTanks ?? 0) < settings.digitalLowThreshold
                  ? 'bg-rose-500'
                  : 'bg-teal-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(10, ((latestRecord?.readyDigitalTanks ?? 0) / 60) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Card 2: Gauge Ready Tanks */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-base shrink-0">
                🎛️
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block leading-snug">
                  ถังแบบหัวเกย์รุ่นเก่า
                </span>
                <span className="text-[11px] text-slate-400 block leading-normal">Standard Gauge (เข็ม)</span>
              </div>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                (latestRecord?.readyGaugeTanks ?? 0) < settings.gaugeLowThreshold
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {(latestRecord?.readyGaugeTanks ?? 0) < settings.gaugeLowThreshold
                ? '⚠️ สต็อกน้อย'
                : '✅ พร้อมใช้'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-y-1.5 gap-x-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-2.5xl font-black text-slate-900 leading-tight">
                {latestRecord?.readyGaugeTanks ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-600">ถังพร้อมใช้</span>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 leading-normal">
              สำรองใช้งาน: <strong className="text-slate-800 font-bold">&ge; {settings.gaugeLowThreshold} ถัง</strong>
            </div>
          </div>

          {/* Progress gauge bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(10, ((latestRecord?.readyGaugeTanks ?? 0) / 40) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Card 3: Combined Total Ready Tanks */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-base shrink-0">
                📦
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block leading-snug">
                  รวมออกซิเจนพร้อมใช้ทั้งหมด
                </span>
                <span className="text-[11px] text-slate-400 block leading-normal">Total Oxygen Available</span>
              </div>
            </div>
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0 ${
                (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                  ? 'bg-rose-100 text-rose-700 animate-pulse'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {(latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                ? '🚨 ต้องสั่งด่วน'
                : '🛡️ ปลอดภัย'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-y-1.5 gap-x-2">
            <div className="flex items-baseline space-x-1.5">
              <span
                className={`text-2xl sm:text-2.5xl font-black leading-tight ${
                  (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                    ? 'text-rose-600'
                    : 'text-teal-900'
                }`}
              >
                {latestRecord?.totalReadyTanks ?? 0}
              </span>
              <span className="text-xs font-medium text-slate-600">ถังรวมสุทธิ</span>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60 leading-normal">
              เกณฑ์รวม: <strong className="text-slate-800 font-bold">&lt; {settings.totalLowThreshold} ถัง</strong>
            </div>
          </div>

          {/* Progress total bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-teal-500 to-cyan-500'
              }`}
              style={{
                width: `${Math.min(100, Math.max(10, ((latestRecord?.totalReadyTanks ?? 0) / 80) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2.5 DETAILED INVENTORY BREAKDOWN BY TANK TYPE */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600 font-bold text-lg">
              🔍
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>สรุปเจาะลึก: แบบไหนเหลือเท่าไหร่ & สังเกตอย่างไร?</span>
              </h3>
              <p className="text-xs text-slate-500">
                แยกวิเคราะห์ระหว่างถังดิจิตอล, ถังหัวเกย์, และแรงดันท่อส่งก๊าซส่วนกลาง 7 จุด
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>อ่านคำแนะนำจำแนกถัง</span>
          </button>
        </div>

        {/* 4 Comparative Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Item 1: Digital */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-teal-900 flex items-center space-x-1.5 text-xs sm:text-sm">
                  <span>📟</span>
                  <span>ถังดิจิตอลรุ่นใหม่</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    (latestRecord?.readyDigitalTanks ?? 0) < settings.digitalLowThreshold
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {(latestRecord?.readyDigitalTanks ?? 0) < settings.digitalLowThreshold ? '🚨 สั่งซื้อ' : '✅ ปกติ'}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-black text-teal-900 leading-tight">
                  {latestRecord?.readyDigitalTanks ?? 0}
                </span>
                <span className="text-xs text-teal-700 font-medium">ถังพร้อมใช้</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed break-words">
                <strong>วิธีดู:</strong> มีหน้าจอ LCD ดิจิตอล แสดงตัวเลข Bar/PSI ชัดเจน
              </p>
            </div>
            <div className="pt-2 border-t border-teal-200/60 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-1 leading-normal">
              <span>เกณฑ์สั่งซื้อ:</span>
              <strong className="text-teal-900">&lt; {settings.digitalLowThreshold} ถัง</strong>
            </div>
          </div>

          {/* Item 2: Gauge */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-indigo-900 flex items-center space-x-1.5 text-xs sm:text-sm">
                  <span>🎛️</span>
                  <span>ถังหัวเกย์รุ่นเก่า</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    (latestRecord?.readyGaugeTanks ?? 0) < settings.gaugeLowThreshold
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {(latestRecord?.readyGaugeTanks ?? 0) < settings.gaugeLowThreshold ? '⚠️ สต็อกน้อย' : '✅ พร้อมใช้'}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-black text-indigo-900 leading-tight">
                  {latestRecord?.readyGaugeTanks ?? 0}
                </span>
                <span className="text-xs text-indigo-700 font-medium">ถังพร้อมใช้</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed break-words">
                <strong>วิธีดู:</strong> หน้าปัดเกจเข็มหมุนอนาล็อก (Needle Gauge)
              </p>
            </div>
            <div className="pt-2 border-t border-indigo-200/60 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-1 leading-normal">
              <span>เกณฑ์สำรอง:</span>
              <strong className="text-indigo-900">&ge; {settings.gaugeLowThreshold} ถัง</strong>
            </div>
          </div>

          {/* Item 3: Total */}
          <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200/80 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-cyan-900 flex items-center space-x-1.5 text-xs sm:text-sm">
                  <span>📦</span>
                  <span>รวมพร้อมใช้ทั้งหมด</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                      ? 'bg-rose-100 text-rose-700 font-black'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {(latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold ? '🚨 สั่งด่วน' : '🛡️ ปลอดภัย'}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-black text-cyan-900 leading-tight">
                  {latestRecord?.totalReadyTanks ?? 0}
                </span>
                <span className="text-xs text-cyan-700 font-medium">ถังรวมสุทธิ</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed break-words">
                <strong>สูตร:</strong> ดิจิตอล ({latestRecord?.readyDigitalTanks ?? 0}) + หัวเกย์ ({latestRecord?.readyGaugeTanks ?? 0})
              </p>
            </div>
            <div className="pt-2 border-t border-cyan-200/60 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-1 leading-normal">
              <span>เกณฑ์วิกฤต:</span>
              <strong className="text-rose-700 font-black">&lt; {settings.totalLowThreshold} ถัง</strong>
            </div>
          </div>

          {/* Item 4: Ward Pipeline Stations */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-2.5">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs sm:text-sm">
                  <span>🏥</span>
                  <span>ท่อส่งก๊าซ 7 จุดตรวจ</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                  ระบบไปป์ไลน์
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-normal break-words">
                ท่อก๊าซติดผนัง (ไม่ใช่ถังเคลื่อนย้าย)
              </p>
              <div className="mt-2 flex flex-wrap gap-1 text-[11px] leading-normal">
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">W4/9: <strong>{latestRecord?.ward4_9 || '-'}</strong></span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">ARI: <strong>{latestRecord?.ward4_8_ari || '-'}</strong></span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">PT: <strong>{latestRecord?.building4_7_pt || '-'}</strong></span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">W4/6: <strong>{latestRecord?.ward4_6 || '-'}</strong></span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">OPD: <strong>{latestRecord?.building4_3_opd || '-'}</strong></span>
                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">ICU: <strong>{latestRecord?.building4_2_icu || '-'}</strong></span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 leading-normal">
              ห้องเก็บ 4/1: <strong className="text-teal-900 font-bold">{latestRecord?.building4_1_storage || '-'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PERIOD FILTER BAR & STATS CONTROLLER */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Mode Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              filterMode === 'all'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold ring-1 ring-slate-200/50'
                : 'hover:text-slate-900'
            }`}
          >
            <span>🌐</span>
            <span>ภาพรวมทั้งหมด ({records.length})</span>
          </button>

          <button
            onClick={() => {
              setFilterMode('monthly');
              // If current month has 0, default to month 9 (September)
              if (!monthCounts[selectedMonth]) setSelectedMonth('9');
            }}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              filterMode === 'monthly'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold ring-1 ring-slate-200/50'
                : 'hover:text-slate-900'
            }`}
          >
            <span>🗓️</span>
            <span>รายเดือน</span>
          </button>

          <button
            onClick={() => setFilterMode('daily')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              filterMode === 'daily'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold ring-1 ring-slate-200/50'
                : 'hover:text-slate-900'
            }`}
          >
            <span>📅</span>
            <span>รายวัน</span>
          </button>

          <button
            onClick={() => setFilterMode('yearly')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              filterMode === 'yearly'
                ? 'bg-white text-teal-900 shadow-xs font-extrabold ring-1 ring-slate-200/50'
                : 'hover:text-slate-900'
            }`}
          >
            <span>📊</span>
            <span>รายปี</span>
          </button>
        </div>

        {/* Dynamic Period Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {filterMode === 'monthly' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-semibold">เดือน:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden shadow-2xs cursor-pointer"
              >
                {THAI_MONTHS.map((m) => {
                  const cnt = monthCounts[m.num] || 0;
                  return (
                    <option key={m.num} value={m.num}>
                      {m.name} {cnt > 0 ? `(${cnt} วัน)` : '(0)'}
                    </option>
                  );
                })}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="2026">2026 (2569)</option>
                <option value="2025">2025 (2568)</option>
              </select>
            </div>
          )}

          {filterMode === 'daily' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-semibold">เลือกวันที่:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden shadow-2xs cursor-pointer max-w-[200px]"
              >
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterMode === 'yearly' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-semibold">เลือกปี:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden cursor-pointer"
              >
                <option value="2026">ปี 2026 (2569) - 147 วันตรวจ</option>
                <option value="2025">ปี 2025 (2568) - 127 วันตรวจ</option>
              </select>
            </div>
          )}

          {/* Quick status filter pill */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด ({totalChecks})
            </button>
            <button
              onClick={() => setStatusFilter('critical')}
              className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition-all flex items-center space-x-1 ${
                statusFilter === 'critical'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>🚨 ต่ำกว่าเกณฑ์ ({criticalDays})</span>
            </button>
          </div>

          {/* Export buttons & Reset button */}
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all flex items-center space-x-1 shadow-2xs"
              title="ส่งออก Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={onExportPDF}
              className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all flex items-center space-x-1 shadow-2xs"
              title="ส่งออก PDF"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>PDF</span>
            </button>
            {onResetData && (
              <button
                onClick={onResetData}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all flex items-center space-x-1"
                title="รีเซ็ตและโหลดข้อมูลประวัติทั้งหมด 274 รายการ"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">โหลด 274 รายการ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. COMBINED OXYGEN TANK TREND CHART & CLEAR TANK BREAKDOWN */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">📈</span>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                กราฟแนวโน้มระดับออกซิเจนพร้อมใช้งาน (Oxygen Tank Trend - รวมในกราฟเดียว)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {filterMode === 'yearly'
                ? `แสดงค่าเฉลี่ยรายเดือนของปี ${selectedYear} (12 เดือน)`
                : filterMode === 'daily'
                ? `แสดงข้อมูลวันที่ ${selectedDate} เปรียบเทียบย้อนหลัง 7 วัน`
                : filterMode === 'monthly'
                ? `แสดงข้อมูลรายวันของเดือน ${THAI_MONTHS.find((m) => m.num === selectedMonth)?.name || ''} ${selectedYear} (${chartRecords.length} วัน)`
                : `แสดงแนวโน้ม 30 วันตรวจเช็คล่าสุดในระบบ (จากทั้งหมด ${records.length} รายการ)`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Chart View Type Switcher (Grouped vs Stacked) */}
            {filterMode !== 'yearly' && (
              <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                <button
                  onClick={() => setChartViewType('grouped')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                    chartViewType === 'grouped'
                      ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                  title="แสดงแท่งคู่แยกประเภท ดิจิตอล vs หัวเกย์ ชัดเจน"
                >
                  <span>📊 แท่งคู่แยกประเภท</span>
                </button>
                <button
                  onClick={() => setChartViewType('stacked')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                    chartViewType === 'stacked'
                      ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                  title="แสดงแท่งซ้อนรวมความจุทั้งหมด"
                >
                  <span>📶 แท่งซ้อนรวม</span>
                </button>
              </div>
            )}

            {/* Unified Chart Legend with Clear Symbols & Colors */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/70">
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-teal-500 inline-block shadow-2xs"></span>
                <span className="text-teal-950">📟 ดิจิตอลรุ่นใหม่</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-indigo-500 inline-block shadow-2xs"></span>
                <span className="text-indigo-950">🎛️ หัวเกย์รุ่นเก่า</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-800 inline-block"></span>
                <span className="text-slate-900 font-extrabold">📦 รวมทั้งหมด</span>
              </span>
              <span className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
                <span className="w-3.5 h-1 bg-rose-500 inline-block rounded-full"></span>
                <span className="text-rose-600 font-extrabold">🚨 เกณฑ์สั่งซื้อ ({settings.totalLowThreshold})</span>
              </span>
            </div>
          </div>
        </div>

        {/* PROMINENT DAILY BREAKDOWN INSPECTOR (ตอบโจทย์: แบบไหนเหลือเท่าไหร่ อย่างชัดเจน 100%) */}
        {(() => {
          const activeRecord =
            hoveredRecord ||
            pinnedRecord ||
            (chartRecords.length > 0 ? chartRecords[chartRecords.length - 1] : latestRecord);

          if (!activeRecord) return null;

          const isCrit = activeRecord.isLowStock;
          const digCrit = activeRecord.readyDigitalTanks < settings.digitalLowThreshold;
          const gaugeCrit = activeRecord.readyGaugeTanks < settings.gaugeLowThreshold;

          return (
            <div className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-teal-950 text-white shadow-md border border-slate-700/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xl">🔍</span>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-white flex items-center space-x-2">
                      <span>สรุปยอดถังออกซิเจนประจำวัน: <strong>{activeRecord.date}</strong></span>
                      {pinnedRecord?.id === activeRecord.id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black">
                          📌 ตรึงวันนี้อยู่
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      👤 ผู้ตรวจ: <strong>{activeRecord.inspector}</strong> • ⏰ เวลาตรวจ: {activeRecord.timestamp.split(',')[1]?.trim() || '-'} • 📍 คลัง 4/1: {activeRecord.building4_1_storage}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex items-center space-x-2">
                  <span className="text-[11px] text-teal-300 bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-500/30">
                    💡 เลื่อนเมาส์หรือคลิกที่แท่งกราฟด้านล่างเพื่อเลือกดูวันอื่น
                  </span>
                </div>
              </div>

              {/* 3 Explicit Breakdown Stat Boxes: ดิจิตอล vs หัวเกย์ vs รวม */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                {/* 1. DIGITAL BOX */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  digCrit
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                    : 'bg-teal-950/40 border-teal-500/40 text-teal-100'
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold flex items-center space-x-1.5 text-teal-300">
                      <span>📟</span>
                      <span>ถังดิจิตอลรุ่นใหม่</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                      digCrit ? 'bg-rose-500 text-white' : 'bg-teal-500/30 text-teal-200 border border-teal-400/30'
                    }`}>
                      {digCrit ? '🚨 ต่ำกว่าเกณฑ์' : '✅ พร้อมใช้งาน'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1">
                    <span className="text-2xl sm:text-2.5xl font-black text-white leading-tight">
                      {activeRecord.readyDigitalTanks}
                    </span>
                    <span className="text-xs text-slate-300 font-medium leading-normal">
                      ถังพร้อมใช้ (เกณฑ์ &ge; {settings.digitalLowThreshold})
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-teal-200/80 leading-normal">
                    สัดส่วน: {Math.round((activeRecord.readyDigitalTanks / Math.max(1, activeRecord.totalReadyTanks)) * 100)}% ของสต็อกรวม
                  </div>
                </div>

                {/* 2. GAUGE BOX */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  gaugeCrit
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                    : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-100'
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold flex items-center space-x-1.5 text-indigo-300">
                      <span>🎛️</span>
                      <span>ถังหัวเกย์รุ่นเก่า</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                      gaugeCrit ? 'bg-amber-500 text-slate-950' : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                    }`}>
                      {gaugeCrit ? '⚠️ สต็อกน้อย' : '✅ พร้อมใช้งาน'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1">
                    <span className="text-2xl sm:text-2.5xl font-black text-white leading-tight">
                      {activeRecord.readyGaugeTanks}
                    </span>
                    <span className="text-xs text-slate-300 font-medium leading-normal">
                      ถังพร้อมใช้ (สำรอง &ge; {settings.gaugeLowThreshold})
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-indigo-200/80 leading-normal">
                    สัดส่วน: {Math.round((activeRecord.readyGaugeTanks / Math.max(1, activeRecord.totalReadyTanks)) * 100)}% ของสต็อกรวม
                  </div>
                </div>

                {/* 3. TOTAL COMBINED BOX */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  isCrit
                    ? 'bg-rose-900/50 border-rose-500 text-rose-100 shadow-md shadow-rose-950/50'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold flex items-center space-x-1.5 text-white">
                      <span>📦</span>
                      <span>รวมออกซิเจนพร้อมใช้</span>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                      isCrit ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                    }`}>
                      {isCrit ? '🚨 ต่ำกว่าเกณฑ์' : '🛡️ สต็อกปลอดภัย'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1">
                    <span className={`text-2xl sm:text-2.5xl font-black leading-tight ${isCrit ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {activeRecord.totalReadyTanks}
                    </span>
                    <span className="text-xs text-slate-300 font-medium leading-normal">
                      ถังรวมทั้งหมด (เกณฑ์ &ge; {settings.totalLowThreshold})
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between leading-normal">
                    <span className="truncate max-w-[200px]">🔧 ปัญหา: {activeRecord.issues || 'พร้อมใช้ปกติ'}</span>
                    {pinnedRecord && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPinnedRecord(null);
                        }}
                        className="text-amber-300 hover:underline text-[10px] font-bold shrink-0 ml-1"
                      >
                        ยกเลิกตรึง
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* COMBINED CHART CANVAS */}
        <div className="pt-2">
          {filterMode === 'yearly' ? (
            /* YEARLY COMBINED VIEW (12 MONTHS BREAKDOWN) */
            <div className="space-y-4">
              <div className="h-72 w-full flex items-end gap-2.5 pt-6 pb-2 px-2 overflow-x-auto relative bg-slate-50/50 rounded-2xl border border-slate-100">
                {/* Horizontal Reorder Threshold Line */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400/80 pointer-events-none z-10 flex items-center justify-end pr-3"
                  style={{
                    bottom: `${Math.min(100, Math.max(12, (settings.totalLowThreshold / 70) * 100))}%`,
                  }}
                >
                  <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 shadow-xs">
                    🚨 เกณฑ์สั่งซื้อด่วน: {settings.totalLowThreshold} ถัง
                  </span>
                </div>

                {yearlyMonthlyData.map((m) => {
                  const maxBarPx = 180;
                  const digitalPx = Math.max(0, Math.round((m.avgDigital / 70) * maxBarPx));
                  const gaugePx = Math.max(0, Math.round((m.avgGauge / 70) * maxBarPx));
                  const isCrit = m.hasData && m.avgTot < settings.totalLowThreshold;

                  return (
                    <div
                      key={m.num}
                      onClick={() => {
                        setSelectedMonth(m.num);
                        setFilterMode('monthly');
                      }}
                      className="flex-1 min-w-[44px] max-w-[70px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-24 hidden group-hover:flex flex-col items-center z-30 pointer-events-none animate-in fade-in zoom-in-95">
                        <div className="bg-slate-900 text-white text-[11px] p-3 rounded-2xl shadow-xl whitespace-nowrap border border-slate-700">
                          <p className="font-extrabold text-teal-300">
                            🗓️ เดือน{m.month} {selectedYear} ({m.count} วัน)
                          </p>
                          <p className="mt-0.5 text-teal-200">📟 เฉลี่ยดิจิตอล: {m.avgDigital} ถัง</p>
                          <p className="text-indigo-200">🎛️ เฉลี่ยหัวเกย์: {m.avgGauge} ถัง</p>
                          <p className="font-bold border-t border-slate-700 mt-1 pt-0.5 text-white">
                            📦 รวมเฉลี่ย: {m.avgTot} ถัง {isCrit ? '⚠️ (ต่ำกว่าเกณฑ์)' : '✅'}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                      </div>

                      {/* Explicit Pixel Height Bar Track */}
                      <div className="w-full flex flex-col justify-end items-center group-hover:scale-105 transition-all">
                        {/* Total Count Pill above bar */}
                        {m.hasData && (
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md mb-1 shadow-2xs ${
                              isCrit ? 'bg-rose-100 text-rose-700 font-extrabold' : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {m.avgTot}
                          </span>
                        )}

                        {/* Gauge part (Top of stack) */}
                        <div
                          className="w-full bg-indigo-500 rounded-t-md shadow-2xs"
                          style={{ height: `${gaugePx}px` }}
                        />
                        {/* Digital part (Bottom of stack) */}
                        <div
                          className={`w-full rounded-b-md shadow-2xs ${
                            isCrit ? 'bg-rose-500 animate-pulse' : 'bg-teal-500'
                          }`}
                          style={{ height: `${digitalPx}px` }}
                        />
                      </div>

                      {/* Month Label */}
                      <span className="text-[10px] text-slate-600 group-hover:text-teal-900 font-bold mt-2 truncate w-full text-center">
                        {m.short}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <span>💡 คลิกที่แท่งเดือนใดก็ได้เพื่อเจาะลึกดูข้อมูลรายวันของเดือนนั้น</span>
                <span>แกนตั้ง: จำนวนถังออกซิเจนเฉลี่ย (0 - 70 ถัง)</span>
              </div>
            </div>
          ) : chartRecords.length === 0 ? (
            /* EMPTY STATE HELPER IF PERIOD HAS NO DATA */
            <div className="py-12 px-4 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300">
              <div className="text-3xl mb-2">🔍</div>
              <h4 className="font-bold text-slate-800 text-sm">
                ไม่พบข้อมูลการตรวจเช็คในเดือน{THAI_MONTHS.find((m) => m.num === selectedMonth)?.name} {selectedYear}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                เดือนนี้ยังไม่มีรายการตรวจเช็ค แนะนำเลือกเดือนที่มีบันทึก เช่น กันยายน (29 วัน), สิงหาคม (30 วัน) หรือคลิกดูภาพรวมทั้งหมด
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSelectedMonth('9');
                    setSelectedYear('2026');
                    setFilterMode('monthly');
                  }}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  🗓️ ดูกันยายน 2569 (29 วัน)
                </button>
                <button
                  onClick={() => {
                    setSelectedMonth('8');
                    setSelectedYear('2026');
                    setFilterMode('monthly');
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  🗓️ ดูสิงหาคม 2569 (30 วัน)
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  🌐 ดูภาพรวมทั้งหมด (274 รายการ)
                </button>
              </div>
            </div>
          ) : (
            /* DAILY / MONTHLY / ALL COMBINED VIEW WITH EXPLICIT PIXEL HEIGHTS */
            <div className="space-y-4">
              {/* Chart Track Container with explicit height h-72 and background gridlines */}
              <div className="h-72 w-full flex items-end gap-1.5 sm:gap-2 pt-8 pb-3 px-3 overflow-x-auto relative bg-slate-50/70 rounded-2xl border border-slate-200/80">
                {/* Y-Axis Guidelines: 60, 40, 20 */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-slate-300 pointer-events-none z-1 flex items-center justify-between px-3"
                  style={{ bottom: `${(60 / 70) * 190 + 36}px` }}
                >
                  <span className="text-[9px] font-bold text-slate-400 bg-white/80 px-1 rounded">60 ถัง</span>
                </div>

                {/* Reorder Threshold Line 40 tanks */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500 pointer-events-none z-10 flex items-center justify-between px-3 shadow-xs"
                  style={{ bottom: `${(settings.totalLowThreshold / 70) * 190 + 36}px` }}
                >
                  <span className="text-[9px] font-black text-rose-700 bg-rose-100/90 px-1.5 py-0.2 rounded border border-rose-300">
                    40 ถัง
                  </span>
                  <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 shadow-xs">
                    🚨 เกณฑ์สั่งซื้อด่วน: {settings.totalLowThreshold} ถัง
                  </span>
                </div>

                {/* Digital Low Threshold Line 20 tanks */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-teal-300/80 pointer-events-none z-1 flex items-center justify-between px-3"
                  style={{ bottom: `${(settings.digitalLowThreshold / 70) * 190 + 36}px` }}
                >
                  <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1 rounded border border-teal-200">
                    20 ถัง (เกณฑ์ดิจิตอล)
                  </span>
                </div>

                {chartRecords.map((r, i) => {
                  const maxTrackPx = 190;
                  const digitalPx = Math.max(6, Math.round((r.readyDigitalTanks / 70) * maxTrackPx));
                  const gaugePx = Math.max(6, Math.round((r.readyGaugeTanks / 70) * maxTrackPx));
                  const isCrit = r.isLowStock;
                  const isPinned = pinnedRecord?.id === r.id;
                  const isHovered = hoveredRecord?.id === r.id;
                  const isHighlighted = isPinned || isHovered;

                  return (
                    <div
                      key={r.id || i}
                      onMouseEnter={() => setHoveredRecord(r)}
                      onMouseLeave={() => setHoveredRecord(null)}
                      onClick={() => setPinnedRecord((prev) => (prev?.id === r.id ? null : r))}
                      className={`flex-1 min-w-[34px] max-w-[50px] flex flex-col items-center h-full justify-end group relative cursor-pointer select-none transition-all ${
                        isHighlighted ? 'scale-105 z-20' : ''
                      }`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-28 hidden group-hover:flex flex-col items-center z-40 pointer-events-none animate-in fade-in zoom-in-95">
                        <div className="bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-2xl whitespace-nowrap border border-slate-700">
                          <p className="font-extrabold text-teal-300">
                            📅 วันที่ {r.date} ({r.inspector})
                          </p>
                          <p className="mt-1 text-teal-200">📟 ถังดิจิตอล: <strong>{r.readyDigitalTanks} ถัง</strong></p>
                          <p className="text-indigo-200">🎛️ ถังหัวเกย์: <strong>{r.readyGaugeTanks} ถัง</strong></p>
                          <p className="font-bold border-t border-slate-700 mt-1 pt-0.5 text-white">
                            📦 รวมทั้งหมด: <strong>{r.totalReadyTanks} ถัง</strong> {isCrit ? '🚨 (ต่ำกว่าเกณฑ์)' : '✅'}
                          </p>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            คลิกเพื่อตรึงรายละเอียดด้านบน 📌
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                      </div>

                      {/* Total Count Badge on Top */}
                      <div className="mb-1 text-center w-full">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md inline-block shadow-2xs ${
                            isCrit
                              ? 'bg-rose-600 text-white animate-pulse font-extrabold'
                              : isHighlighted
                              ? 'bg-teal-700 text-white'
                              : 'bg-white text-slate-800 border border-slate-200'
                          }`}
                        >
                          {r.totalReadyTanks}
                        </span>
                      </div>

                      {/* BAR RENDERING: GROUPED (SIDE BY SIDE) VS STACKED */}
                      {chartViewType === 'grouped' ? (
                        /* MODE 1: GROUPED SIDE-BY-SIDE BARS (ดิจิตอล vs หัวเกย์ คู่กัน ชัดเจน 100%) */
                        <div className={`w-full flex items-end justify-center gap-1 p-0.5 rounded-md transition-all ${
                          isHighlighted ? 'bg-teal-100/60 ring-2 ring-teal-500' : ''
                        }`}>
                          {/* Left Bar: Digital Tank (Teal) */}
                          <div className="flex-1 flex flex-col justify-end items-center">
                            <span className="text-[9px] font-black text-teal-800 mb-0.5 leading-none">
                              {r.readyDigitalTanks}
                            </span>
                            <div
                              className="w-full bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-sm shadow-xs transition-all"
                              style={{ height: `${digitalPx}px` }}
                              title={`ดิจิตอล: ${r.readyDigitalTanks} ถัง`}
                            />
                          </div>

                          {/* Right Bar: Gauge Tank (Indigo) */}
                          <div className="flex-1 flex flex-col justify-end items-center">
                            <span className="text-[9px] font-black text-indigo-800 mb-0.5 leading-none">
                              {r.readyGaugeTanks}
                            </span>
                            <div
                              className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm shadow-xs transition-all"
                              style={{ height: `${gaugePx}px` }}
                              title={`หัวเกย์: ${r.readyGaugeTanks} ถัง`}
                            />
                          </div>
                        </div>
                      ) : (
                        /* MODE 2: STACKED BAR WITH SEGMENT VALUES */
                        <div className={`w-full max-w-[28px] flex flex-col justify-end items-center rounded-md transition-all ${
                          isHighlighted ? 'ring-2 ring-teal-500 ring-offset-1' : ''
                        }`}>
                          {/* Gauge Segment (Top) */}
                          <div
                            className="w-full bg-indigo-500 rounded-t-sm shadow-2xs flex items-center justify-center relative overflow-hidden"
                            style={{ height: `${gaugePx}px` }}
                          >
                            {gaugePx >= 18 && (
                              <span className="text-[9px] font-black text-white leading-none">
                                {r.readyGaugeTanks}
                              </span>
                            )}
                          </div>

                          {/* Digital Segment (Bottom) */}
                          <div
                            className={`w-full rounded-b-sm shadow-2xs flex items-center justify-center relative overflow-hidden ${
                              isCrit ? 'bg-rose-500' : 'bg-teal-500'
                            }`}
                            style={{ height: `${digitalPx}px` }}
                          >
                            {digitalPx >= 18 && (
                              <span className="text-[9px] font-black text-white leading-none">
                                {r.readyDigitalTanks}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Day of Month Label */}
                      <span className={`text-[11px] font-bold mt-1.5 truncate w-full text-center ${
                        isHighlighted ? 'text-teal-900 bg-teal-100 rounded px-1' : 'text-slate-500'
                      }`}>
                        {r.date.split('/')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Footer summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 font-medium gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span>📊 ข้อมูลที่แสดง: <strong>{chartRecords.length} วันตรวจเช็ค</strong></span>
                  <span>•</span>
                  <span>เฉลี่ย: <strong>{averageTotal} ถัง</strong> (📟 ดิจิตอล {averageDigital} / 🎛️ หัวเกย์ {averageGauge})</span>
                  <span>•</span>
                  <span>ต่ำสุด: <strong className="text-rose-600">{minTotal} ถัง</strong> / สูงสุด: <strong className="text-teal-700">{maxTotal} ถัง</strong></span>
                </div>
                <div className="text-slate-500 text-[11px] flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
                  <span>ซ้าย: ดิจิตอล</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block ml-1"></span>
                  <span>ขวา: หัวเกย์</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. HOSPITAL STATIONS STATUS MONITOR (7 WARDS) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">📍</span>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                สถานะแรงดันออกซิเจนประจำ 7 จุดตรวจ / วอร์ด
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ข้อมูลจากการตรวจเช็คล่าสุด วันที่ {latestRecord?.date} โดย {latestRecord?.inspector}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            7 จุดตรวจประจำการ
          </span>
        </div>

        {/* 7 Clean Station Cards with consistent emojis and colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Station 1: Ward 4/9 */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-900 text-sm">Ward 4/9</span>
                <span className="text-[10px] text-slate-400">ชั้น 9</span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5 leading-normal">วอร์ดผู้ป่วยใน</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] text-slate-500 font-medium">แรงดัน:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border leading-normal ${getStationBadge(latestRecord?.ward4_9).bg}`}>
                {getStationBadge(latestRecord?.ward4_9).icon} {getStationBadge(latestRecord?.ward4_9).text}
              </span>
            </div>
          </div>

          {/* Station 2: Ward 4/8 (ARI) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-900 text-sm">Ward 4/8 (ARI)</span>
                <span className="text-[10px] text-slate-400">ชั้น 8</span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5 leading-normal">แผนกระบบทางเดินหายใจ</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] text-slate-500 font-medium">แรงดัน:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border leading-normal ${getStationBadge(latestRecord?.ward4_8_ari).bg}`}>
                {getStationBadge(latestRecord?.ward4_8_ari).icon} {getStationBadge(latestRecord?.ward4_8_ari).text}
              </span>
            </div>
          </div>

          {/* Station 3: อาคาร 4/7 (PT) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-900 text-sm">อาคาร 4/7 (PT)</span>
                <span className="text-[10px] text-slate-400">ชั้น 7</span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5 leading-normal">กายภาพบำบัด</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] text-slate-500 font-medium">แรงดัน:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border leading-normal ${getStationBadge(latestRecord?.building4_7_pt).bg}`}>
                {getStationBadge(latestRecord?.building4_7_pt).icon} {getStationBadge(latestRecord?.building4_7_pt).text}
              </span>
            </div>
          </div>

          {/* Station 4: Ward 4/6 */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-900 text-sm">Ward 4/6</span>
                <span className="text-[10px] text-slate-400">ชั้น 6</span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5 leading-normal">วอร์ดผู้ป่วยใน</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] text-slate-500 font-medium">แรงดัน:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border leading-normal ${getStationBadge(latestRecord?.ward4_6).bg}`}>
                {getStationBadge(latestRecord?.ward4_6).icon} {getStationBadge(latestRecord?.ward4_6).text}
              </span>
            </div>
          </div>

          {/* Station 5: อาคาร 4/3 (OPD) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-900 text-sm">อาคาร 4/3 (OPD)</span>
                <span className="text-[10px] text-slate-400">ชั้น 3</span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5 leading-normal">ผู้ป่วยนอก</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] text-slate-500 font-medium">แรงดัน:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border leading-normal ${getStationBadge(latestRecord?.building4_3_opd).bg}`}>
                {getStationBadge(latestRecord?.building4_3_opd).icon} {getStationBadge(latestRecord?.building4_3_opd).text}
              </span>
            </div>
          </div>

          {/* Station 6: อาคาร 4/2 (ICU) */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-900 text-sm">อาคาร 4/2 (ICU)</span>
                <span className="text-[10px] text-slate-400">ชั้น 2</span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5 leading-normal">หอผู้ป่วยวิกฤต</span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-1">
              <span className="text-[11px] text-slate-500 font-medium">แรงดัน:</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border leading-normal ${getStationBadge(latestRecord?.building4_2_icu).bg}`}>
                {getStationBadge(latestRecord?.building4_2_icu).icon} {getStationBadge(latestRecord?.building4_2_icu).text}
              </span>
            </div>
          </div>

          {/* Station 7: อาคาร 4/1 (ห้องเก็บอ๊อกซิเจนส่วนกลาง BME) - Highlighted */}
          <div className="col-span-1 sm:col-span-2 p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 hover:border-teal-300 transition-all flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-extrabold text-teal-950 text-sm">
                  อาคาร 4/1 (ห้องเก็บอ๊อกซิเจนส่วนกลาง BME)
                </span>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                  คลังหลัก
                </span>
              </div>
              <span className="text-xs text-teal-700 block mt-0.5 leading-normal">
                ศูนย์กลางจ่ายและจัดเก็บถังออกซิเจนสำรอง
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-teal-200/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-teal-800 font-semibold">สถานะแรงดัน / การจัดเก็บ:</span>
              <span className="text-xs px-3 py-1 rounded-lg border font-mono font-bold bg-white text-teal-900 border-teal-300 shadow-2xs">
                {latestRecord?.building4_1_storage || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Latest Remark Callout */}
        <div className="mt-4 p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-amber-900">
            <span className="text-base">🔧</span>
            <span>
              <strong>ประเด็นปัญหาล่าสุด:</strong> {latestRecord?.issues || 'พร้อมใช้งานปกติทุกจุด'}
            </span>
          </div>
          <button
            onClick={onNavigateToRecords}
            className="text-amber-800 font-bold hover:underline shrink-0 text-xs ml-3"
          >
            ดูประวัติทั้งหมด &rarr;
          </button>
        </div>
      </div>

      {/* 6. RECENT INSPECTION LOGS & ACTION SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Checks List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">📋</span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  รายการตรวจเช็คล่าสุด (Recent Daily Logs)
                </h3>
              </div>
              <p className="text-xs text-slate-500">บันทึก 5 รายการล่าสุดในระบบ</p>
            </div>
            <button
              onClick={onNavigateToRecords}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
            >
              ดูทั้งหมด ({records.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {records.slice(-5).reverse().map((r, idx) => (
              <div
                key={r.id || idx}
                onClick={onNavigateToRecords}
                className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors cursor-pointer text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      r.isLowStock
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-teal-50 text-teal-700'
                    }`}
                  >
                    {r.date.split('/')[0]}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      📅 {r.date} ({r.timestamp.split(',')[1]?.trim()})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      👤 {r.inspector} • 🔧 {r.issues || 'พร้อมใช้'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-slate-900 block text-sm">
                    {r.totalReadyTanks} ถัง
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      r.isLowStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {r.isLowStock ? '🚨 ต่ำกว่าเกณฑ์' : '✅ ปกติ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Summary & Action Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-teal-400 mb-2">
              <span className="text-base">🏥</span>
              <span className="text-xs font-bold uppercase tracking-wider">ภาพรวมระบบ BME</span>
            </div>
            <h4 className="font-black text-lg text-white">ระบบติดตามถังออกซิเจนประจำวัน</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ติดตามปริมาณถังดิจิตอล หัวเกย์ และแรงดันวอร์ดอย่างสม่ำเสมอ เพื่อความปลอดภัยของผู้ป่วยในโรงพยาบาล
            </p>

            <div className="mt-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">🚨 เกณฑ์สั่งซื้อฉุกเฉิน:</span>
                <span className="font-bold text-rose-400">&lt; {settings.totalLowThreshold} ถัง</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">💬 แจ้งเตือนอัตโนมัติ:</span>
                <span className="font-bold text-emerald-400">LINE Flex Card ทุกวัน</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-slate-400">📧 รายงานสรุปสิ้นเดือน:</span>
                <span className="font-bold text-teal-300">ทุกสิ้นเดือน 16:30 น.</span>
              </div>
            </div>
          </div>

          {canRecord && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                onClick={onOpenNewCheck}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 transform active:scale-95"
              >
                <Activity className="w-4 h-4" />
                <span>บันทึกตรวจเช็ควันนี้</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: GUIDE ON TANK TYPES & INVENTORY BREAKDOWN */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shrink-0">
                  💡
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    คู่มือจำแนกประเภทถัง: จะรู้ได้อย่างไรว่าแบบไหนเหลือเท่าไหร่?
                  </h3>
                  <p className="text-xs text-teal-200 mt-0.5">
                    ทำความเข้าใจความแตกต่างของถังแต่ละแบบ เกณฑ์สั่งซื้อ และจุดตรวจประจำวอร์ด
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-slate-700 text-xs sm:text-sm">
              {/* Question & Quick Answer */}
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                <h4 className="font-extrabold text-teal-950 text-sm flex items-center space-x-2">
                  <span>❓ คำถาม: "งงมาก จะรู้ได้อย่างไรว่าแบบไหนเหลือเท่าไหร่?"</span>
                </h4>
                <p className="text-teal-900 mt-1.5 leading-relaxed text-xs">
                  ระบบ BME แบ่งออกซิเจนออกเป็น <strong>3 หมวดหลัก</strong> เพื่อให้ตรวจนับและสั่งซื้อได้ตรงเป้าหมาย:
                </p>
              </div>

              {/* 3 Categories Breakdown */}
              <div className="space-y-4">
                {/* 1. Digital */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 flex items-center space-x-2 text-sm">
                      <span className="text-xl">📟</span>
                      <span>1. ถังดิจิตอลรุ่นใหม่ (Digital Oxygen Tank)</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-bold text-xs">
                      คงเหลือ: {latestRecord?.readyDigitalTanks ?? 0} ถัง
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs ml-1">
                    <li><strong>วิธีสังเกตหัวถัง:</strong> มีหน้าปัดดิจิตอล LCD ตัวเลขสีฟ้าหรือดำ แสดงแรงดันชัดเจน อ่านค่าง่ายแม่นยำ</li>
                    <li><strong>การใช้งาน:</strong> เหมาะสำหรับรถเข็นส่งต่อผู้ป่วยฉุกเฉิน, รถพยาบาล, หรือย้ายผู้ป่วยข้ามตึก</li>
                    <li><strong>เกณฑ์ความปลอดภัย:</strong> ต้องมีสำรองอย่างน้อย <strong>{settings.digitalLowThreshold} ถังขึ้นไป</strong> หากเหลือน้อยกว่านี้ ระบบจะแจ้งเตือนวิกฤตสั่งซื้อด่วนทันที</li>
                  </ul>
                </div>

                {/* 2. Gauge */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 flex items-center space-x-2 text-sm">
                      <span className="text-xl">🎛️</span>
                      <span>2. ถังหัวเกย์รุ่นเก่า (Standard Gauge Tank)</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">
                      คงเหลือ: {latestRecord?.readyGaugeTanks ?? 0} ถัง
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs ml-1">
                    <li><strong>วิธีสังเกตหัวถัง:</strong> มีหน้าปัดกลไกเข็มหมุนแบบอนาล็อก (Needle Dial Gauge) ต้องดูตำแหน่งเข็มชี้</li>
                    <li><strong>การใช้งาน:</strong> สำรองใช้งานประจำเตียงผู้ป่วยในหอผู้ป่วยทั่วไป (Ward) และเป็นสต็อกสำรองในห้องเก็บ</li>
                    <li><strong>เกณฑ์สำรอง:</strong> ควรมีคงเหลืออย่างน้อย <strong>{settings.gaugeLowThreshold} ถังขึ้นไป</strong></li>
                  </ul>
                </div>

                {/* 3. Total */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 flex items-center space-x-2 text-sm">
                      <span className="text-xl">📦</span>
                      <span>3. รวมพร้อมใช้ทั้งหมด (Total Available)</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 font-black text-xs">
                      รวม: {latestRecord?.totalReadyTanks ?? 0} ถัง
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs ml-1">
                    <li><strong>สูตรคำนวณ:</strong> ถังดิจิตอล ({latestRecord?.readyDigitalTanks ?? 0}) + ถังหัวเกย์ ({latestRecord?.readyGaugeTanks ?? 0}) = <strong>{latestRecord?.totalReadyTanks ?? 0} ถัง</strong></li>
                    <li><strong>เกณฑ์วิกฤตสั่งซื้อฉุกเฉิน:</strong> หากยอดรวมต่ำกว่า <strong>{settings.totalLowThreshold} ถัง</strong> เจ้าหน้าที่ต้องทำเรื่องสั่งซื้อก๊าซเข้าเติมสต็อกทันที</li>
                  </ul>
                </div>

                {/* 4. Pipeline Stations */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🏥</span>
                    <span className="font-black text-amber-950 text-sm">
                      4. แล้วจุดตรวจ Ward 4/9, 4/8, 4/7, 4/6, OPD, ICU, 4/1 คืออะไร?
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    จุดเหล่านี้ <strong>ไม่ใช่ถังออกซิเจนเคลื่อนย้าย</strong> แต่เป็น <strong>บอร์ดเกจวัดแรงดันท่อส่งจ่ายก๊าซส่วนกลางติดผนัง</strong> ในแต่ละตึกและชั้น:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-amber-900 text-xs ml-1">
                    <li>ถ้าขึ้นว่า <strong>FULL</strong> = แรงดันในท่อจ่ายเต็ม 100% ปลอดภัย</li>
                    <li>ถ้าขึ้นเป็น <strong>ตัวเลข (เช่น 450, 500, 550)</strong> = ค่าแรงดันปกติของสถานีนั้นๆ (หน่วย kPa หรือ PSI)</li>
                  </ul>
                </div>
              </div>

              {/* Where to view */}
              <div className="p-4 bg-slate-100 rounded-2xl space-y-2">
                <h5 className="font-bold text-slate-900 text-xs">📱 วิธีเช็คสต็อกได้ทุกวันแบบง่ายๆ:</h5>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                  <li><strong>ดูการ์ด 3 ช่องด้านบน:</strong> แสดงตัวเลขดิจิตอล หัวเกย์ และรวมสุทธิแบบชัดเจน</li>
                  <li><strong>ดูจากข้อความใน LINE กลุ่ม:</strong> ทุกครั้งที่ตรวจเช็คเสร็จ ระบบจะส่งการ์ดแจ้งเตือนแยกยอดถังดิจิตอล/หัวเกย์ให้ทุกคนในกลุ่มทันที</li>
                  <li><strong>ดูจากแท็บ "บันทึกการตรวจเช็ค":</strong> มีตารางประวัติเรียงวันล่าสุดก่อน และมีคอลัมน์แยกทั้งดิจิตอลและหัวเกย์ครบถ้วน</li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                เข้าใจแล้ว ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
