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
  Sparkles,
  AlertTriangle,
  Lock,
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
  const isGuest = currentUser.role === 'guest';

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return {
          label: 'Admin BME',
          badgeClass: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xs shadow-rose-500/20',
        };
      case 'head':
        return {
          label: 'หัวหน้าหน่วย (Admin)',
          badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-xs shadow-amber-500/20',
        };
      case 'staff':
        return {
          label: 'พนักงานรับส่งผู้ป่วย',
          badgeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs shadow-teal-500/20',
        };
      default:
        return {
          label: 'บุคคลทั่วไป (ดูเท่านั้น)',
          badgeClass: 'bg-slate-200 text-slate-700',
        };
    }
  };

  const badge = getRoleBadge();

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Title with luxury gradient */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 group-hover:shadow-teal-500/40 transition-all duration-300">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg bg-gradient-to-r from-slate-900 via-teal-950 to-slate-800 bg-clip-text text-transparent tracking-tight leading-tight">
                  BME O<sub>2</sub> Monitor
                </span>
                <span className="text-[10px] px-2 py-0.5 font-bold bg-teal-50 text-teal-700 rounded-full border border-teal-200/60 shadow-xs leading-normal">
                  Pro Edition
                </span>
                {latestIsLowStock && (
                  <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] px-2.5 py-0.5 font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200 animate-pulse leading-normal">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>ต้องสั่งด่วน</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">โรงพยาบาลเปาโล • แผนก BME & เวรรับส่งผู้ป่วย</p>
            </div>
          </div>

          {/* Desktop Navigation - Strictly filters visible menus for Guest */}
          <nav className="hidden md:flex items-center space-x-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 backdrop-blur-md">
            {/* Always visible for all (including guests) */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-teal-800 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>แดชบอร์ดสรุป</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                activeTab === 'records'
                  ? 'bg-white text-teal-800 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-indigo-600" />
              <span>ประวัติการตรวจเช็ค</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                activeTab === 'employees'
                  ? 'bg-white text-teal-800 shadow-sm shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-cyan-600" />
              <span>ข้อมูลพนักงาน</span>
            </button>

            {/* ONLY visible for Logged In Staff / Admin (HIDDEN for Guests) */}
            {!isGuest && (
              <>
                <button
                  onClick={() => setActiveTab('line-preview')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'line-preview'
                      ? 'bg-white text-teal-800 shadow-sm shadow-slate-200'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-emerald-600" />
                  <span>LINE Flex Card</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === 'settings'
                      ? 'bg-white text-teal-800 shadow-sm shadow-slate-200'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/50'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-amber-600" />
                  <span>ตั้งค่า & รายงานสิ้นเดือน</span>
                </button>
              </>
            )}
          </nav>

          {/* Action & User Info */}
          <div className="flex items-center space-x-2.5">
            {!isGuest ? (
              <button
                onClick={onOpenNewCheck}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 flex items-center space-x-1.5 transition-all transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">บันทึกตรวจเช็คใหม่</span>
                <span className="sm:hidden">บันทึก</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 flex items-center space-x-1.5 transition-all transform active:scale-95"
              >
                <LogIn className="w-4 h-4 text-teal-400" />
                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
              </button>
            )}

            {/* User Profile Pill */}
            <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
              <div
                onClick={!isGuest ? onOpenProfile : onOpenLogin}
                className="cursor-pointer group flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
                title={!isGuest ? 'คลิกเพื่อแก้ไขข้อมูลส่วนตัว' : 'คลิกเพื่อเข้าสู่ระบบ'}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-center px-1 text-white shadow-xs shrink-0 select-none leading-tight border border-white/50 ${
                    !isGuest
                      ? 'bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-teal-500/20'
                      : 'bg-slate-300 text-slate-700'
                  } ${
                    currentUser.nickname && currentUser.nickname.length > 3
                      ? 'text-[10px]'
                      : 'text-xs'
                  }`}
                  title={!isGuest ? `ผู้ใช้: ${currentUser.name} (${currentUser.nickname || '-'})` : 'เข้าสู่ระบบ'}
                >
                  {!isGuest ? (
                    <span className="truncate max-w-full block text-center">
                      {currentUser.nickname || currentUser.name.slice(0, 2)}
                    </span>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-bold text-slate-800 group-hover:text-teal-700 transition-colors flex items-center space-x-1">
                    <span>{currentUser.name}</span>
                    {!isGuest && <UserCheck className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                  <span className={`inline-block px-2 py-0.2 rounded-full text-[9px] font-bold ${badge.badgeClass}`}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {!isGuest && (
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar - Strictly filters for Guest */}
        <div className="md:hidden flex items-center space-x-1.5 overflow-x-auto py-2.5 border-t border-slate-100 text-xs scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs ${
              activeTab === 'dashboard' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            แดชบอร์ดสรุป
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs ${
              activeTab === 'records' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            ประวัติการตรวจเช็ค
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs ${
              activeTab === 'employees' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
            }`}
          >
            ข้อมูลพนักงาน
          </button>

          {!isGuest && (
            <>
              <button
                onClick={() => setActiveTab('line-preview')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs ${
                  activeTab === 'line-preview' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
                }`}
              >
                LINE Flex
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold text-xs ${
                  activeTab === 'settings' ? 'bg-teal-600 text-white' : 'text-slate-600 bg-slate-100'
                }`}
              >
                ตั้งค่า
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
