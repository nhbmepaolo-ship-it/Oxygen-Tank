import React, { useState } from 'react';
import { InspectionRecord, SystemSettings } from '../types';
import {
  Bell,
  Smartphone,
  Send,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Layers,
  Box,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { createLineFlexMessage, sendLineAndWebhookNotifications } from '../utils/lineService';

interface LineFlexSimulatorModalProps {
  latestRecord: InspectionRecord | null;
  settings: SystemSettings;
}

export const LineFlexSimulatorModal: React.FC<LineFlexSimulatorModalProps> = ({
  latestRecord,
  settings,
}) => {
  const [simulateMode, setSimulateMode] = useState<'current' | 'alert' | 'normal'>('current');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate mock record based on mode
  const displayRecord: InspectionRecord = React.useMemo(() => {
    if (!latestRecord) {
      return {
        id: 'sample',
        timestamp: '1/10/2026, 04:30:00',
        inspector: 'เอกพงษ์ โกมล (หัวหน้าหน่วย)',
        date: '1/10/2026',
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
        issues: 'พร้อมใช้งานปกติ',
        isLowStock: false,
        createdAt: new Date().toISOString(),
      };
    }

    if (simulateMode === 'alert') {
      return {
        ...latestRecord,
        readyDigitalTanks: 12,
        readyGaugeTanks: 18,
        totalReadyTanks: 30,
        isLowStock: true,
        issues: '🚨 ถังดิจิตอลเหลือน้อยถึงเกณฑ์สั่งซื้อด่วน! (เหลือ 12 ถัง จากเกณฑ์ 20)',
      };
    }

    if (simulateMode === 'normal') {
      return {
        ...latestRecord,
        readyDigitalTanks: 42,
        readyGaugeTanks: 30,
        totalReadyTanks: 72,
        isLowStock: false,
        issues: 'พร้อมใช้งานปกติทุกจุด',
      };
    }

    return latestRecord;
  }, [latestRecord, simulateMode]);

  const flexJson = createLineFlexMessage(displayRecord, settings);

  const handleSendTestPush = async () => {
    setIsSending(true);
    setSendStatus('กำลังส่งเข้า LINE Messaging API & Webhook...');

    try {
      const res = await sendLineAndWebhookNotifications(displayRecord, settings);
      setSendStatus(`ส่งสำเร็จ! (LINE: ${res.lineStatus}, Webhook: ${res.webhookStatus})`);
      setTimeout(() => setSendStatus(null), 4000);
    } catch (err: any) {
      setSendStatus('ส่งไม่สำเร็จ: ' + (err.message || 'Error'));
      setTimeout(() => setSendStatus(null), 4000);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(flexJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAlert = displayRecord.isLowStock;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Bell className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              ตัวอย่าง LINE Flex Card (การ์ดข้อความในไลน์กลุ่ม)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            การ์ดจะถูกส่งเข้า LINE กลุ่ม {settings.lineGroupId?.substring(0, 12)}... ทุกวันทันทีหลังจากบันทึกผลการตรวจเสร็จ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Toggle */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSimulateMode('current')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                simulateMode === 'current'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ข้อมูลล่าสุดจริง
            </button>
            <button
              onClick={() => setSimulateMode('alert')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                simulateMode === 'alert'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>การ์ดแจ้งเตือนวิกฤต (แดง)</span>
            </button>
            <button
              onClick={() => setSimulateMode('normal')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
                simulateMode === 'normal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>การ์ดปกติ (เขียว)</span>
            </button>
          </div>

          <button
            onClick={handleSendTestPush}
            disabled={isSending}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'กำลังยิงข้อความ...' : 'ทดสอบยิง LINE จริง'}</span>
          </button>
        </div>
      </div>

      {sendStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{sendStatus}</span>
          <span className="text-[11px] text-emerald-600">
            ปลายทาง: กลุ่ม LINE & Webhook.site
          </span>
        </div>
      )}

      {/* Main Container: Mobile Frame + Technical Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Pixel Perfect Mobile LINE Frame */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-[36px] p-3 bg-slate-900 shadow-2xl border-4 border-slate-700 relative">
            {/* Phone notch */}
            <div className="w-36 h-4 bg-slate-800 rounded-full mx-auto mb-3"></div>

            {/* LINE App Header */}
            <div className="bg-[#202737] text-white p-3 rounded-t-2xl flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs">
                  BME
                </div>
                <div>
                  <span className="font-bold text-xs block">กลุ่มแจ้งเตือน ถัง O2 BME</span>
                  <span className="text-[9px] text-slate-400 block">สมาชิก 19 คน</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                LINE Bot Push
              </span>
            </div>

            {/* Chat Body simulating LINE App */}
            <div className="bg-[#8C9DAE] p-3 rounded-b-2xl min-h-[490px] flex flex-col justify-end space-y-2">
              <div className="text-center text-[10px] text-white/80 my-1 font-medium">
                วันนี้ {displayRecord.date}
              </div>

              {/* The LINE Flex Bubble */}
              <div className="rounded-2xl overflow-hidden shadow-xl bg-white border border-slate-200">
                {/* Header */}
                <div
                  className={`p-4 text-white ${
                    isAlert
                      ? 'bg-gradient-to-r from-red-600 to-rose-600'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                  }`}
                >
                  <span className="text-[9px] font-extrabold tracking-widest uppercase opacity-80 block">
                    BME OXYGEN MONITORING
                  </span>
                  <h4 className="text-sm font-extrabold mt-0.5 flex items-center space-x-1.5">
                    {isAlert ? (
                      <>
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>แจ้งเตือน: ถังออกซิเจนใกล้หมด</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>รายงานตรวจเช็คถังออกซิเจน</span>
                      </>
                    )}
                  </h4>
                  <div className="text-[10px] opacity-80 mt-1">
                    วันที่ {displayRecord.date} • {displayRecord.timestamp.split(',')[1]?.trim()}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 text-xs bg-white">
                  {/* Inspector */}
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>👤 ผู้ตรวจเช็ค:</span>
                    <strong className="text-slate-900">{displayRecord.inspector}</strong>
                  </div>

                  {/* Status Banner */}
                  <div
                    className={`p-2.5 rounded-lg text-center font-bold text-xs border ${
                      isAlert
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isAlert
                      ? '🚨 ถังเหลือน้อยถึงเกณฑ์สั่งซื้อด่วน!'
                      : '✅ ปริมาณถังออกซิเจนปกติ'}
                    {isAlert && (
                      <span className="block text-[9px] font-normal text-rose-600 mt-0.5">
                        * เกณฑ์ความปลอดภัย: ดิจิตอล &ge; {settings.digitalLowThreshold} ถัง หรือ รวม &ge; {settings.totalLowThreshold} ถัง
                      </span>
                    )}
                  </div>

                  {/* Stock Grid */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div
                      className={`p-2 rounded-lg border ${
                        displayRecord.readyDigitalTanks < settings.digitalLowThreshold
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 block">ดิจิตอลรุ่นใหม่</span>
                      <span
                        className={`text-lg font-black ${
                          displayRecord.readyDigitalTanks < settings.digitalLowThreshold
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {displayRecord.readyDigitalTanks}
                      </span>
                      <span className="text-[8px] text-slate-400 block">ถังพร้อมใช้</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 text-slate-800 border border-slate-200">
                      <span className="text-[9px] text-slate-500 block">หัวเกย์รุ่นเก่า</span>
                      <span className="text-lg font-black text-slate-900">
                        {displayRecord.readyGaugeTanks}
                      </span>
                      <span className="text-[8px] text-slate-400 block">ถังพร้อมใช้</span>
                    </div>

                    <div
                      className={`p-2 rounded-lg border ${
                        isAlert
                          ? 'bg-rose-100/70 text-rose-900 border-rose-200'
                          : 'bg-cyan-50 text-cyan-900 border-cyan-200'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 block">รวมพร้อมใช้</span>
                      <span
                        className={`text-lg font-black ${
                          isAlert ? 'text-rose-700' : 'text-cyan-700'
                        }`}
                      >
                        {displayRecord.totalReadyTanks}
                      </span>
                      <span className="text-[8px] text-slate-400 block">ถังทั้งหมด</span>
                    </div>
                  </div>

                  {/* Ward pressures */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">
                      📍 สถานะแรงดันจุดตรวจประจำวอร์ด:
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-700 font-mono">
                      <div>• W4/9: <strong>{displayRecord.ward4_9}</strong></div>
                      <div>• W4/8 ARI: <strong>{displayRecord.ward4_8_ari}</strong></div>
                      <div>• B4/7 PT: <strong>{displayRecord.building4_7_pt}</strong></div>
                      <div>• W4/6: <strong>{displayRecord.ward4_6}</strong></div>
                      <div>• OPD 4/3: <strong>{displayRecord.building4_3_opd}</strong></div>
                      <div>• ICU 4/2: <strong>{displayRecord.building4_2_icu}</strong></div>
                      <div className="col-span-2 text-teal-800 font-semibold">
                        • เก็บถัง 4/1: <strong>{displayRecord.building4_1_storage}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Remark box */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px]">
                    <span className="text-slate-400 block">🔧 ประเด็นปัญหาที่พบ:</span>
                    <strong
                      className={
                        displayRecord.issues &&
                        displayRecord.issues !== 'พร้อมใช้งาน' &&
                        displayRecord.issues !== 'พร้อมใช้' &&
                        displayRecord.issues !== '-' &&
                        displayRecord.issues !== '*'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }
                    >
                      {displayRecord.issues || 'พร้อมใช้งาน'}
                    </strong>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button
                    className={`w-full py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 ${
                      isAlert ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    <span>{isAlert ? '🚨 เปิดระบบสั่งถังออกซิเจนด่วน' : '📱 เปิดดูข้อมูลระบบ BME'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Notification Config & JSON Payload Inspector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>การตั้งค่าปลายทาง LINE Messaging API</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium block">LINE Group ID:</span>
                <code className="text-slate-800 font-mono text-[11px] bg-slate-100 p-1 rounded-md block break-all">
                  {settings.lineGroupId || 'ไม่ได้กำหนด'}
                </code>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">LINE User ID:</span>
                <code className="text-slate-800 font-mono text-[11px] bg-slate-100 p-1 rounded-md block break-all">
                  {settings.lineUserId || 'ไม่ได้กำหนด'}
                </code>
              </div>

              <div>
                <span className="text-slate-500 font-medium block">Webhook URL:</span>
                <a
                  href={settings.webhookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 font-mono text-[11px] bg-teal-50 p-1 rounded-md block break-all hover:underline flex items-center justify-between"
                >
                  <span className="truncate">{settings.webhookUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setShowJson(!showJson)}
                className="text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors"
              >
                {showJson ? 'ซ่อน JSON Payload' : 'ดูโครงสร้าง LINE Flex JSON'}
              </button>

              <button
                onClick={handleCopyJson}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center space-x-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก JSON'}</span>
              </button>
            </div>

            {showJson && (
              <div className="mt-3">
                <pre className="bg-slate-900 text-teal-300 p-3 rounded-xl text-[10px] max-h-72 overflow-y-auto font-mono">
                  {JSON.stringify(flexJson, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <h4 className="font-bold flex items-center space-x-1 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>การทำงานของการแจ้งเตือนอัตโนมัติ</span>
            </h4>
            <p className="text-[11px] text-amber-800">
              1. เมื่อพนักงานกดบันทึกผลการตรวจเช็คในแบบฟอร์มประจำวัน ระบบจะคำนวณจำนวนถังดิจิตอลและรวมถังพร้อมใช้งานทันที
            </p>
            <p className="text-[11px] text-amber-800">
              2. หากถังต่ำกว่าเกณฑ์ที่กำหนด (ดิจิตอล &lt; {settings.digitalLowThreshold} ถัง หรือ รวม &lt; {settings.totalLowThreshold} ถัง) การ์ดจะเปลี่ยนเป็นสีแดงสดพร้อมเครื่องหมายเตือนภัยและข้อความสั่งซื้อด่วน เพื่อให้เจ้าหน้าที่จัดซื้อ/หัวหน้าสั่งถังได้ทันการณ์
            </p>
            <p className="text-[11px] text-amber-800">
              3. ข้อมูลถูกส่งเข้าทั้ง LINE Group และ Webhook ไปยัง Sheet ID: <code>{settings.sheetId.substring(0, 8)}...</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
