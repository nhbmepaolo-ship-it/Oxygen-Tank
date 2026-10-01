import React, { useState, useEffect } from 'react';
import { InspectionRecord, Employee, SystemSettings, CurrentUser } from './types';
import {
  loadRecords,
  saveRecords,
  loadEmployees,
  saveEmployees,
  loadSettings,
  saveSettings,
  loadCurrentUser,
  saveCurrentUser,
  resetToInitialRecords,
  DEFAULT_GUEST_USER,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { RecordsTable } from './components/RecordsTable';
import { EmployeeManagement } from './components/EmployeeManagement';
import { LineFlexSimulatorModal } from './components/LineFlexSimulatorModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { InspectionFormModal } from './components/InspectionFormModal';
import { exportToExcel, exportToPDF } from './utils/exportUtils';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => loadCurrentUser());
  const [records, setRecords] = useState<InspectionRecord[]>(() => loadRecords());
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  const [settings, setSettings] = useState<SystemSettings>(() => loadSettings());

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNewCheckOpen, setIsNewCheckOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InspectionRecord | null>(null);

  // Toast banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  // Reset helper
  const handleResetData = () => {
    const fresh = resetToInitialRecords();
    setRecords(fresh);
    showToast('โหลดข้อมูลประวัติทั้งหมด 274 รายการเรียบร้อยแล้ว', 'success');
  };

  // Initialize data from local storage / server
  useEffect(() => {
    // If records are empty or too low, immediately load full initial dataset
    if (records.length < 200) {
      const fresh = resetToInitialRecords();
      setRecords(fresh);
    }

    // Fetch from server if available
    fetch('/api/records')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverRecords) => {
        if (Array.isArray(serverRecords) && serverRecords.length >= 200) {
          setRecords(serverRecords);
          saveRecords(serverRecords);
        }
      })
      .catch(() => {});

    fetch('/api/employees')
      .then((res) => (res.ok ? res.json() : null))
      .then((serverEmps) => {
        if (Array.isArray(serverEmps) && serverEmps.length > 0) {
          setEmployees(serverEmps);
          saveEmployees(serverEmps);
        }
      })
      .catch(() => {});
  }, []);

  // Show Toast Helper
  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Auth Handlers
  const handleLoginSuccess = (user: CurrentUser) => {
    setCurrentUser(user);
    saveCurrentUser(user);
    showToast(`ยินดีต้อนรับ ${user.name} (${user.position})`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(DEFAULT_GUEST_USER);
    saveCurrentUser(DEFAULT_GUEST_USER);
    showToast('ออกจากระบบเรียบร้อยแล้ว (เข้าสู่โหมดบุคคลทั่วไป)', 'success');
  };

  // Permissions
  const isGuest = currentUser.role === 'guest';
  const isAdminOrHead = currentUser.role === 'admin' || currentUser.role === 'head';
  const canRecord = !isGuest;
  const canEdit = isAdminOrHead;

  // Enforce Guest menu restrictions: Guest only sees Dashboard, Records, Employees
  useEffect(() => {
    if (isGuest && (activeTab === 'line-preview' || activeTab === 'settings')) {
      setActiveTab('dashboard');
    }
  }, [isGuest, activeTab]);

  // Record Handlers
  const handleSaveRecord = (record: InspectionRecord) => {
    let updated: InspectionRecord[];
    const exists = records.some((r) => r.id === record.id);
    if (exists) {
      updated = records.map((r) => (r.id === record.id ? record : r));
    } else {
      updated = [record, ...records];
    }

    setRecords(updated);
    saveRecords(updated);
    setEditingRecord(null);

    if (record.isLowStock) {
      showToast('⚠️ บันทึกข้อมูลแล้ว: สต็อกถังออกซิเจนต่ำกว่าเกณฑ์! ส่ง LINE Alert เรียบร้อย', 'alert');
    } else {
      showToast('✅ บันทึกผลการตรวจเช็คและส่งแจ้งเตือน LINE Flex Card เรียบร้อยแล้ว', 'success');
    }
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveRecords(updated);
    showToast('ลบรายการตรวจเช็คเรียบร้อยแล้ว', 'success');
  };

  const handleSaveEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    saveEmployees(newEmployees);
    showToast('อัพเดตข้อมูลพนักงานเรียบร้อยแล้ว', 'success');
  };

  const handleSaveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว', 'success');
  };

  const latestRecord = records[0] || null;
  const latestIsLowStock = latestRecord?.isLowStock ?? false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center space-x-3 text-xs sm:text-sm font-semibold border ${
              toastMessage.type === 'alert'
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20'
                : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
            }`}
          >
            {toastMessage.type === 'alert' ? (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        onOpenNewCheck={() => {
          if (!canRecord) {
            setIsLoginOpen(true);
          } else {
            setEditingRecord(null);
            setIsNewCheckOpen(true);
          }
        }}
        onOpenProfile={() => setActiveTab('employees')}
        latestIsLowStock={latestIsLowStock}
      />

      {/* Guest Mode Notice Banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 py-2.5 px-4 text-xs font-medium text-center border-b border-slate-700/60 shadow-xs flex items-center justify-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-400"></span>
          <span>
            โหมดบุคคลทั่วไป: ดูเฉพาะ <strong className="text-white">แดชบอร์ดสรุป</strong>, <strong className="text-white">ประวัติการตรวจเช็ค</strong>, และ <strong className="text-white">ข้อมูลพนักงาน</strong>
          </span>
          <span className="text-slate-500">•</span>
          <button
            onClick={() => setIsLoginOpen(true)}
            className="text-teal-400 hover:text-teal-300 underline font-bold transition-colors cursor-pointer"
          >
            เข้าสู่ระบบสำหรับเจ้าหน้าที่
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            records={records}
            settings={settings}
            onOpenNewCheck={() => {
              if (!canRecord) setIsLoginOpen(true);
              else {
                setEditingRecord(null);
                setIsNewCheckOpen(true);
              }
            }}
            onNavigateToRecords={() => setActiveTab('records')}
            canRecord={canRecord}
            onExportExcel={() => exportToExcel(records)}
            onExportPDF={() => exportToPDF(records)}
            onResetData={handleResetData}
          />
        )}

        {activeTab === 'records' && (
          <RecordsTable
            records={records}
            currentUser={currentUser}
            settings={settings}
            canEdit={canEdit}
            canRecord={canRecord}
            onOpenNewCheck={() => {
              if (!canRecord) setIsLoginOpen(true);
              else {
                setEditingRecord(null);
                setIsNewCheckOpen(true);
              }
            }}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsNewCheckOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onPreviewLine={(rec) => {
              setActiveTab('line-preview');
            }}
            onResetData={handleResetData}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManagement
            employees={employees}
            currentUser={currentUser}
            canManage={isAdminOrHead}
            onSaveEmployees={handleSaveEmployees}
            onUpdateCurrentUser={(updated) => {
              setCurrentUser(updated);
              saveCurrentUser(updated);
            }}
          />
        )}

        {activeTab === 'line-preview' && (
          <LineFlexSimulatorModal latestRecord={latestRecord} settings={settings} />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            settings={settings}
            records={records}
            onSaveSettings={handleSaveSettings}
            canManage={isAdminOrHead}
          />
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        employees={employees}
        onLoginSuccess={handleLoginSuccess}
      />

      <InspectionFormModal
        isOpen={isNewCheckOpen}
        onClose={() => {
          setIsNewCheckOpen(false);
          setEditingRecord(null);
        }}
        currentUser={currentUser}
        employees={employees}
        settings={settings}
        onSaveRecord={handleSaveRecord}
        editingRecord={editingRecord}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            BME Oxygen Tank Daily Inspection & LINE Flex Card Notification System
          </span>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Sheet ID: 1PIyrbX2...</span>
            <span>•</span>
            <span>รายงานอัตโนมัติสิ้นเดือน 16:30 น.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
