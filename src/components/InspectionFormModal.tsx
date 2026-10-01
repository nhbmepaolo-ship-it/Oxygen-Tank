import React, { useState, useEffect } from 'react';
import { InspectionRecord, Employee, CurrentUser, SystemSettings } from '../types';
import {
  X,
  Activity,
  Send,
  AlertTriangle,
  CheckCircle2,
  Bell,
  FileSpreadsheet,
  Gauge,
  Box,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { sendLineAndWebhookNotifications } from '../utils/lineService';

interface InspectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  employees: Employee[];
  settings: SystemSettings;
  onSaveRecord: (record: InspectionRecord) => void;
  editingRecord?: InspectionRecord | null;
}

export const InspectionFormModal: React.FC<InspectionFormModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  employees,
  settings,
  onSaveRecord,
  editingRecord,
}) => {
  const activeEmployees = employees.filter((e) => e.status === 'active');

  const [inspector, setInspector] = useState(currentUser.name || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [ward4_9, setWard4_9] = useState('FULL');
  const [ward4_8_ari, setWard4_8_ari] = useState('FULL');
  const [building4_7_pt, setBuilding4_7_pt] = useState('550');
  const [ward4_6, setWard4_6] = useState('FULL');
  const [building4_3_opd, setBuilding4_3_opd] = useState('450');
  const [building4_2_icu, setBuilding4_2_icu] = useState('FULL');
  const [building4_1_storage, setBuilding4_1_storage] = useState('500');

  const [readyDigitalTanks, setReadyDigitalTanks] = useState<number>(30);
  const [readyGaugeTanks, setReadyGaugeTanks] = useState<number>(25);
  const [issues, setIssues] = useState('พร้อมใช้งาน');

  const [sendLine, setSendLine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (editingRecord) {
      setInspector(editingRecord.inspector);
      setDate(editingRecord.date);
      const parts = editingRecord.timestamp.split(',');
      setTime(parts[1]?.trim() || new Date().toLocaleTimeString('th-TH'));
      setWard4_9(editingRecord.ward4_9);
      setWard4_8_ari(editingRecord.ward4_8_ari);
      setBuilding4_7_pt(editingRecord.building4_7_pt);
      setWard4_6(editingRecord.ward4_6);
      setBuilding4_3_opd(editingRecord.building4_3_opd);
      setBuilding4_2_icu(editingRecord.building4_2_icu);
      setBuilding4_1_storage(editingRecord.building4_1_storage);
      setReadyDigitalTanks(editingRecord.readyDigitalTanks);
      setReadyGaugeTanks(editingRecord.readyGaugeTanks);
      setIssues(editingRecord.issues);
    } else {
      // Auto-set current date and time
      const now = new Date();
      const d = now.getDate();
      const m = now.getMonth() + 1;
      const y = now.getFullYear();
      setDate(`${d}/${m}/${y}`);
      setTime(now.toLocaleTimeString('th-TH'));
      if (currentUser.isLoggedIn) {
        setInspector(currentUser.name);
      } else if (activeEmployees.length > 0) {
        setInspector(activeEmployees[0].name);
      }
    }
  }, [editingRecord, isOpen, currentUser]);

  if (!isOpen) return null;

  const totalReadyTanks = (Number(readyDigitalTanks) || 0) + (Number(readyGaugeTanks) || 0);
  const isLowStock =
    readyDigitalTanks < settings.digitalLowThreshold ||
    totalReadyTanks < settings.totalLowThreshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus('กำลังบันทึกข้อมูล...');

    const timestamp = `${date}, ${time || new Date().toLocaleTimeString('th-TH')}`;

    const newRecord: InspectionRecord = {
      id: editingRecord ? editingRecord.id : `rec-${Date.now()}`,
      timestamp,
      inspector: inspector.trim() || 'ไม่ระบุ',
      date: date.trim(),
      ward4_9: ward4_9.trim() || '-',
      ward4_8_ari: ward4_8_ari.trim() || '-',
      building4_7_pt: building4_7_pt.trim() || '-',
      ward4_6: ward4_6.trim() || '-',
      building4_3_opd: building4_3_opd.trim() || '-',
      building4_2_icu: building4_2_icu.trim() || '-',
      building4_1_storage: building4_1_storage.trim() || '-',
      readyDigitalTanks: Number(readyDigitalTanks) || 0,
      readyGaugeTanks: Number(readyGaugeTanks) || 0,
      totalReadyTanks,
      issues: issues.trim() || 'พร้อมใช้งาน',
      isLowStock,
      syncedToLine: sendLine,
      syncedToSheet: true,
      createdAt: new Date().toISOString(),
    };

    // Save record to state & persistence
    onSaveRecord(newRecord);

    // Send notifications if enabled
    if (sendLine) {
      setSubmissionStatus('กำลังส่ง LINE Flex Card เข้ากลุ่ม...');
      try {
        const lineResult = await sendLineAndWebhookNotifications(newRecord, settings);
        if (lineResult.success || lineResult.lineStatus === 'delivered') {
          setSubmissionStatus('✅ ส่งเข้า LINE กลุ่มสำเร็จเรียบร้อย!');
        } else {
          setSubmissionStatus(`บันทึกแล้ว (LINE: ${lineResult.lineStatus})`);
        }
      } catch (err: any) {
        console.warn('Line notification dispatched with notice:', err);
        setSubmissionStatus('บันทึกเรียบร้อย');
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    setIsSubmitting(false);
    onClose();
  };

  const presetIssues = [
    'พร้อมใช้งาน',
    'สายอ๊อกซิเจนชำรุด',
    'สายเอ็นขาด',
    'ถังไม่อยู่ประจำจุด',
    'ข้อต่อเกย์หลวม',
    'สายรัดถังขาด',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingRecord ? 'แก้ไขผลการตรวจเช็คถังออกซิเจน' : 'บันทึกการตรวจเช็คถังออกซิเจนประจำวัน'}
              </h2>
              <p className="text-teal-100 text-xs mt-0.5">
                แบบฟอร์มตรวจสอบสถานะถังและแรงดันประจำจุด BME
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Reorder Alert Banner inside form */}
        {isLowStock && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 sm:px-6 flex items-center space-x-3 text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="font-bold">คำเตือน: ปริมาณถังออกซิเจนเหลือน้อยถึงเกณฑ์ต้องสั่งซื้อ!</span>
              <p className="text-rose-600 text-[11px] mt-0.5">
                ระบบจะสร้าง LINE Flex Card สีแดงเน้นย้ำแจ้งเตือนในไลน์กลุ่มทันทีหลังจากบันทึก
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {/* Section 1: Inspector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ตรวจเช็ค *
              </label>
              <select
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
              >
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.nickname})
                  </option>
                ))}
                {!activeEmployees.some((e) => e.name === inspector) && (
                  <option value={inspector}>{inspector}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ตรวจเช็ค (วว/ดด/ปปปป) *
              </label>
              <input
                type="text"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="เช่น 1/10/2026"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เวลาที่ตรวจเช็ค
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="เช่น 04:30:00"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
              />
            </div>
          </div>

          {/* Section 2: Ready Tanks Stock Count */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>จำนวนถังที่พร้อมใช้งาน (Ready Oxygen Tanks)</span>
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isLowStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isLowStock ? '🚨 ต่ำกว่าเกณฑ์สั่งซื้อ' : '✅ ปริมาณปกติ'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  ถังดิจิตอลรุ่นใหม่ (ถัง) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={readyDigitalTanks}
                    onChange={(e) => setReadyDigitalTanks(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">ถัง</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  เกณฑ์ต่ำ: &lt; {settings.digitalLowThreshold} ถัง
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  ถังหัวเกย์รุ่นเก่า (ถัง) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={readyGaugeTanks}
                    onChange={(e) => setReadyGaugeTanks(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">ถัง</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  เกณฑ์ต่ำ: &lt; {settings.gaugeLowThreshold} ถัง
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  รวมพร้อมใช้ทั้งหมด
                </label>
                <div className="px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-extrabold text-sm sm:text-base flex items-center justify-between">
                  <span>{totalReadyTanks} ถัง</span>
                  <span className="text-[10px] text-teal-700 font-normal">
                    (เกณฑ์: {settings.totalLowThreshold})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 7 Stations Readings */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs block">
              สถานะแรงดันประจำจุด / วอร์ด (ระบุ FULL, ตัวเลขแรงดัน, หรือสถานะ)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Ward 4/9</label>
                <input
                  type="text"
                  value={ward4_9}
                  onChange={(e) => setWard4_9(e.target.value)}
                  placeholder="FULL"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Ward 4/8 (ARI)</label>
                <input
                  type="text"
                  value={ward4_8_ari}
                  onChange={(e) => setWard4_8_ari(e.target.value)}
                  placeholder="FULL"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">อาคาร 4/7 (PT)</label>
                <input
                  type="text"
                  value={building4_7_pt}
                  onChange={(e) => setBuilding4_7_pt(e.target.value)}
                  placeholder="550"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Ward 4/6</label>
                <input
                  type="text"
                  value={ward4_6}
                  onChange={(e) => setWard4_6(e.target.value)}
                  placeholder="FULL"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">อาคาร 4/3 (OPD)</label>
                <input
                  type="text"
                  value={building4_3_opd}
                  onChange={(e) => setBuilding4_3_opd(e.target.value)}
                  placeholder="450"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">อาคาร 4/2 (ICU)</label>
                <input
                  type="text"
                  value={building4_2_icu}
                  onChange={(e) => setBuilding4_2_icu(e.target.value)}
                  placeholder="FULL"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-teal-800 mb-0.5">
                  อาคาร 4/1 (ห้องเก็บอ๊อกซิเจน)
                </label>
                <input
                  type="text"
                  value={building4_1_storage}
                  onChange={(e) => setBuilding4_1_storage(e.target.value)}
                  placeholder="500"
                  className="w-full px-2.5 py-1.5 text-xs border border-teal-300 rounded-md focus:ring-2 focus:ring-teal-500 outline-hidden bg-teal-50/40"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Issues / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ประเด็นปัญหาที่พบในการตรวจเช็ค
            </label>
            <textarea
              rows={2}
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="เช่น พร้อมใช้งาน หรือ ระบุจุดที่สายชำรุด/ถังหาย"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
            />
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[10px] text-slate-400 self-center">ข้อความด่วน:</span>
              {presetIssues.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setIssues(p)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    issues === p
                      ? 'bg-teal-100 text-teal-800 border-teal-300 font-semibold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notification toggles */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendLine}
                onChange={(e) => setSendLine(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500"
              />
              <span className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                <Bell className="w-3.5 h-3.5 text-teal-600" />
                <span>ส่งการ์ดแจ้งเตือน LINE Flex Card ในไลน์กลุ่มอัตโนมัติ</span>
              </span>
            </label>
            <div className="text-[11px] text-slate-500 pl-6">
              ส่งไปที่ LINE Group: {settings.lineGroupId?.substring(0, 10)}... และ Webhook
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs flex items-center space-x-2 transition-all ${
                isLowStock
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/20'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? submissionStatus : 'บันทึกข้อมูล & ส่ง LINE'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
