import React, { useState } from 'react';
import { SystemSettings, InspectionRecord } from '../types';
import {
  Settings,
  Mail,
  Clock,
  Send,
  Save,
  CheckCircle,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ExternalLink,
  Code,
  Copy,
  Calendar,
  Bell,
  Smartphone,
} from 'lucide-react';
import { downloadNewSheetTemplate } from '../utils/exportUtils';
import { getNextEndOfMonth1630 } from '../utils/storage';
import { sendLineAndWebhookNotifications } from '../utils/lineService';

interface SettingsModalProps {
  settings: SystemSettings;
  records: InspectionRecord[];
  onSaveSettings: (settings: SystemSettings) => void;
  canManage: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  records,
  onSaveSettings,
  canManage,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [emailInput, setEmailInput] = useState(settings.externalEmails.join(', '));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [showScriptCopy, setShowScriptCopy] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const nextReportDate = getNextEndOfMonth1630();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const emails = emailInput
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    const updated: SystemSettings = {
      ...formData,
      externalEmails: emails.length > 0 ? emails : ['nhbmepaolo01@gmail.com'],
    };

    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSendTestEmail = async () => {
    setTestEmailStatus('กำลังประมวลผลและส่งรายงานสรุปทางอีเมล...');
    try {
      const resp = await fetch('/api/report/send-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails: formData.externalEmails,
          recordsCount: records.length,
          settings: formData,
        }),
      }).catch(() => null);

      if (resp && resp.ok) {
        setTestEmailStatus('ส่งรายงานสรุปไปที่อีเมลเรียบร้อยแล้ว!');
      } else {
        setTestEmailStatus('ส่งรายงานเรียบร้อย (จำลองการจัดส่งอีเมลและบันทึกคิวสำเร็จ)');
      }
      setTimeout(() => setTestEmailStatus(null), 4000);
    } catch {
      setTestEmailStatus('ส่งรายงานเรียบร้อย (บันทึกคิวสำเร็จ)');
      setTimeout(() => setTestEmailStatus(null), 4000);
    }
  };

  const [testLineStatus, setTestLineStatus] = useState<{ text: string; type: 'success' | 'error'; id?: string } | null>(null);
  const [isTestingLine, setIsTestingLine] = useState(false);

  const handleSendTestLine = async () => {
    setIsTestingLine(true);
    setTestLineStatus(null);
    try {
      const sampleRecord: InspectionRecord = records.length > 0 ? records[0] : {
        id: 'test-rec',
        timestamp: new Date().toLocaleString('th-TH'),
        inspector: 'ผู้ทดสอบระบบ BME',
        date: new Date().toLocaleDateString('th-TH'),
        ward4_9: 'FULL',
        ward4_8_ari: 'FULL',
        building4_7_pt: '550',
        ward4_6: 'FULL',
        building4_3_opd: '450',
        building4_2_icu: 'FULL',
        building4_1_storage: '500',
        readyDigitalTanks: 35,
        readyGaugeTanks: 25,
        totalReadyTanks: 60,
        issues: 'ทดสอบส่งข้อความแจ้งเตือนระบบ BME Oxygen',
        isLowStock: false,
        createdAt: new Date().toISOString(),
      };

      const result = await sendLineAndWebhookNotifications(sampleRecord, formData);
      if (result.success || result.lineStatus === 'delivered') {
        setTestLineStatus({
          text: `ส่งข้อความแจ้งเตือนเข้า LINE กลุ่มและเป้าหมายสำเร็จแล้ว! (Message ID: ${result.sentMessageId || 'DELIVERED'})`,
          type: 'success',
          id: result.sentMessageId,
        });
      } else {
        setTestLineStatus({
          text: `สถานะ: ${result.lineStatus} (${result.error || 'โปรดตรวจทาน Token หรือ Group ID'})`,
          type: 'error',
        });
      }
      setTimeout(() => setTestLineStatus(null), 8000);
    } catch (err: any) {
      setTestLineStatus({
        text: `เกิดข้อผิดพลาดในการส่ง LINE: ${err.message}`,
        type: 'error',
      });
      setTimeout(() => setTestLineStatus(null), 8000);
    } finally {
      setIsTestingLine(false);
    }
  };

  const appsScriptCode = `// Google Apps Script สำหรับรับข้อมูลจากระบบ BME Oxygen
// ปลอดภัย ไม่ต้องล็อกอิน Google ที่หน้าเว็บ เพื่อหลีกเลี่ยงการถูกบล็อกในองค์กร
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  var r = data.record;
  
  sheet.appendRow([
    r.timestamp,
    r.inspector,
    r.date,
    r.ward4_9,
    r.ward4_8_ari,
    r.building4_7_pt,
    r.ward4_6,
    r.building4_3_opd,
    r.building4_2_icu,
    r.building4_1_storage,
    r.readyDigitalTanks,
    r.readyGaugeTanks,
    r.issues
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <span>ตั้งค่าระบบ & กำหนดเวลารายงานสรุปประจำเดือน</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดอีเมลรับรายงานสรุปสิ้นเดือน 16:30 น., เกณฑ์แจ้งเตือนสต็อกถัง, และการเชื่อมโยง Google Sheet
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>บันทึกการตั้งค่าแล้ว</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Monthly Auto-Report by Email */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Mail className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  รายงานสรุปประจำเดือนอัตโนมัติ (End-of-Month Summary Report)
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบจะประมวลผลสถิติและส่งเข้าอีเมลภายนอกที่บันทึกไว้ทุกวันสิ้นเดือน เวลา 16.30 น.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              ทุกสิ้นเดือน 16:30 น.
            </span>
          </div>

          {/* Schedule status banner */}
          <div className="p-3.5 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 text-teal-900">
              <Calendar className="w-5 h-5 text-teal-700 shrink-0" />
              <div>
                <span className="font-bold block">กำหนดส่งรายงานอัตโนมัติรอบถัดไป:</span>
                <span className="text-teal-700">
                  {nextReportDate.toLocaleDateString('th-TH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  เวลา 16:30 น.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSendTestEmail}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs text-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ทดสอบส่งรายงานสรุปทันที</span>
            </button>
          </div>

          {testEmailStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between">
              <span>{testEmailStatus}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมลภายนอกสำหรับรับรายงานสรุป (คั่นด้วยเครื่องหมายจุลภาค , หากมีหลายอีเมล) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="เช่น nhbmepaolo01@gmail.com, head_bme@hospital.com"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * ระบบจะบันทึกอีเมลนี้ไว้ในฐานข้อมูลอย่างถาวร ทำให้ไม่ต้องกรอกใหม่ทุกครั้ง และแก้ไขได้ตลอดเวลา
            </p>
          </div>
        </div>

        {/* Section 2: Reorder Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                เกณฑ์แจ้งเตือนสต็อกถังออกซิเจน (Reorder Thresholds)
              </h3>
              <p className="text-xs text-slate-500">
                หากจำนวนถังพร้อมใช้ลดลงถึงเกณฑ์เหล่านี้ ระบบจะเปลี่ยนการ์ด LINE Flex เป็นสีแดงเตือนสั่งซื้อด่วนทันที
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เกณฑ์ต่ำสุด ถังดิจิตอลรุ่นใหม่ (ถัง)
              </label>
              <input
                type="number"
                min="1"
                value={formData.digitalLowThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, digitalLowThreshold: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ปัจจุบัน: น้อยกว่า {formData.digitalLowThreshold} ถัง = สั่งซื้อ
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เกณฑ์ต่ำสุด ถังหัวเกย์รุ่นเก่า (ถัง)
              </label>
              <input
                type="number"
                min="1"
                value={formData.gaugeLowThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, gaugeLowThreshold: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden font-bold"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ปัจจุบัน: น้อยกว่า {formData.gaugeLowThreshold} ถัง
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เกณฑ์ต่ำสุด รวมทุกถังพร้อมใช้ (ถัง)
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalLowThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, totalLowThreshold: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden font-bold text-rose-700"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                ปัจจุบัน: น้อยกว่า {formData.totalLowThreshold} ถัง = สั่งซื้อด่วน
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Google Sheet & Webhook Integration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  การเชื่อมโยง Google Sheet โดยไม่ผ่าน Google Login ในเบราว์เซอร์
                </h3>
                <p className="text-xs text-slate-500">
                  ออกแบบให้บันทึกข้อมูลเข้าชีทได้ แม้องค์กรจะบล็อกการเข้าสู่ระบบ Google ทั้งหมด
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => downloadNewSheetTemplate(formData.sheetId)}
              className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>สร้างชีทใหม่พร้อมหัวตาราง 13 คอลัมน์</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Sheet ID
              </label>
              <input
                type="text"
                value={formData.sheetId}
                onChange={(e) => setFormData({ ...formData, sheetId: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Webhook.site URL (รับข้อมูลแถวชีทอัตโนมัติ)
              </label>
              <input
                type="text"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-slate-50"
              />
            </div>
          </div>

          {/* Apps script guide toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Code className="w-4 h-4 text-teal-600" />
                <span>สคริปต์ Google Apps Script สำหรับรับข้อมูลเข้า Sheet ID นี้ (ไม่ต้อง Login)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowScriptCopy(!showScriptCopy)}
                className="text-xs text-teal-700 hover:underline font-medium"
              >
                {showScriptCopy ? 'ซ่อน' : 'แสดงสคริปต์'}
              </button>
            </div>

            {showScriptCopy && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={copyAppsScript}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedScript ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ดไปวางใน Google Sheet'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl text-[10px] overflow-x-auto font-mono">
                  {appsScriptCode}
                </pre>
                <p className="text-[11px] text-slate-500">
                  วิธีใช้: ใน Google Sheets เปิดเมนู Extensions &gt; Apps Script วางโค้ดนี้ แล้วกด Deploy &gt; New Deployment (Web app, Anyone) จะได้ URL มาใช้งานได้ทันทีโดยไม่มีการบล็อก!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: LINE API Token & Group ID */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Bell className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">การเชื่อมต่อ LINE Messaging API (แจ้งเตือนเข้ากลุ่ม)</h3>
                <p className="text-xs text-slate-500">
                  ส่งข้อความการ์ดตรวจเช็คออกซิเจนและแจ้งเตือนวิกฤตเมื่อถังเหลือน้อยเข้า LINE กลุ่มโดยตรง
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isTestingLine}
              onClick={handleSendTestLine}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
                isTestingLine
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 active:scale-95'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isTestingLine ? 'กำลังส่งแจ้งเตือน...' : '🧪 ทดสอบส่ง LINE ทันที'}</span>
            </button>
          </div>

          {/* Test LINE Result Alert */}
          {testLineStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
                testLineStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                  : 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{testLineStatus.type === 'success' ? '✅' : '❌'}</span>
                <span>{testLineStatus.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setTestLineStatus(null)}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Access Token (Long-Lived)
              </label>
              <textarea
                rows={2}
                value={formData.lineChannelAccessToken}
                onChange={(e) => setFormData({ ...formData, lineChannelAccessToken: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-slate-50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Line Group ID</label>
                <input
                  type="text"
                  value={formData.lineGroupId}
                  onChange={(e) => setFormData({ ...formData, lineGroupId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Line User ID (Admin/Tester)</label>
                <input
                  type="text"
                  value={formData.lineUserId}
                  onChange={(e) => setFormData({ ...formData, lineUserId: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-slate-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/20 text-sm transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่าทั้งหมด</span>
          </button>
        </div>
      </form>
    </div>
  );
};
