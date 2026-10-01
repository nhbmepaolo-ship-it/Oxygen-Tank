import React, { useState } from 'react';
import { Employee, CurrentUser } from '../types';
import { X, Lock, User, ShieldCheck, UserCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onLoginSuccess: (user: CurrentUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  employees,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'admin' | 'guest'>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'admin') {
      if (username.trim() === 'Admin_BME' && password === '@dmin') {
        onLoginSuccess({
          id: 'admin_bme',
          username: 'Admin_BME',
          name: 'ผู้ดูแลระบบ BME',
          nickname: 'Admin',
          position: 'Biomedical Engineer (Admin)',
          role: 'admin',
          isLoggedIn: true,
        });
        onClose();
        return;
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่าน Admin ไม่ถูกต้อง (Admin_BME / @dmin)');
        return;
      }
    }

    if (activeTab === 'staff') {
      const trimmedCode = username.trim();
      const emp = employees.find((e) => e.code === trimmedCode && e.status === 'active');

      if (!emp) {
        setError('ไม่พบรหัสพนักงานนี้ หรือพนักงานอยู่ในสถานะลาออกแล้ว');
        return;
      }

      // Default password is code if not set
      const expectedPassword = emp.password || emp.code;
      if (password !== expectedPassword) {
        setError('รหัสผ่านไม่ถูกต้อง (ค่าเริ่มต้นคือรหัสพนักงาน)');
        return;
      }

      onLoginSuccess({
        id: emp.id,
        username: emp.code,
        name: emp.name,
        nickname: emp.nickname,
        position: emp.position,
        role: emp.role, // 'head' or 'staff'
        isLoggedIn: true,
      });
      onClose();
      return;
    }
  };

  const handleGuest = () => {
    onLoginSuccess({
      id: 'guest',
      username: 'guest',
      name: 'บุคคลทั่วไป (ผู้เข้าชม)',
      nickname: 'Guest',
      position: 'ผู้เยี่ยมชม (ดูข้อมูลเท่านั้น)',
      role: 'guest',
      isLoggedIn: false,
    });
    onClose();
  };

  // Quick fill helper
  const quickFill = (code: string, pass: string, type: 'staff' | 'admin') => {
    setActiveTab(type);
    setUsername(code);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold">เข้าสู่ระบบ BME O₂ System</h2>
          <p className="text-teal-100 text-xs mt-1">
            ระบุข้อมูลผู้ใช้งานเพื่อบันทึกหรือจัดการข้อมูลถังออกซิเจน
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('staff');
              setError('');
              setUsername('');
              setPassword('');
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'staff'
                ? 'border-teal-600 text-teal-700 bg-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            พนักงาน / หัวหน้าหน่วย
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setError('');
              setUsername('Admin_BME');
              setPassword('');
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'admin'
                ? 'border-teal-600 text-teal-700 bg-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Admin_BME
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('guest');
              setError('');
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${
              activeTab === 'guest'
                ? 'border-teal-600 text-teal-700 bg-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            บุคคลทั่วไป
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'guest' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <User className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-800 text-base">เข้าดูในฐานะบุคคลทั่วไป</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                บุคคลทั่วไปสามารถดูแดชบอร์ด ดูประวัติการตรวจเช็ค และดูรายงานได้ แต่ไม่สามารถบันทึกหรือแก้ไขข้อมูลได้
              </p>
              <button
                type="button"
                onClick={handleGuest}
                className="mt-6 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors shadow-xs"
              >
                เข้าดูข้อมูล (โหมดอ่านอย่างเดียว)
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'admin' ? 'ชื่อผู้ใช้ Admin' : 'รหัสพนักงาน (6 หลัก)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'Admin_BME' : 'เช่น 500001, 500002'}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeTab === 'admin' ? 'ระบุรหัสผ่าน (@dmin)' : 'รหัสผ่าน (เริ่มต้น: รหัสพนักงาน)'}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-hidden"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          )}

          {/* Quick login shortcuts for user testing */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">คลิกเพื่อทดสอบเข้าใช้งานด่วน:</p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => quickFill('Admin_BME', '@dmin', 'admin')}
                className="p-1.5 text-left rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Admin_BME (@dmin)</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill('500001', '500001', 'staff')}
                className="p-1.5 text-left rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center space-x-1"
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">500001 หัวหน้าหน่วย (เอ็ม)</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill('500002', '500002', 'staff')}
                className="p-1.5 text-left rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors flex items-center space-x-1"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">500002 สุรชัย (บัง)</span>
              </button>
              <button
                type="button"
                onClick={() => quickFill('500009', '500009', 'staff')}
                className="p-1.5 text-left rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors flex items-center space-x-1"
              >
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">500009 อรรถพล (อัน)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
