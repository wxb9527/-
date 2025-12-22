
import React, { useState, useMemo, useEffect } from 'react';
import { User, Mood, UserRole, Appointment, HealthTag } from '../types';
import { MOOD_CONFIG } from '../constants';
import UserInfoModal from '../components/UserInfoModal';
import { dataService } from '../services/dataService';

interface AdvisorViewProps {
  user: User;
  students: User[];
  onSelectStudent: (student: User) => void;
  appointments: Appointment[];
}

const AdvisorView: React.FC<AdvisorViewProps> = ({ user, students, onSelectStudent, appointments }) => {
  const [confirmCall, setConfirmCall] = useState<{ name: string, phone: string } | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [recentContactIds, setRecentContactIds] = useState<string[]>([]);

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

  const myStudents = useMemo(() => {
    return students.filter(s => s.college === user.college);
  }, [students, user.college]);

  const recentContacts = useMemo(() => {
    return recentContactIds
      .map(id => myStudents.find(s => s.id === id))
      .filter((s): s is User => s !== undefined);
  }, [recentContactIds, myStudents]);

  const highRiskStudents = useMemo(() => {
    return myStudents.filter(s => s.healthTag === '不健康' || s.healthTag === '亚健康');
  }, [myStudents]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.college} - 辅导员管理</h2>
          <p className="text-gray-500 text-sm">当前管理学生：{myStudents.length} 人</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-1 space-y-4">
          {/* 健康异常 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-exclamation-triangle text-red-500"></i>健康异常推送 ({highRiskStudents.length})</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {highRiskStudents.map(s => (
                <div key={s.id} className={`p-3 rounded-xl border ${s.healthTag === '不健康' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-yellow-50 border-yellow-100 text-yellow-900'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold">{s.name}</p>
                    <span className="text-[8px] px-1 bg-white/50 rounded">{s.healthTag}</span>
                  </div>
                  <p className="text-[10px] mb-2">班级: {s.class}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmCall({ name: s.name, phone: s.phone! })} className="flex-1 bg-white text-gray-600 text-[10px] py-1 rounded shadow-sm font-bold">拨号</button>
                    <button onClick={() => onSelectStudent(s)} className="flex-1 bg-indigo-600 text-white text-[10px] py-1 rounded shadow-sm font-bold">留言</button>
                  </div>
                </div>
              ))}
              {highRiskStudents.length === 0 && <p className="text-center text-gray-400 py-4 text-xs italic">暂无预警学生</p>}
            </div>
          </div>

          {/* 最近沟通 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-comment-dots text-indigo-500"></i>最近沟通</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {recentContacts.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => onSelectStudent(s)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100 text-left"
                >
                  <img src={s.avatar} className="w-8 h-8 rounded-full shadow-sm" alt="" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-gray-900 truncate">{s.name}</p>
                    <p className="text-[9px] text-gray-500 truncate">{s.class}</p>
                  </div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                </button>
              ))}
              {recentContacts.length === 0 && <p className="text-center text-gray-400 py-4 text-xs italic">暂无沟通记录</p>}
            </div>
          </div>
        </section>

        <section className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800">所辖学生列表</h3></div>
          <div className="divide-y max-h-[600px] overflow-y-auto custom-scrollbar">
            {myStudents.map((student) => (
              <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <button onClick={() => setViewingUser(student)} className="focus:outline-none hover:scale-105 transition-transform">
                  <img src={student.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{student.name}</p>
                    <span className={`text-[9px] px-1.5 rounded-full font-bold ${student.healthTag === '健康' ? 'bg-green-100 text-green-600' : student.healthTag === '亚健康' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                      {student.healthTag || '待测'}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold">{student.class}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">学号: {student.id}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmCall({ name: student.name, phone: student.phone! })} className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-all"><i className="fas fa-phone-alt text-sm"></i></button>
                  <button onClick={() => onSelectStudent(student)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"><i className="fas fa-comment-dots text-sm"></i></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {viewingUser && <UserInfoModal target={viewingUser} onClose={() => setViewingUser(null)} />}
      {confirmCall && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-phone-alt text-xl"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">发起语音通话</h3>
            <p className="text-sm text-gray-500 mb-6">即将呼叫：<span className="font-bold text-gray-800">{confirmCall.name}</span></p>
            <div className="flex gap-3"><button onClick={() => setConfirmCall(null)} className="flex-1 py-2 text-gray-500 font-bold text-sm text-gray-500">取消</button><button onClick={() => { window.location.href = `tel:${confirmCall.phone}`; setConfirmCall(null); }} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm">立即拨号</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorView;
