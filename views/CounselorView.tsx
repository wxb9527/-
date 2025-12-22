
import React, { useState, useMemo, useEffect } from 'react';
import { User, Mood, UserRole, Appointment, HealthTag } from '../types';
import { MOOD_CONFIG } from '../constants';
import UserInfoModal from '../components/UserInfoModal';
import { dataService } from '../services/dataService';

interface CounselorViewProps {
  user: User;
  students: User[];
  onSelectStudent: (student: User) => void;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  onUpdateAppointmentLocation: (id: string, location: string) => void;
  appointments: Appointment[];
}

const CounselorView: React.FC<CounselorViewProps> = ({ 
  user, 
  students, 
  onSelectStudent, 
  onUpdateAppointmentStatus,
  onUpdateAppointmentLocation,
  appointments 
}) => {
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [recentContactIds, setRecentContactIds] = useState<string[]>([]);
  const [editingLocAppId, setEditingLocAppId] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    const refreshContacts = () => {
      setRecentContactIds(dataService.getRecentChatContacts(user.id));
    };
    refreshContacts();
    window.addEventListener('storage', refreshContacts);
    const interval = setInterval(refreshContacts, 5000);
    return () => {
      window.removeEventListener('storage', refreshContacts);
      clearInterval(interval);
    };
  }, [user.id]);

  const recentContacts = useMemo(() => {
    return recentContactIds
      .map(id => students.find(s => s.id === id))
      .filter((s): s is User => s !== undefined);
  }, [recentContactIds, students]);

  const highRiskStudents = useMemo(() => {
    return students.filter(s => s.healthTag === '不健康' || s.healthTag === '亚健康');
  }, [students]);

  const myAppointments = useMemo(() => {
    return appointments
      .filter(a => a.counselorId === user.id)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [appointments, user.id]);

  const handleStartEditLocation = (app: Appointment) => {
    setEditingLocAppId(app.id);
    setNewLocation(app.location);
  };

  const handleSaveLocation = () => {
    if (editingLocAppId && newLocation.trim()) {
      onUpdateAppointmentLocation(editingLocAppId, newLocation);
      setEditingLocAppId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 健康异常推送 */}
        <section className="bg-red-50 border border-red-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-pulse"><i className="fas fa-bell"></i></div>
            <h2 className="text-xl font-bold text-red-900">健康异常推送 ({highRiskStudents.length})</h2>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {highRiskStudents.map((student) => (
              <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex items-center gap-4">
                <button onClick={() => setViewingUser(student)} className="focus:outline-none">
                  <img src={student.avatar} className="w-12 h-12 rounded-full border-2 border-red-50" alt="" />
                </button>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm">{student.name}</h4>
                  <span className={`text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase ${student.healthTag === '不健康' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'}`}>
                    {student.healthTag}
                  </span>
                </div>
                <button onClick={() => onSelectStudent(student)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold">立即访谈</button>
              </div>
            ))}
            {highRiskStudents.length === 0 && <p className="py-10 text-center text-gray-400 text-sm italic">暂无健康异常预警</p>}
          </div>
        </section>

        {/* 预约咨询请求 */}
        <section className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center"><i className="fas fa-calendar-check"></i></div>
            <h2 className="text-xl font-bold text-indigo-900">预约记录/审批 ({myAppointments.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING').length})</h2>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {myAppointments.map((app) => (
              <div key={app.id} className={`bg-white p-4 rounded-xl border flex items-center gap-4 transition-all ${app.status === 'CANCELLED' ? 'opacity-50 grayscale' : 'border-indigo-100 shadow-sm'}`}>
                <img src={app.studentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.studentId}`} className="w-10 h-10 rounded-full border shadow-sm" alt="" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{app.studentName}</h4>
                      <p className="text-[9px] text-gray-400 font-bold mb-1 uppercase tracking-tight">{app.dateTime}</p>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 rounded uppercase ${app.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' : app.status === 'CANCELLED' ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'}`}>
                      {app.status === 'CONFIRMED' ? '已确认' : app.status === 'CANCELLED' ? '已取消' : '待处理'}
                    </span>
                  </div>
                  
                  {editingLocAppId === app.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="text" 
                        value={newLocation} 
                        onChange={(e) => setNewLocation(e.target.value)}
                        className="text-[9px] border-2 border-indigo-200 rounded px-2 flex-1 py-1 outline-none"
                        autoFocus
                      />
                      <button onClick={handleSaveLocation} className="text-[9px] bg-indigo-600 text-white px-3 py-1 rounded font-bold">确定</button>
                      <button onClick={() => setEditingLocAppId(null)} className="text-[9px] text-gray-400">取消</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-50 group">
                      <div className="flex items-center gap-1">
                        <i className="fas fa-location-dot text-[9px] text-indigo-400"></i>
                        <p className="text-[9px] text-indigo-600 font-bold italic">{app.location}</p>
                      </div>
                      {app.status !== 'CANCELLED' && (
                        <button onClick={() => handleStartEditLocation(app)} className="hidden group-hover:flex items-center gap-1 text-[8px] text-indigo-400 hover:text-indigo-600 font-bold transition-all">
                          <i className="fas fa-edit"></i> 修改地点
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {app.status === 'PENDING' ? (
                  <button onClick={() => onUpdateAppointmentStatus(app.id, 'CONFIRMED')} className="bg-indigo-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold shadow-sm shadow-indigo-100">接受</button>
                ) : app.status === 'CONFIRMED' ? (
                  <button onClick={() => onUpdateAppointmentStatus(app.id, 'CANCELLED')} className="text-[10px] text-red-400 hover:text-red-600 font-bold">取消</button>
                ) : null}
              </div>
            ))}
            {myAppointments.length === 0 && <p className="py-10 text-center text-gray-400 text-sm italic">暂无预约申请</p>}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 最近联系人 */}
        <section className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center"><i className="fas fa-comments"></i></div>
            <h2 className="text-xl font-bold text-gray-800">最近联系人 ({recentContacts.length})</h2>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {recentContacts.map((student) => (
              <div key={student.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex items-center gap-4 hover:bg-teal-50 transition-colors">
                <img src={student.avatar} className="w-10 h-10 rounded-full border shadow-sm" alt="" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-gray-900 text-xs truncate">{student.name}</h4>
                  <p className="text-[9px] text-gray-400 truncate">{student.class}</p>
                </div>
                <button onClick={() => onSelectStudent(student)} className="text-[10px] bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold">对话</button>
              </div>
            ))}
            {recentContacts.length === 0 && <p className="py-10 text-center text-gray-400 text-xs italic">暂无联系记录</p>}
          </div>
        </section>

        {/* 学生列表 */}
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">全部咨询学生</h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto custom-scrollbar">
            {students.map((student) => (
              <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <button onClick={() => setViewingUser(student)} className="relative focus:outline-none"><img src={student.avatar} className="w-12 h-12 rounded-full border shadow-sm" alt="" /></button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{student.name}</p>
                    <span className={`text-[9px] px-1.5 rounded font-bold ${student.healthTag === '健康' ? 'bg-green-100 text-green-600' : student.healthTag === '亚健康' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                      {student.healthTag || '待测'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">{student.college} | {student.class}</p>
                </div>
                <button onClick={() => onSelectStudent(student)} className="bg-white text-indigo-600 border border-indigo-200 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all">发起咨询</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {viewingUser && <UserInfoModal target={viewingUser} onClose={() => setViewingUser(null)} />}
    </div>
  );
};

export default CounselorView;
