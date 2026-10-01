import React, { useState } from 'react';
import { Employee, CurrentUser } from '../types';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  Phone,
  Key,
  Calendar,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  currentUser: CurrentUser;
  canManage: boolean; // Admin or Unit Head
  onSaveEmployees: (employees: Employee[]) => void;
  onUpdateCurrentUser: (user: CurrentUser) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  currentUser,
  canManage,
  onSaveEmployees,
  onUpdateCurrentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'resigned'>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [resigningEmployee, setResigningEmployee] = useState<Employee | null>(null);
  const [resignationReason, setResignationReason] = useState('');
  const [resignationDate, setResignationDate] = useState('');

  // Self Profile Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selfName, setSelfName] = useState(currentUser.name);
  const [selfNickname, setSelfNickname] = useState(currentUser.nickname);
  const [selfPhone, setSelfPhone] = useState('');
  const [selfPassword, setSelfPassword] = useState('');
  const [selfSuccess, setSelfSuccess] = useState('');

  // New employee form state
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPosition, setNewPosition] = useState('พนักงานรับส่งผู้ป่วย');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'staff' | 'head'>('staff');
  const [formError, setFormError] = useState('');

  // Filtered lists
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const resignedEmployees = employees.filter((e) => e.status === 'resigned');

  const currentList = activeTab === 'active' ? activeEmployees : resignedEmployees;
  const filteredList = currentList.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (employees.some((emp) => emp.code === newCode.trim())) {
      setFormError('รหัสพนักงานนี้มีอยู่ในระบบแล้ว');
      return;
    }

    const newEmp: Employee = {
      id: newCode.trim(),
      code: newCode.trim(),
      name: newName.trim(),
      nickname: newNickname.trim(),
      position: newPosition.trim(),
      phone: newPhone.trim(),
      status: 'active',
      role: newRole,
      password: newCode.trim(), // Default pass is code
    };

    onSaveEmployees([...employees, newEmp]);
    setIsAddModalOpen(false);
    // Reset form
    setNewCode('');
    setNewName('');
    setNewNickname('');
    setNewPhone('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const updated = employees.map((emp) =>
      emp.id === editingEmployee.id ? editingEmployee : emp
    );
    onSaveEmployees(updated);

    // If edited own profile, update session
    if (currentUser.id === editingEmployee.id) {
      onUpdateCurrentUser({
        ...currentUser,
        name: editingEmployee.name,
        nickname: editingEmployee.nickname,
        position: editingEmployee.position,
      });
    }

    setEditingEmployee(null);
  };

  const handleConfirmResignation = () => {
    if (!resigningEmployee) return;
    const today = resignationDate.trim() || new Date().toLocaleDateString('th-TH');

    const updated = employees.map((emp) =>
      emp.id === resigningEmployee.id
        ? {
            ...emp,
            status: 'resigned' as const,
            resignedDate: today,
            resignedReason: resignationReason.trim() || 'ลาออก',
          }
        : emp
    );

    onSaveEmployees(updated);
    setResigningEmployee(null);
    setResignationReason('');
    setResignationDate('');
  };

  const handleRestoreEmployee = (empId: string) => {
    if (confirm('ยืนยันการคืนสถานะพนักงานกลับมาปฏิบัติงานตามปกติ?')) {
      const updated = employees.map((emp) =>
        emp.id === empId
          ? {
              ...emp,
              status: 'active' as const,
              resignedDate: undefined,
              resignedReason: undefined,
            }
          : emp
      );
      onSaveEmployees(updated);
    }
  };

  const handleSaveSelfProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = employees.map((emp) => {
      if (emp.id === currentUser.id || emp.code === currentUser.username) {
        return {
          ...emp,
          name: selfName.trim(),
          nickname: selfNickname.trim(),
          phone: selfPhone.trim() || emp.phone,
          password: selfPassword.trim() || emp.password,
          updatedAt: new Date().toISOString(),
        };
      }
      return emp;
    });

    onSaveEmployees(updated);
    onUpdateCurrentUser({
      ...currentUser,
      name: selfName.trim(),
      nickname: selfNickname.trim(),
    });

    setSelfSuccess('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!');
    setTimeout(() => {
      setSelfSuccess('');
      setIsProfileModalOpen(false);
    }, 1500);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>ฐานข้อมูลพนักงาน (BME & พนักงานรับส่งผู้ป่วย)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ข้อมูลพนักงาน 19 ท่าน พร้อมระบบแยกสถานะกำลังปฏิบัติงานและลาออก
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser.isLoggedIn && (
            <button
              onClick={() => {
                const me = employees.find(
                  (e) => e.id === currentUser.id || e.code === currentUser.username
                );
                setSelfName(me?.name || currentUser.name);
                setSelfNickname(me?.nickname || currentUser.nickname);
                setSelfPhone(me?.phone || '');
                setSelfPassword('');
                setIsProfileModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <Key className="w-4 h-4 text-teal-600" />
              <span>อัพเดตข้อมูลส่วนตัวของฉัน</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มพนักงานใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab switch */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'active'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>พนักงานที่ปฏิบัติงานอยู่ ({activeEmployees.length} คน)</span>
          </button>

          <button
            onClick={() => setActiveTab('resigned')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'resigned'
                ? 'bg-white text-rose-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserX className="w-4 h-4 text-rose-600" />
            <span>ประวัติพนักงานที่ลาออก ({resignedEmployees.length} คน)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อ, ชื่อเล่น, รหัส..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Employee List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((emp) => {
          const isMe = currentUser.username === emp.code;
          const isHead = emp.role === 'head';

          return (
            <div
              key={emp.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs relative overflow-hidden ${
                emp.status === 'resigned'
                  ? 'bg-rose-50/40 border-rose-200'
                  : isHead
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                      emp.status === 'resigned'
                        ? 'bg-rose-100 text-rose-700'
                        : isHead
                        ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white'
                        : 'bg-gradient-to-tr from-teal-500 to-cyan-600 text-white'
                    }`}
                  >
                    {emp.nickname ? emp.nickname.slice(0, 2) : emp.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                      {isMe && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                          ฉัน
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-600">
                        {emp.code}
                      </span>
                      <span>•</span>
                      <span className="text-slate-600">({emp.nickname || 'ไม่มีชื่อเล่น'})</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    emp.status === 'resigned'
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : isHead
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {emp.status === 'resigned'
                    ? 'ลาออกแล้ว'
                    : isHead
                    ? 'หัวหน้าหน่วย'
                    : 'พนักงาน'}
                </span>
              </div>

              {/* Position & Phone */}
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ตำแหน่ง:</span>
                  <span className="font-medium text-slate-700">{emp.position}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">เบอร์โทร:</span>
                    <span className="font-mono text-slate-700">{emp.phone}</span>
                  </div>
                )}
                {emp.status === 'resigned' && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-800 text-[11px]">
                    <p className="font-semibold">วันที่ลาออก: {emp.resignedDate || '-'}</p>
                    <p className="mt-0.5">เหตุผล: {emp.resignedReason || '-'}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end space-x-1.5">
                {canManage && emp.status === 'active' && (
                  <>
                    <button
                      onClick={() => setEditingEmployee(emp)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      onClick={() => {
                        setResigningEmployee(emp);
                        setResignationDate(new Date().toLocaleDateString('th-TH'));
                        setResignationReason('');
                      }}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>บันทึกการลาออก</span>
                    </button>
                  </>
                )}

                {canManage && emp.status === 'resigned' && (
                  <button
                    onClick={() => handleRestoreEmployee(emp.id)}
                    className="px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100 bg-emerald-50 rounded-lg transition-colors flex items-center space-x-1 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>คืนสถานะกลับมาทำงาน</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Employee */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-teal-600 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">เพิ่มพนักงานใหม่</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  {formError}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  รหัสพนักงาน (เช่น 500020) *
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="500020"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ - สกุล *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="สมชาย ใจดี"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อเล่น *</label>
                  <input
                    type="text"
                    required
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="ชาย"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">สิทธิ์การใช้งาน</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'staff' | 'head')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden bg-white"
                >
                  <option value="staff">พนักงานรับส่งผู้ป่วย (ตรวจเช็คถังได้)</option>
                  <option value="head">หัวหน้าหน่วย (สิทธิ์ Admin เต็มรูปแบบ)</option>
                </select>
              </div>
              <p className="text-[11px] text-slate-400">
                * รหัสผ่านเริ่มต้นในการเข้าสู่ระบบจะตั้งเป็นรหัสพนักงานโดยอัตโนมัติ
              </p>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  บันทึกพนักงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Employee (Admin / Head) */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">แก้ไขข้อมูลพนักงาน</h3>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รหัสพนักงาน</label>
                <input
                  type="text"
                  disabled
                  value={editingEmployee.code}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ - สกุล</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.name}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อเล่น</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.nickname}
                    onChange={(e) =>
                      setEditingEmployee({ ...editingEmployee, nickname: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={editingEmployee.position}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, position: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={editingEmployee.phone || ''}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เปลี่ยนรหัสผ่าน</label>
                <input
                  type="text"
                  placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยน"
                  value={editingEmployee.password || ''}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Employee as Resigned */}
      {resigningEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-rose-600 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">บันทึกการลาออกของพนักงาน</h3>
              <button
                onClick={() => setResigningEmployee(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                คุณกำลังจะบันทึกการลาออกของ: <strong>{resigningEmployee.name} ({resigningEmployee.nickname})</strong> รหัส {resigningEmployee.code}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  วันที่ลาออก (วว/ดด/ปปปป) *
                </label>
                <input
                  type="text"
                  value={resignationDate}
                  onChange={(e) => setResignationDate(e.target.value)}
                  placeholder="เช่น 31/10/2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เหตุผลการลาออก</label>
                <textarea
                  rows={2}
                  value={resignationReason}
                  onChange={(e) => setResignationReason(e.target.value)}
                  placeholder="เช่น ลาออกไปประกอบธุรกิจส่วนตัว, ย้ายที่อยู่"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setResigningEmployee(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResignation}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                >
                  ยืนยันการลาออก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Self Profile Update */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-teal-700 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">อัพเดตข้อมูลส่วนตัวของฉัน</h3>
                <p className="text-teal-200 text-xs">รหัสพนักงาน: {currentUser.username}</p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveSelfProfile} className="p-5 space-y-3.5 text-xs">
              {selfSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{selfSuccess}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  required
                  value={selfName}
                  onChange={(e) => setSelfName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อเล่น *</label>
                <input
                  type="text"
                  required
                  value={selfNickname}
                  onChange={(e) => setSelfNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="text"
                  value={selfPhone}
                  onChange={(e) => setSelfPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ตั้งรหัสผ่านใหม่ (หากต้องการเปลี่ยน)
                </label>
                <input
                  type="password"
                  value={selfPassword}
                  onChange={(e) => setSelfPassword(e.target.value)}
                  placeholder="เว้นว่างไว้หากใช้รหัสผ่านเดิม"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
