import React from 'react';
import { CurrentUser } from '../types';
import {
  Activity,
  PlusCircle,
  Table,
  Users,
  Settings,
  LogIn,
  LogOut,
  UserCheck,
  Bell,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';

interface NavbarProps {
  currentUser: CurrentUser;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenNewCheck: () => void;
  onOpenProfile: () => void;
  latestIsLowStock: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenLogin,
  onLogout,
  onOpenNewCheck,
  onOpenProfile,
  latestIsLowStock,
}) => {
  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return { label: 'Admin BME', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'head':
        return { label: 'หัวหน้าหน่วย (Admin)', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'staff':
        return { label: 'พนักงานรับส่งผู้ป่วย', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: 'บุคคลทั่วไป (ดูเท่านั้น)', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  BME O<sub>2</sub> Monitor
                </span>
                <span className="text-[10px] px-2 py-0.5 font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                  ระบบตรวจเช็คถัง
                </span>
                {latestIsLowStock && (
                  <span className="flex items-center space-x-1 text-[11px] px-2 py-0.5 font-bold bg-red-100 text-red-700 rounded-full border border-red-300 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span>สต็อกต่ำกว่าเกณฑ์</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">แผนก BME / เวรพนักงานรับส่งผู้ป่วย</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>แดชบอร์ดสรุป</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'records'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>ประวัติการตรวจเช็ค</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'employees'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>ข้อมูลพนักงาน</span>
            </button>

            <button
              onClick={() => setActiveTab('line-preview')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'line-preview'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>LINE Flex Card</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'settings'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>ตั้งค่า & รายงานสิ้นเดือน</span>
            </button>
          </nav>

          {/* Action & User Info */}
          <div className="flex items-center space-x-2">
            {currentUser.isLoggedIn ? (
              <button
                onClick={onOpenNewCheck}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center space-x-1.5 transition-all transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">บันทึกตรวจเช็คใหม่</span>
                <span className="sm:hidden">บันทึก</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white shadow-xs flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบเพื่อบันทึก</span>
              </button>
            )}

            {/* User Profile Pill */}
            <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
              <div
                onClick={currentUser.isLoggedIn ? onOpenProfile : onOpenLogin}
                className="cursor-pointer group flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title={currentUser.isLoggedIn ? 'คลิกเพื่อแก้ไขข้อมูลส่วนตัว' : 'คลิกเพื่อเข้าสู่ระบบ'}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold ring-2 ring-white">
                  {currentUser.isLoggedIn ? currentUser.nickname?.charAt(0) || 'U' : 'G'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors flex items-center space-x-1">
                    <span>{currentUser.name}</span>
                    {currentUser.isLoggedIn && <UserCheck className="w-3 h-3 text-teal-600" />}
                  </div>
                  <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {currentUser.isLoggedIn ? (
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="hidden sm:flex text-xs text-teal-700 font-medium px-2 py-1 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-100 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-teal-600 text-white font-medium' : 'text-slate-600 bg-slate-100'
            }`}
          >
            แดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'records' ? 'bg-teal-600 text-white font-medium' : 'text-slate-600 bg-slate-100'
            }`}
          >
            ประวัติการตรวจ
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'employees' ? 'bg-teal-600 text-white font-medium' : 'text-slate-600 bg-slate-100'
            }`}
          >
            พนักงาน
          </button>
          <button
            onClick={() => setActiveTab('line-preview')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'line-preview' ? 'bg-teal-600 text-white font-medium' : 'text-slate-600 bg-slate-100'
            }`}
          >
            LINE Flex
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1.5 rounded-md whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-teal-600 text-white font-medium' : 'text-slate-600 bg-slate-100'
            }`}
          >
            ตั้งค่า
          </button>
        </div>
      </div>
    </header>
  );
};
