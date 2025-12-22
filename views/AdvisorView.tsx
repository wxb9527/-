
import React, { useState } from 'react';
import { User, Mood, UserRole, Appointment } from '../types';
import { MOOD_CONFIG } from '../constants';

interface StudentProfile extends User {
  lastMood: Mood;
  moodTimestamp: number;
}

interface AdvisorViewProps {
  user: User;
  onSelectStudent: (student: StudentProfile) => void;
  appointments: Appointment[];
}

const MOCK_STUDENTS: StudentProfile[] = [
  { id: 's1', name: '王小明', role: UserRole.STUDENT, avatar: 'https://picsum.photos/id/1012/100/100', lastMood: Mood.CRISIS, moodTimestamp: Date.now() - 3600000, isOnline: true, phone: '139-1111-2222', college: '计算机学院', class: '计科2101' },
  { id: 's2', name: '李华', role: UserRole.STUDENT, avatar: 'https://picsum.photos/id/1013/100/100', lastMood: Mood.SAD, moodTimestamp: Date.now() - 86400000, isOnline: false, phone: '139-3333-4444', college: '计算机学院', class: '计科2101' },
  { id: 's3', name: '张悦', role: UserRole.STUDENT, avatar: 'https://picsum.photos/id/1014/100/100', lastMood: Mood.NEUTRAL, moodTimestamp: Date.now() - 172800000, isOnline: true, phone: '139-5555-6666', college: '计算机学院', class: '计科2102' }
];

const AdvisorView: React.FC<AdvisorViewProps> = ({ user, onSelectStudent, appointments }) => {
  const [confirmCall, setConfirmCall] = useState<{ name: string, phone: string } | null>(null);

  const executeCall = () => {
    if (confirmCall) {
      window.location.href = `tel:${confirmCall.phone}`;
      setConfirmCall(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-gray-900">辅导员工作台</h2><p className="text-gray-500 text-sm">管理所辖班级学生的心理与生活动态</p></div></header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-exclamation-circle text-orange-500"></i>待处理异常</h3>
            <div className="space-y-3">
              {MOCK_STUDENTS.filter(s => s.lastMood === Mood.CRISIS || s.lastMood === Mood.SAD).map(s => (
                <div key={s.id} className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-sm font-bold text-orange-900">{s.name} - {s.class}</p>
                  <p className="text-[10px] text-orange-700 mb-2">心情：{MOOD_CONFIG[s.lastMood].label}</p>
                  <div className="flex gap-2">
                    <button onClick={() => onSelectStudent(s)} className="flex-1 bg-white text-orange-600 text-[10px] py-1 rounded shadow-sm font-bold">留言</button>
                    <button onClick={() => setConfirmCall({ name: s.name, phone: s.phone! })} className="flex-1 bg-orange-500 text-white text-[10px] py-1 rounded shadow-sm font-bold text-center">拨号</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* New Appointment Awareness for Advisor */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-indigo-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><i className="fas fa-calendar-check text-indigo-500"></i>预约监控</h3>
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <p className="text-xs text-gray-400 italic">暂无预约</p>
              ) : (
                appointments.map(app => (
                  <div key={app.id} className={`p-2 rounded text-[10px] border ${app.status === 'CANCELLED' ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                    <p className="font-bold">{app.studentName}</p>
                    <p>{app.dateTime}</p>
                    <p className="font-bold mt-1">{app.status === 'CANCELLED' ? '● 预约已取消' : '● 预约进行中'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800">班级学生列表</h3></div>
          <div className="divide-y">
            {MOCK_STUDENTS.map((student) => {
              const mood = MOOD_CONFIG[student.lastMood];
              return (
                <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="relative"><img src={student.avatar} alt="" className="w-12 h-12 rounded-full" /><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${student.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div></div>
                  <div className="flex-1"><div className="flex items-center gap-2"><p className="font-bold text-gray-900">{student.name}</p><span className="text-[10px] text-gray-400">{student.college} | {student.class}</span></div><div className="flex items-center gap-3 mt-1"><span className={`text-[10px] px-2 py-0.5 rounded-full ${mood.bg} ${mood.color}`}>{mood.label}</span><span className="text-[10px] text-gray-400">学号: {student.id}</span></div></div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmCall({ name: student.name, phone: student.phone! })} className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition-all shadow-sm" title="拨打电话"><i className="fas fa-phone-alt text-sm"></i></button>
                    <button onClick={() => onSelectStudent(student)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="发送消息"><i className="fas fa-comment-dots text-sm"></i></button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {confirmCall && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-phone-alt text-xl"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认联系学生？</h3>
            <p className="text-sm text-gray-500 mb-6">即将拨打给：<span className="font-bold text-gray-800">{confirmCall.name}</span></p>
            <div className="flex gap-3"><button onClick={() => setConfirmCall(null)} className="flex-1 py-2 text-gray-500 font-bold text-sm">取消</button><button onClick={executeCall} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-100">确认拨打</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorView;
