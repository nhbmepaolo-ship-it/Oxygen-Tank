import React, { useState, useMemo } from 'react';
import { InspectionRecord, CurrentUser, SystemSettings } from '../types';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle,
  Eye,
  Send,
  Calendar,
  Layers,
  ArrowUpDown,
  FilePlus,
} from 'lucide-react';
import { exportToExcel, exportToPDF, downloadNewSheetTemplate } from '../utils/exportUtils';
import { sendLineAndWebhookNotifications } from '../utils/lineService';

interface RecordsTableProps {
  records: InspectionRecord[];
  currentUser: CurrentUser;
  settings: SystemSettings;
  canEdit: boolean;
  canRecord: boolean;
  onOpenNewCheck: () => void;
  onEditRecord: (record: InspectionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onPreviewLine: (record: InspectionRecord) => void;
  onResetData?: () => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  currentUser,
  settings,
  canEdit,
  canRecord,
  onOpenNewCheck,
  onEditRecord,
  onDeleteRecord,
  onPreviewLine,
  onResetData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low-stock' | 'issues' | 'normal'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Helper to parse date to timestamp for reliable sorting
  const parseRecordTime = (r: InspectionRecord): number => {
    try {
      const parts = r.date.split('/');
      if (parts.length >= 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        let y = parseInt(parts[2], 10);
        if (y === 2568 || y === 68) y = 2025;
        if (y === 2569 || y === 69) y = 2026;
        return new Date(y, m - 1, d).getTime();
      }
    } catch {}
    return 0;
  };

  const filteredRecords = useMemo(() => {
    const list = records.filter((r) => {
      // Search match
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        r.inspector.toLowerCase().includes(searchLower) ||
        r.date.toLowerCase().includes(searchLower) ||
        r.issues.toLowerCase().includes(searchLower) ||
        r.timestamp.toLowerCase().includes(searchLower) ||
        r.building4_1_storage.toLowerCase().includes(searchLower);

      // Status match
      let matchesStatus = true;
      if (statusFilter === 'low-stock') {
        matchesStatus = r.isLowStock;
      } else if (statusFilter === 'issues') {
        matchesStatus = Boolean(
          r.issues &&
          r.issues !== 'พร้อมใช้งาน' &&
          r.issues !== 'พร้อมใช้' &&
          r.issues !== '-' &&
          r.issues !== '*'
        );
      } else if (statusFilter === 'normal') {
        matchesStatus = !r.isLowStock;
      }

      return matchesSearch && matchesStatus;
    });

    // Sort: newest first (desc) by default, or asc
    list.sort((a, b) => {
      const timeA = parseRecordTime(a);
      const timeB = parseRecordTime(b);
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [records, searchTerm, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleResendLine = async (record: InspectionRecord) => {
    setResendStatus('กำลังส่งเข้า LINE...');
    try {
      await sendLineAndWebhookNotifications(record, settings);
      setResendStatus('ส่งเข้า LINE สำเร็จ!');
      setTimeout(() => setResendStatus(null), 3000);
    } catch {
      setResendStatus('เกิดข้อผิดพลาดในการส่ง');
      setTimeout(() => setResendStatus(null), 3000);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ค้นหาผู้ตรวจเช็ค, วันที่, หรือประเด็นปัญหา..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({records.length})
          </button>
          <button
            onClick={() => {
              setStatusFilter('low-stock');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1 ${
              statusFilter === 'low-stock'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>ต่ำกว่าเกณฑ์</span>
          </button>
          <button
            onClick={() => {
              setStatusFilter('issues');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1 ${
              statusFilter === 'issues'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>มีปัญหาชำรุด</span>
          </button>

          {/* Sort order toggle button */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center space-x-1 border border-slate-200 shadow-2xs"
            title={sortOrder === 'desc' ? 'เรียงจากใหม่สุดไปเก่าสุด' : 'เรียงจากเก่าสุดไปใหม่สุด'}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
            <span>{sortOrder === 'desc' ? 'ล่าสุดก่อน ⬇' : 'เก่าสุดก่อน ⬆'}</span>
          </button>
        </div>

        {/* Export & New Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {onResetData && (
            <button
              onClick={onResetData}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center space-x-1 border border-slate-200"
              title="โหลดข้อมูลประวัติทั้งหมด 274 รายการ"
            >
              <span>🔄 โหลด 274 รายการ</span>
            </button>
          )}

          {/* Create new sheet template button */}
          <button
            onClick={() => downloadNewSheetTemplate(settings.sheetId)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center space-x-1.5"
            title="สร้างชีทใหม่พร้อมหัวตาราง 13 คอลัมน์สำหรับ Google Sheet"
          >
            <FilePlus className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">สร้างชีทใหม่พร้อมหัวตาราง</span>
            <span className="sm:hidden">หัวตาราง</span>
          </button>

          <button
            onClick={() => exportToExcel(filteredRecords)}
            className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
            title="ส่งออกรายการที่เลือกเป็น Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => exportToPDF(filteredRecords)}
            className="px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
            title="ส่งออกรายงานเป็น PDF"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>

          {canRecord && (
            <button
              onClick={onOpenNewCheck}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกตรวจเช็ค</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap">วันที่ / เวลา</th>
                <th className="py-3 px-3.5 whitespace-nowrap">ผู้ตรวจเช็ค</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">ถังดิจิตอล</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">ถังหัวเกย์</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">รวมพร้อมใช้</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">สถานะเกณฑ์</th>
                <th className="py-3 px-3 whitespace-nowrap">ห้องเก็บ 4/1</th>
                <th className="py-3 px-3 whitespace-nowrap">ICU 4/2</th>
                <th className="py-3 px-4 whitespace-nowrap">ประเด็นปัญหาที่พบ</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => {
                  const isCrit = record.isLowStock;
                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCrit ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-800">
                        <div>{record.date}</div>
                        <div className="text-[10px] text-slate-400">
                          {record.timestamp.split(',')[1]?.trim() || ''}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{record.inspector}</span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-md ${
                            record.readyDigitalTanks < settings.digitalLowThreshold
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-teal-50 text-teal-800'
                          }`}
                        >
                          {record.readyDigitalTanks}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {record.readyGaugeTanks}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`font-extrabold px-2 py-0.5 rounded-md text-xs ${
                            isCrit
                              ? 'bg-rose-200 text-rose-800'
                              : 'bg-cyan-50 text-cyan-800'
                          }`}
                        >
                          {record.totalReadyTanks}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {isCrit ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>สั่งซื้อด่วน</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            <span>ปกติ</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {record.building4_1_storage}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {record.building4_2_icu}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate">
                        <span
                          className={`${
                            record.issues &&
                            record.issues !== 'พร้อมใช้งาน' &&
                            record.issues !== 'พร้อมใช้' &&
                            record.issues !== '-' &&
                            record.issues !== '*'
                              ? 'font-bold text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {record.issues}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            title="ดูข้อมูลละเอียด"
                            className="p-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canRecord && (
                            <button
                              onClick={() => onPreviewLine(record)}
                              title="พรีวิว LINE Flex Card"
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <>
                              <button
                                onClick={() => onEditRecord(record)}
                                title="แก้ไขผลตรวจเช็ค"
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`ยืนยันการลบรายการตรวจเช็คของวันที่ ${record.date}?`)) {
                                    onDeleteRecord(record.id);
                                  }
                                }}
                                title="ลบรายการ"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            แสดง {paginatedRecords.length} จากทั้งหมด {filteredRecords.length} รายการ
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              ก่อนหน้า
            </button>
            <span className="px-2 font-medium">
              หน้า {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* Row Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">รายละเอียดผลการตรวจเช็ค</h3>
                <p className="text-slate-400 text-xs">
                  วันที่: {selectedRecord.date} | บันทึก: {selectedRecord.timestamp}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-500 block">ผู้ตรวจเช็ค</span>
                  <span className="text-sm font-bold text-slate-800">{selectedRecord.inspector}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">สถานะสต็อก</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      selectedRecord.isLowStock
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedRecord.isLowStock ? '🚨 ต่ำกว่าเกณฑ์สั่งซื้อ' : '✅ ปกติ'}
                  </span>
                </div>
              </div>

              {/* Ready tank numbers */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-center">
                  <span className="text-[10px] text-teal-700 block">ดิจิตอลรุ่นใหม่</span>
                  <span className="text-lg font-extrabold">{selectedRecord.readyDigitalTanks}</span>
                  <span className="text-[10px] block text-teal-600">ถัง</span>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-center">
                  <span className="text-[10px] text-indigo-700 block">หัวเกย์รุ่นเก่า</span>
                  <span className="text-lg font-extrabold">{selectedRecord.readyGaugeTanks}</span>
                  <span className="text-[10px] block text-indigo-600">ถัง</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-900 border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-600 block">รวมพร้อมใช้</span>
                  <span className="text-lg font-extrabold">{selectedRecord.totalReadyTanks}</span>
                  <span className="text-[10px] block text-slate-500">ถัง</span>
                </div>
              </div>

              {/* Station readings */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-150">
                <span className="font-semibold text-slate-700 block">แรงดันประจำจุด / วอร์ด:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>• Ward 4/9: <strong>{selectedRecord.ward4_9}</strong></div>
                  <div>• Ward 4/8 (ARI): <strong>{selectedRecord.ward4_8_ari}</strong></div>
                  <div>• อาคาร 4/7 (PT): <strong>{selectedRecord.building4_7_pt}</strong></div>
                  <div>• Ward 4/6: <strong>{selectedRecord.ward4_6}</strong></div>
                  <div>• OPD 4/3: <strong>{selectedRecord.building4_3_opd}</strong></div>
                  <div>• ICU 4/2: <strong>{selectedRecord.building4_2_icu}</strong></div>
                  <div className="col-span-2 text-teal-800">
                    • อาคาร 4/1 (ห้องเก็บถัง): <strong>{selectedRecord.building4_1_storage}</strong>
                  </div>
                </div>
              </div>

              {/* Issue details */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-semibold text-amber-900 block mb-0.5">ประเด็นปัญหาที่พบ:</span>
                <span className="text-amber-800 font-medium">{selectedRecord.issues}</span>
              </div>

              {resendStatus && (
                <div className="p-2 bg-teal-50 text-teal-800 rounded-lg text-center font-bold">
                  {resendStatus}
                </div>
              )}

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-2">
                {canRecord ? (
                  <button
                    onClick={() => handleResendLine(selectedRecord)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ส่งซ้ำเข้า LINE กลุ่ม</span>
                  </button>
                ) : (
                  <div></div>
                )}
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-medium"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
