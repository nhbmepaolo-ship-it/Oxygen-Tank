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
  Flame,
} from 'lucide-react';

interface DashboardViewProps {
  records: InspectionRecord[];
  settings: SystemSettings;
  onOpenNewCheck: () => void;
  onNavigateToRecords: () => void;
  canRecord: boolean;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  settings,
  onOpenNewCheck,
  onNavigateToRecords,
  canRecord,
  onExportExcel,
  onExportPDF,
}) => {
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('monthly');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('10'); // October
  const [selectedDate, setSelectedDate] = useState<string>('1/10/2026');

  // Month names in Thai
  const THAI_MONTHS = [
    { num: '1', name: 'มกราคม (Jan)' },
    { num: '2', name: 'กุมภาพันธ์ (Feb)' },
    { num: '3', name: 'มีนาคม (Mar)' },
    { num: '4', name: 'เมษายน (Apr)' },
    { num: '5', name: 'พฤษภาคม (May)' },
    { num: '6', name: 'มิถุนายน (Jun)' },
    { num: '7', name: 'กรกฎาคม (Jul)' },
    { num: '8', name: 'สิงหาคม (Aug)' },
    { num: '9', name: 'กันยายน (Sep)' },
    { num: '10', name: 'ตุลาคม (Oct)' },
    { num: '11', name: 'พฤศจิกายน (Nov)' },
    { num: '12', name: 'ธันวาคม (Dec)' },
  ];

  // Latest check overall
  const latestRecord = records[records.length - 1] || null;

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Split date e.g. "1/10/2026" or "16/4/2025" or "10/5/2568"
      const parts = r.date.split('/');
      if (parts.length < 3) return true;
      const day = parts[0];
      const month = parts[1];
      let year = parts[2];
      // Normalize Buddhist year 2568 -> 2025, 0068 -> 2025
      if (year === '2568' || year === '0068') year = '2025';
      if (year === '2569') year = '2026';

      if (filterMode === 'daily') {
        return r.date === selectedDate || `${day}/${month}/${year}` === selectedDate;
      }
      if (filterMode === 'monthly') {
        const matchesYear = !selectedYear || year.endsWith(selectedYear.slice(-2)) || year === selectedYear;
        const matchesMonth = month === selectedMonth;
        return matchesYear && matchesMonth;
      }
      if (filterMode === 'yearly') {
        return !selectedYear || year.endsWith(selectedYear.slice(-2)) || year === selectedYear;
      }
      return true;
    });
  }, [records, filterMode, selectedYear, selectedMonth, selectedDate]);

  // Key metric calculations
  const totalChecks = filteredRecords.length;
  const criticalDays = filteredRecords.filter((r) => r.isLowStock).length;
  const issueReports = filteredRecords.filter(
    (r) => r.issues && r.issues !== 'พร้อมใช้งาน' && r.issues !== 'พร้อมใช้' && r.issues !== '-' && r.issues !== '*'
  ).length;

  const averageTotal =
    totalChecks > 0
      ? Math.round(filteredRecords.reduce((sum, r) => sum + r.totalReadyTanks, 0) / totalChecks)
      : 0;
  const minTotal =
    totalChecks > 0 ? Math.min(...filteredRecords.map((r) => r.totalReadyTanks)) : 0;
  const maxTotal =
    totalChecks > 0 ? Math.max(...filteredRecords.map((r) => r.totalReadyTanks)) : 0;

  // Chart data: sample up to last 20 records in chronological order
  const chartRecords = useMemo(() => {
    const subset = [...filteredRecords];
    return subset.slice(-25);
  }, [filteredRecords]);

  // Is current latest check in critical low stock?
  const isLatestCritical = latestRecord?.isLowStock ?? false;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Alert if Stock is Below Threshold */}
      {isLatestCritical ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-400">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-3 bg-white/20 rounded-xl shrink-0 backdrop-blur-xs">
              <AlertTriangle className="w-7 h-7 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight">
                  🚨 แจ้งเตือนด่วน: ถังออกซิเจนเหลือน้อยถึงเกณฑ์ต้องสั่งซื้อ!
                </span>
                <span className="px-2 py-0.5 text-xs font-bold bg-white text-rose-700 rounded-full">
                  วิกฤต
                </span>
              </div>
              <p className="text-rose-100 text-xs sm:text-sm mt-0.5">
                ถังดิจิตอลพร้อมใช้คงเหลือเพียง <strong className="text-white underline">{latestRecord?.readyDigitalTanks} ถัง</strong> (เกณฑ์ขั้นต่ำ: {settings.digitalLowThreshold} ถัง) | รวมพร้อมใช้ <strong className="text-white underline">{latestRecord?.totalReadyTanks} ถัง</strong> (เกณฑ์รวม: {settings.totalLowThreshold} ถัง)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onNavigateToRecords}
              className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              ดูรายละเอียด & สั่งถัง
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-emerald-800">
                สถานะปริมาณถังออกซิเจนล่าสุดอยู่ในเกณฑ์ปลอดภัย:
              </span>{' '}
              ดิจิตอล {latestRecord?.readyDigitalTanks ?? 0} ถัง | หัวเกย์ {latestRecord?.readyGaugeTanks ?? 0} ถัง | รวมพร้อมใช้ {latestRecord?.totalReadyTanks ?? 0} ถัง
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full hidden sm:inline">
            ตรวจล่าสุด: {latestRecord?.date}
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 self-start">
          <button
            onClick={() => setFilterMode('daily')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'daily' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            รายวัน
          </button>
          <button
            onClick={() => setFilterMode('monthly')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'monthly' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setFilterMode('yearly')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'yearly' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            รายปี
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterMode === 'all' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            ทั้งหมด
          </button>
        </div>

        {/* Dynamic Controls based on Filter Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {filterMode === 'daily' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">เลือกวันที่:</span>
              <input
                type="text"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="วว/ดด/ปปปป เช่น 1/10/2026"
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
              />
            </div>
          )}

          {filterMode === 'monthly' && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white text-slate-700 font-medium"
              >
                {THAI_MONTHS.map((m) => (
                  <option key={m.num} value={m.num}>
                    เดือน: {m.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white text-slate-700 font-medium"
              >
                <option value="2026">ปี 2026 (2569)</option>
                <option value="2025">ปี 2025 (2568)</option>
              </select>
            </div>
          )}

          {filterMode === 'yearly' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">เลือกปี:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white text-slate-700 font-medium"
              >
                <option value="2026">ปี 2026 (2569)</option>
                <option value="2025">ปี 2025 (2568)</option>
              </select>
            </div>
          )}

          {/* Quick Export from current view */}
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
            <button
              onClick={onExportExcel}
              className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center space-x-1"
              title="ส่งออก Excel ตามตัวกรองปัจจุบัน"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={onExportPDF}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center space-x-1"
              title="ส่งออก PDF รายงานตรวจเช็ค"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Digital Tanks Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ถังดิจิตอลรุ่นใหม่ (ล่าสุด)
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {latestRecord?.readyDigitalTanks ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">ถังพร้อมใช้</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">เกณฑ์สั่งซื้อ: &lt; {settings.digitalLowThreshold} ถัง</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                (latestRecord?.readyDigitalTanks ?? 0) < settings.digitalLowThreshold
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {(latestRecord?.readyDigitalTanks ?? 0) < settings.digitalLowThreshold ? 'สั่งด่วน' : 'ปกติ'}
            </span>
          </div>
        </div>

        {/* Gauge Tanks Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ถังหัวเกย์รุ่นเก่า (ล่าสุด)
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {latestRecord?.readyGaugeTanks ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">ถังพร้อมใช้</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">เกณฑ์สั่งซื้อ: &lt; {settings.gaugeLowThreshold} ถัง</span>
            <span className="font-semibold text-slate-600 text-[10px]">สำรองเสริม</span>
          </div>
        </div>

        {/* Total Ready Tanks Card */}
        <div
          className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
            (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              รวมถังพร้อมใช้ทั้งหมด
            </span>
            <div
              className={`p-2 rounded-xl ${
                (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                  ? 'bg-rose-200 text-rose-700'
                  : 'bg-cyan-50 text-cyan-600'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                  ? 'text-rose-700'
                  : 'text-slate-900'
              }`}
            >
              {latestRecord?.totalReadyTanks ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">ถังใน รพ.</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">เกณฑ์สั่งซื้อรวม: &lt; {settings.totalLowThreshold} ถัง</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                (latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold
                  ? 'bg-rose-200 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {(latestRecord?.totalReadyTanks ?? 0) < settings.totalLowThreshold ? '🚨 ต่ำกว่าเกณฑ์' : 'ปลอดภัย'}
            </span>
          </div>
        </div>

        {/* Period Summary Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              สถิติช่วงที่เลือก ({totalChecks} ครั้ง)
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">เฉลี่ยต่อวัน:</span>
              <span className="font-bold text-slate-800">{averageTotal} ถัง</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">ต่ำสุด - สูงสุด:</span>
              <span className="font-semibold text-slate-700">
                {minTotal} - {maxTotal} ถัง
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">วันที่ต่ำกว่าเกณฑ์:</span>
              <span className={`font-bold ${criticalDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {criticalDays} วัน
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Trend Chart Visual */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Activity className="w-5 h-5 text-teal-600" />
              <span>แนวโน้มจำนวนถังออกซิเจนพร้อมใช้งาน (Oxygen Tank Stock Trend)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบถังดิจิตอลรุ่นใหม่ ถังหัวเกย์ และเส้นเกณฑ์สั่งซื้อด่วน ({settings.totalLowThreshold} ถัง)
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-teal-500 inline-block"></span>
              <span className="text-slate-600 font-medium">ดิจิตอลรุ่นใหม่</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
              <span className="text-slate-600 font-medium">หัวเกย์</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
              <span className="text-rose-600 font-bold">เกณฑ์สั่งซื้อ</span>
            </span>
          </div>
        </div>

        {/* Chart Bars */}
        <div className="pt-6">
          {chartRecords.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              ไม่มีข้อมูลในช่วงเวลาที่เลือก
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scaled Visual Bar Representation */}
              <div className="h-56 w-full flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-2 overflow-x-auto relative">
                {/* Horizontal Reorder Threshold Line */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-rose-400 pointer-events-none z-10 flex items-center justify-end pr-2"
                  style={{
                    bottom: `${Math.min(100, Math.max(10, (settings.totalLowThreshold / 70) * 100))}%`,
                  }}
                >
                  <span className="text-[10px] font-bold text-rose-600 bg-white/90 px-1 py-0.2 rounded border border-rose-300">
                    เกณฑ์สั่ง: {settings.totalLowThreshold}
                  </span>
                </div>

                {chartRecords.map((r, i) => {
                  const digitalH = Math.min(100, (r.readyDigitalTanks / 70) * 100);
                  const gaugeH = Math.min(100, (r.readyGaugeTanks / 70) * 100);
                  const isCrit = r.isLowStock;

                  return (
                    <div
                      key={r.id || i}
                      className="flex-1 min-w-[20px] max-w-[36px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-16 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-xl whitespace-nowrap">
                          <p className="font-bold text-teal-300">
                            {r.date} ({r.inspector})
                          </p>
                          <p>ดิจิตอล: {r.readyDigitalTanks} ถัง</p>
                          <p>หัวเกย์: {r.readyGaugeTanks} ถัง</p>
                          <p className="font-bold border-t border-slate-700 mt-1 pt-0.5">
                            รวม: {r.totalReadyTanks} ถัง{' '}
                            {isCrit ? '⚠️ (ต่ำกว่าเกณฑ์)' : '✅'}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                      </div>

                      {/* Stacked Bar */}
                      <div className="w-full flex flex-col justify-end items-center space-y-0.5">
                        {/* Gauge part */}
                        <div
                          className="w-full bg-indigo-400 rounded-t-xs transition-all group-hover:brightness-110"
                          style={{ height: `${gaugeH}%` }}
                        />
                        {/* Digital part */}
                        <div
                          className={`w-full rounded-b-xs transition-all group-hover:brightness-110 ${
                            isCrit ? 'bg-rose-500' : 'bg-teal-500'
                          }`}
                          style={{ height: `${digitalH}%` }}
                        />
                      </div>

                      {/* Date label */}
                      <span className="text-[9px] text-slate-400 truncate w-full text-center mt-2 group-hover:text-slate-800 font-medium">
                        {r.date.split('/')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-2 pt-2 border-t border-slate-100">
                <span>แสดงข้อมูลย้อนหลัง {chartRecords.length} วันล่าสุด</span>
                <span>แกนตั้ง: จำนวนถังออกซิเจน (0 - 70 ถัง)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ward Status Grid & Issues Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Ward Readings Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                สถานะแรงดันจุดตรวจประจำจุด (Latest Station Readings)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                จากการตรวจเช็คล่าสุด วันที่ {latestRecord?.date} โดย {latestRecord?.inspector}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700">
              7 จุดตรวจ
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-500 block">Ward 4/9</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {latestRecord?.ward4_9 || '-'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">จุดประจำการ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-500 block">Ward 4/8 (ARI)</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {latestRecord?.ward4_8_ari || '-'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">จุดประจำการ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-500 block">อาคาร 4/7 (PT)</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {latestRecord?.building4_7_pt || '-'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">จุดประจำการ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-500 block">Ward 4/6</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {latestRecord?.ward4_6 || '-'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">จุดประจำการ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-500 block">อาคาร 4/3 (OPD)</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {latestRecord?.building4_3_opd || '-'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">จุดประจำการ</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
              <span className="text-[11px] font-semibold text-slate-500 block">อาคาร 4/2 (ICU)</span>
              <span className="text-base font-bold text-slate-900 block mt-1">
                {latestRecord?.building4_2_icu || '-'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">จุดประจำการ</span>
            </div>
            <div className="col-span-2 p-3 rounded-xl bg-teal-50/70 border border-teal-200">
              <span className="text-[11px] font-semibold text-teal-700 block">
                อาคาร 4/1 (ห้องเก็บอ๊อกซิเจนส่วนกลาง)
              </span>
              <span className="text-base font-bold text-teal-950 block mt-1">
                {latestRecord?.building4_1_storage || '-'}
              </span>
              <span className="text-[10px] text-teal-600 font-medium">ห้องจัดเก็บหลัก</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900">
              <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>ปัญหาล่าสุดที่บันทึก:</strong> {latestRecord?.issues || 'พร้อมใช้งานปกติ'}
              </span>
            </div>
            <button
              onClick={onNavigateToRecords}
              className="text-amber-800 font-bold hover:underline shrink-0 text-xs ml-2"
            >
              ดูย้อนหลัง &rarr;
            </button>
          </div>
        </div>

        {/* Quick Actions & Recent Issue Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-slate-600" />
              <span>ประเด็นปัญหาที่พบล่าสุด</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              รายการชำรุด/ขาด/ต้องแก้ไข เพื่อประสานงานซ่อมบำรุง
            </p>

            <div className="mt-4 space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {records
                .filter(
                  (r) =>
                    r.issues &&
                    r.issues !== 'พร้อมใช้งาน' &&
                    r.issues !== 'พร้อมใช้' &&
                    r.issues !== '-' &&
                    r.issues !== '*'
                )
                .slice(-5)
                .reverse()
                .map((r, idx) => (
                  <div
                    key={r.id || idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{r.date}</span>
                      <span className="font-medium text-slate-600">{r.inspector}</span>
                    </div>
                    <p className="font-semibold text-amber-900 mt-1">{r.issues}</p>
                  </div>
                ))}
            </div>
          </div>

          {canRecord && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={onOpenNewCheck}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs flex items-center justify-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>บันทึกตรวจเช็คประจำวัน</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
