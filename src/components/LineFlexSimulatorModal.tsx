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
  ShieldCheck,
  Check,
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
  const [sendStatus, setSendStatus] = useState<{ text: string; type: 'success' | 'error'; messageId?: string } | null>(null);
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
    setSendStatus(null);

    try {
      const res = await sendLineAndWebhookNotifications(displayRecord, settings);
      if (res.success || res.lineStatus === 'delivered') {
        setSendStatus({
          text: `ส่งข้อความเข้า LINE กลุ่มสำเร็จเรียบร้อย!`,
          type: 'success',
          messageId: res.sentMessageId || 'LINE_DELIVERED',
        });
      } else {
        setSendStatus({
          text: `แจ้งเตือน: ${res.lineStatus} (${res.error || 'ตรวจสอบการเชื่อมต่อ'})`,
          type: 'error',
        });
      }
      setTimeout(() => setSendStatus(null), 6000);
    } catch (err: any) {
      setSendStatus({
        text: 'ส่งไม่สำเร็จ: ' + (err.message || 'Error'),
        type: 'error',
      });
      setTimeout(() => setSendStatus(null), 6000);
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
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Bell className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                ตัวอย่าง LINE Flex Card (การ์ดข้อความในไลน์กลุ่ม)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                การ์ดจะถูกยิงเข้า LINE กลุ่ม <span className="font-mono text-teal-700 font-semibold">{settings.lineGroupId?.substring(0, 14)}...</span> ทุกวันหลังตรวจเช็คเสร็จ
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Simulation Toggle */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100/90 rounded-2xl text-xs font-bold border border-slate-200/60">
            <button
              onClick={() => setSimulateMode('current')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                simulateMode === 'current'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ข้อมูลล่าสุดจริง
            </button>
            <button
              onClick={() => setSimulateMode('alert')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                simulateMode === 'alert'
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>การ์ดแจ้งเตือนวิกฤต (แดง)</span>
            </button>
            <button
              onClick={() => setSimulateMode('normal')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 ${
                simulateMode === 'normal'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs'
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
            className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl shadow-md shadow-emerald-500/25 transition-all transform active:scale-95 flex items-center space-x-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'กำลังยิงข้อความ...' : 'ทดสอบยิง LINE จริง'}</span>
          </button>
        </div>
      </div>

      {sendStatus && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 border ${
            sendStatus.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {sendStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <div>
              <span>{sendStatus.text}</span>
              {sendStatus.messageId && (
                <span className="block text-[11px] font-mono opacity-90 mt-0.5">
                  Message ID: {sendStatus.messageId} (บันทึกลงระบบ LINE Server เรียบร้อย)
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setSendStatus(null)} className="p-1 hover:bg-white/20 rounded-lg">
            ✕
          </button>
        </div>
      )}

      {/* Main Container: Mobile Frame + Technical Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Luxury iPhone 16 Pro Mobile Frame */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm rounded-[44px] p-3 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl border-4 border-slate-700/80 relative ring-8 ring-slate-900/10">
            {/* Dynamic Island */}
            <div className="w-28 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* LINE App Top Bar */}
            <div className="bg-[#1e2638] text-white p-3.5 rounded-t-3xl flex items-center justify-between border-b border-slate-700/60 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center font-black text-xs text-white shadow-xs">
                  BME
                </div>
                <div>
                  <span className="font-extrabold text-xs block text-white">กลุ่มแจ้งเตือน ถัง O2 BME</span>
                  <span className="text-[10px] text-emerald-400 block font-medium">● บอทเชื่อมต่อแล้ว</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700">
                LINE Flex v2
              </span>
            </div>

            {/* Chat Body simulating LINE App */}
            <div className="bg-[#8395a7] p-3.5 rounded-b-3xl min-h-[510px] flex flex-col justify-end space-y-2.5">
              <div className="text-center text-[10px] text-white/90 my-1 font-semibold bg-black/15 py-0.5 px-3 rounded-full self-center">
                วันนี้ {displayRecord.date}
              </div>

              {/* The LINE Flex Bubble */}
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-200 transform transition-all duration-300 hover:scale-[1.01]">
                {/* Header */}
                <div
                  className={`p-4 text-white ${
                    isAlert
                      ? 'bg-gradient-to-r from-red-600 to-rose-600'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600'
                  }`}
                >
                  <span className="text-[9px] font-extrabold tracking-widest uppercase opacity-85 block">
                    BME OXYGEN MONITORING
                  </span>
                  <h4 className="text-sm font-extrabold mt-0.5 flex items-center space-x-1.5">
                    {isAlert ? (
                      <>
                        <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                        <span>แจ้งเตือน: ถังออกซิเจนใกล้หมด</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 shrink-0 text-white" />
                        <span>รายงานตรวจเช็คถังออกซิเจน</span>
                      </>
                    )}
                  </h4>
                  <div className="text-[10px] opacity-85 mt-1 font-medium">
                    วันที่ {displayRecord.date} • {displayRecord.timestamp.split(',')[1]?.trim()}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 text-xs bg-white">
                  {/* Inspector */}
                  <div className="flex items-center justify-between text-slate-600 text-[11px] pb-2 border-b border-slate-100">
                    <span className="font-medium">👤 ผู้ตรวจเช็ค:</span>
                    <strong className="text-slate-900 font-bold">{displayRecord.inspector}</strong>
                  </div>

                  {/* Status Banner */}
                  <div
                    className={`p-2.5 rounded-xl text-center font-bold text-xs border ${
                      isAlert
                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
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
                      className={`p-2 rounded-xl border ${
                        displayRecord.readyDigitalTanks < settings.digitalLowThreshold
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 block font-medium">ดิจิตอลรุ่นใหม่</span>
                      <span
                        className={`text-lg font-black ${
                          displayRecord.readyDigitalTanks < settings.digitalLowThreshold
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {displayRecord.readyDigitalTanks}
                      </span>
                      <span className="text-[8px] text-slate-400 block font-medium">ถังพร้อมใช้</span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 text-slate-800 border border-slate-200">
                      <span className="text-[9px] text-slate-500 block font-medium">หัวเกย์รุ่นเก่า</span>
                      <span className="text-lg font-black text-slate-900">
                        {displayRecord.readyGaugeTanks}
                      </span>
                      <span className="text-[8px] text-slate-400 block font-medium">ถังพร้อมใช้</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border ${
                        isAlert
                          ? 'bg-rose-100/70 text-rose-900 border-rose-200'
                          : 'bg-cyan-50 text-cyan-900 border-cyan-200'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 block font-medium">รวมพร้อมใช้</span>
                      <span
                        className={`text-lg font-black ${
                          isAlert ? 'text-rose-700' : 'text-cyan-700'
                        }`}
                      >
                        {displayRecord.totalReadyTanks}
                      </span>
                      <span className="text-[8px] text-slate-400 block font-medium">ถังทั้งหมด</span>
                    </div>
                  </div>

                  {/* Ward pressures */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-600 block mb-1">
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
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px]">
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
                    className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 ${
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
          {/* Status Box */}
          <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/80 shadow-md space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>สถานะการเชื่อมต่อ LINE Messaging API</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">LINE Group ID:</span>
                  <code className="text-slate-900 font-mono font-bold text-xs">
                    {settings.lineGroupId}
                  </code>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  เชื่อมต่อแล้ว
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium block text-[11px]">LINE User ID:</span>
                  <code className="text-slate-900 font-mono font-bold text-xs">
                    {settings.lineUserId}
                  </code>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  พร้อมใช้งาน
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-slate-500 font-medium block text-[11px] mb-1">Webhook URL:</span>
                <a
                  href={settings.webhookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 font-mono text-[11px] bg-teal-50/80 p-2 rounded-xl block break-all hover:underline flex items-center justify-between border border-teal-200/50"
                >
                  <span className="truncate">{settings.webhookUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1.5 text-teal-600" />
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setShowJson(!showJson)}
                className="text-xs font-bold text-slate-700 hover:text-teal-700 transition-colors"
              >
                {showJson ? 'ซ่อน JSON Payload' : 'ดูโครงสร้าง LINE Flex JSON'}
              </button>

              <button
                onClick={handleCopyJson}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก JSON'}</span>
              </button>
            </div>

            {showJson && (
              <div className="mt-3">
                <pre className="bg-slate-900 text-teal-300 p-3.5 rounded-2xl text-[10px] max-h-72 overflow-y-auto font-mono border border-slate-800">
                  {JSON.stringify(flexJson, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-3xl border border-amber-200/80 text-xs text-amber-950 space-y-2 shadow-xs">
            <h4 className="font-extrabold flex items-center space-x-1.5 text-amber-900 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>การทำงานของการแจ้งเตือนอัตโนมัติ</span>
            </h4>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              1. ระบบส่งการ์ดแจ้งเตือนผ่าน Backend Express Proxy เพื่อความปลอดภัย ไม่มีการเปิดเผย Token หรือติดปัญหา CORS
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              2. เมื่อพนักงานกดบันทึกผลการตรวจเช็คในแบบฟอร์มประจำวัน ระบบจะคำนวณจำนวนถังดิจิตอลและรวมถังพร้อมใช้งานทันที
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              3. หากถังต่ำกว่าเกณฑ์ (ดิจิตอล &lt; {settings.digitalLowThreshold} ถัง หรือ รวม &lt; {settings.totalLowThreshold} ถัง) การ์ดจะเปลี่ยนเป็นสีแดงสดพร้อมเครื่องหมายเตือนภัยและข้อความสั่งซื้อด่วนทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
