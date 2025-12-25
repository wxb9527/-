
import React, { useState, useMemo, useEffect } from 'react';
import { User, Appointment, HealthTag, Message } from '../types';
import UserInfoModal from '../components/UserInfoModal';
import { dataService } from '../services/dataService';
import { MOOD_CONFIG } from '../constants';

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
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [recentContactIds, setRecentContactIds] = useState<string[]>([]);
  const [editingLocationApp, setEditingLocationApp] = useState<Appointment | null>(null);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    const syncData = () => {
      setRecentContactIds(dataService.getRecentChatContacts(user.id));
      setLastSyncTime(new Date());
    };
    syncData();
    window.addEventListener('storage', syncData);
    const itv = setInterval(syncData, 2000);
    return () => {
      window.removeEventListener('storage', syncData);
      clearInterval(itv);
    };
  }, [user.id]);

  const monitoredStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const order = { '不健康': 0, '亚健康': 1, '健康': 2 };
      return (order[a.healthTag || '健康'] ?? 2) - (order[b.healthTag || '健康'] ?? 2);
    });
  }, [students]);

  const recentStudents = useMemo(() => {
    return students.filter(s => recentContactIds.includes(s.id));
  }, [students, recentContactIds]);

  const hasUnread = (studentId: string) => {
    return dataService.hasUnreadMessages(user.id, studentId);
  };

  const handleSelectStudent = (student: User) => {
    dataService.markMessagesAsRead(user.id, student.id);
    onSelectStudent(student);
  };

  const stats = useMemo(() => {
    const total = students.length;
    const unhealthy = students.filter(s => s.healthTag === '不健康').length;
    const subHealthy = students.filter(s => s.healthTag === '亚健康').length;
    return { total, unhealthy, subHealthy };
  }, [students]);

  const myAppointments = useMemo(() => {
    return appointments
      .filter(a => a.counselorId === user.id)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [appointments, user.id]);

  const handleOpenEditLocation = (app: Appointment) => {
    setEditingLocationApp(app);
    setNewLocation(app.location);
  };

  const handleSaveLocation = () => {
    if (editingLocationApp && newLocation.trim()) {
      onUpdateAppointmentLocation(editingLocationApp.id, newLocation.trim());
      setEditingLocationApp(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <header className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">系统同步状态</p>
          </div>
          <p className="text-sm font-bold text-gray-700">实时监控中</p>
          <p className="text-[9px] text-gray-400">最后同步: {lastSyncTime.toLocaleTimeString()}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">监控总人数</p>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-5 rounded-3xl border border-yellow-100 shadow-sm">
          <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1">亚健康人数</p>
          <p className="text-2xl font-black text-yellow-700">{stats.subHealthy}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-3xl border border-red-100 shadow-sm">
          <p className="text-[10px] font-bold text-red-600 uppercase mb-1">急需干预</p>
          <p className="text-2xl font-black text-red-700">{stats.unhealthy}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-indigo-50/30">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <i className="fas fa-comment-dots text-indigo-600"></i>
                  近期沟通动态
                </h3>
             </div>
             <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentStudents.map(s => {
                   const latestMood = dataService.getLatestMood(s.id);
                   const moodCfg = latestMood ? MOOD_CONFIG[latestMood.mood] : null;
                   return (
                      <button 
                        key={s.id} 
                        onClick={() => handleSelectStudent(s)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${hasUnread(s.id) ? 'bg-white border-indigo-400 ring-4 ring-indigo-50 scale-105 shadow-md' : 'bg-gray-50 border-transparent hover:border-gray-100'}`}
                      >
                        <div className="relative">
                           <img src={s.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                           {hasUnread(s.id) && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"><i className="fas fa-exclamation text-[8px] text-white"></i></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-gray-900 truncate">{s.name}</p>
                           {moodCfg && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <i className={`fas ${moodCfg.icon} text-[10px] ${moodCfg.color}`}></i>
                                <span className={`text-[9px] font-bold ${moodCfg.color}`}>最新心情：{moodCfg.label}</span>
                              </div>
                           )}
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasUnread(s.id) ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-indigo-600 border border-gray-100 shadow-sm'}`}>
                           <i className={`fas ${hasUnread(s.id) ? 'fa-bell' : 'fa-chevron-right'}`}></i>
                        </div>
                      </button>
                   );
                })}
                {recentStudents.length === 0 && <p className="col-span-full py-10 text-center text-gray-400 text-xs italic">当前暂无活跃对话</p>}
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <i className="fas fa-users-viewfinder text-indigo-600"></i>
                全员健康实时监控
              </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto custom-scrollbar">
              {monitoredStudents.map((student) => {
                const isUnhealthy = student.healthTag === '不健康';
                const msgAlert = hasUnread(student.id);
                const latestMood = dataService.getLatestMood(student.id);
                const moodCfg = latestMood ? MOOD_CONFIG[latestMood.mood] : null;

                return (
                  <div key={student.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-all ${isUnhealthy ? 'bg-red-50/40' : ''}`}>
                    <div className="relative">
                      <img src={student.avatar} className={`w-14 h-14 rounded-full border-2 shadow-sm ${isUnhealthy ? 'border-red-500 ring-4 ring-red-100' : 'border-white'}`} alt="" />
                      {msgAlert && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{student.name}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold text-white ${isUnhealthy ? 'bg-red-600' : student.healthTag === '亚健康' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                          {student.healthTag || '健康'}
                        </span>
                      </div>
                      {moodCfg && (
                        <div className="flex items-center gap-1.5 mt-1 bg-white/50 w-fit px-2 py-0.5 rounded-lg border border-gray-100 shadow-sm">
                           <i className={`fas ${moodCfg.icon} text-xs ${moodCfg.color}`}></i>
                           <span className={`text-[10px] font-bold ${moodCfg.color}`}>情绪：{moodCfg.label}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleSelectStudent(student)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${msgAlert ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-indigo-600 text-white'}`}>
                      {msgAlert ? '收到新消息' : '开启沟通'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="space-y-6">
          <section className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fas fa-clock text-indigo-400"></i>
              咨询预约管理
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {myAppointments.map(app => (
                <div key={app.id} className={`bg-white/5 border border-white/10 p-4 rounded-2xl animate-fade-in ${app.status === 'CANCELLED' ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={app.studentAvatar} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{app.studentName}</p>
                      <p className="text-[9px] text-gray-400">{app.status === 'PENDING' ? '待处理' : app.status === 'CONFIRMED' ? '已确认' : '已取消'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-left bg-black/20 p-3 rounded-xl border border-white/5 mb-3">
                    <div className="flex items-center gap-2 text-[11px]">
                      <i className="far fa-clock text-indigo-400 w-3"></i>
                      <span className="text-gray-300">时间：</span>
                      <span className="text-white font-bold">{app.dateTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <i className="fas fa-map-marker-alt text-indigo-400 w-3"></i>
                      <span className="text-gray-300">地点：</span>
                      <span className="text-white font-bold truncate">{app.location}</span>
                    </div>
                  </div>

                  {app.status !== 'CANCELLED' && (
                    <div className="flex gap-2">
                      {app.status === 'PENDING' && (
                        <button 
                          onClick={() => onUpdateAppointmentStatus(app.id, 'CONFIRMED')} 
                          className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold transition-all"
                        >
                          确认预约
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenEditLocation(app)}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold border border-white/10 transition-all"
                      >
                        修改地点
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {myAppointments.length === 0 && <p className="text-center py-10 text-gray-500 text-xs italic">暂无预约信息</p>}
            </div>
          </section>
        </div>
      </div>

      {editingLocationApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[250] animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><i className="fas fa-edit"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">调整咨询地点</h3>
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-6 tracking-widest">预约时间: {editingLocationApp.dateTime}</p>
            
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">当前地点</label>
                <input 
                  type="text" 
                  value={newLocation} 
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  placeholder="请输入新地点..."
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2">
                <i className="fas fa-info-circle text-amber-500 mt-0.5 text-xs"></i>
                <p className="text-[10px] text-amber-700 leading-normal">修改地点后，系统将自动通知学生。咨询时间由学生发起，不可由咨询师修改。</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditingLocationApp(null)} className="flex-1 py-3 text-gray-400 font-bold text-sm">取消</button>
              <button onClick={handleSaveLocation} className="flex-2 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-xl shadow-indigo-100">确认修改并通知</button>
            </div>
          </div>
        </div>
      )}

      {viewingUser && <UserInfoModal target={viewingUser} onClose={() => setViewingUser(null)} />}
    </div>
  );
};

export default CounselorView;
