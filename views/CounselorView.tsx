
import React, { useState } from 'react';
import { User, Mood, MoodRecord, UserRole, Appointment } from '../types';
import { MOOD_CONFIG } from '../constants';

interface StudentProfile extends User {
  lastMood: Mood;
  moodTimestamp: number;
}

interface CounselorViewProps {
  user: User;
  onSelectStudent: (student: StudentProfile) => void;
  appointments: Appointment[];
}

const MOCK_STUDENTS: StudentProfile[] = [
  { id: 's1', name: '王小明', role: UserRole.STUDENT, avatar: 'https://picsum.photos/id/1012/100/100', lastMood: Mood.CRISIS, moodTimestamp: Date.now() - 3600000, isOnline: true },
  { id: 's2', name: '李华', role: UserRole.STUDENT, avatar: 'https://picsum.photos/id/1013/100/100', lastMood: Mood.SAD, moodTimestamp: Date.now() - 86400000, isOnline: false },
  { id: 's3', name: '张悦', role: UserRole.STUDENT, avatar: 'https://picsum.photos/id/1014/100/100', lastMood: Mood.NEUTRAL, moodTimestamp: Date.now() - 172800000, isOnline: true },
  { id: 's4', name: '赵强', role: UserRole.STUDENT, avatar: 'https://picsum.photos/id/1015/100/100', lastMood: Mood.EXCELLENT, moodTimestamp: Date.now() - 5000000, isOnline: false }
];

const CounselorView: React.FC<CounselorViewProps> = ({ user, onSelectStudent, appointments }) => {
  const highRiskStudents = MOCK_STUDENTS.filter(s => s.lastMood === Mood.CRISIS || s.lastMood === Mood.SAD);

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="bg-red-50 border border-red-100 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center animate-pulse"><i className="fas fa-bell"></i></div><h2 className="text-xl font-bold text-red-900">重点关注学生 ({highRiskStudents.length})</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {highRiskStudents.map((student) => {
            const moodConfig = MOOD_CONFIG[student.lastMood];
            return (
              <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative"><img src={student.avatar} alt="" className="w-14 h-14 rounded-full border-2 border-red-50" /><div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${student.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div></div>
                  <div className="flex-1"><h4 className="font-bold text-gray-900">{student.name}</h4><div className={`text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${moodConfig.bg} ${moodConfig.color}`}><i className={`fas ${moodConfig.icon}`}></i>{moodConfig.label}</div></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[10px] text-gray-400">最后更新: {new Date(student.moodTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <button onClick={() => onSelectStudent(student)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5 font-bold"><i className="fas fa-comment-medical"></i>发起访谈</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800">全部咨询学生</h3><span className="text-xs text-gray-500">共 {MOCK_STUDENTS.length} 位学生</span></div>
            <div className="divide-y">
              {MOCK_STUDENTS.map((student) => {
                 const moodConfig = MOOD_CONFIG[student.lastMood];
                 return (
                  <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group">
                    <div className="relative"><img src={student.avatar} alt="" className="w-12 h-12 rounded-full" /><div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${student.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></div></div>
                    <div className="flex-1"><div className="flex items-center gap-2"><p className="font-medium text-gray-900">{student.name}</p>{!student.isOnline && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 rounded">不在线</span>}</div><p className="text-xs text-gray-400">点击右侧发起访谈会话</p></div>
                    <div className="flex items-center gap-4">
                      <div className={`flex flex-col items-end`}><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${moodConfig.bg} ${moodConfig.color}`}>{moodConfig.label}</span></div>
                      <button onClick={() => onSelectStudent(student)} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold">发起访谈</button>
                    </div>
                  </div>
                 );
              })}
            </div>
          </div>
          
          {/* New Appointment List Section for Counselor */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50"><h3 className="font-bold text-gray-800">近期咨询预约</h3></div>
            <div className="divide-y">
              {appointments.length === 0 ? (
                <div className="p-10 text-center text-gray-400 text-sm">暂无预约信息</div>
              ) : (
                appointments.map(app => (
                  <div key={app.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className={`font-bold text-sm ${app.status === 'CANCELLED' ? 'text-gray-400' : 'text-gray-900'}`}>{app.studentName}</p>
                      <p className="text-xs text-gray-500">{app.dateTime}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${app.status === 'CANCELLED' ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                      {app.status === 'CANCELLED' ? '预约已取消' : '已确认'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg"><h3 className="text-lg font-bold mb-4">访谈状态统计</h3><div className="space-y-3"><div className="flex justify-between items-center text-sm"><span className="text-indigo-100">当前在线学生</span><span className="font-bold bg-green-500/20 text-green-100 px-2 rounded">2</span></div><div className="flex justify-between items-center text-sm"><span className="text-indigo-100">今日访谈人次</span><span className="font-bold">12</span></div><div className="flex justify-between items-center text-sm"><span className="text-indigo-100">待回复留言</span><span className="font-bold text-orange-200">3</span></div></div></div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-gray-800 mb-4">操作指南</h3><ul className="text-xs text-gray-500 space-y-3"><li className="flex gap-2"><i className="fas fa-info-circle text-indigo-400 mt-0.5"></i>点击“发起访谈”可直接与在线学生进行实时沟通。</li><li className="flex gap-2"><i className="fas fa-info-circle text-indigo-400 mt-0.5"></i>若学生不在线，您发送的消息将作为留言。</li><li className="flex gap-2"><i className="fas fa-info-circle text-indigo-400 mt-0.5"></i>预约记录中，若学生主动取消，状态会自动更新。</li></ul></div>
        </section>
      </div>
    </div>
  );
};

export default CounselorView;
