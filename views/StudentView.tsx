
import React, { useState } from 'react';
import { Mood, Counselor, User, Appointment } from '../types';
import { MOOD_CONFIG, MOCK_COUNSELORS } from '../constants';

interface StudentViewProps {
  user: User;
  onMoodLogged: (mood: Mood) => void;
  onStartChat: (counselor: any | 'AI') => void;
  onBookAppointment: (counselor: Counselor, time: string) => void;
  onCancelAppointment: (appId: string) => void;
  appointments: Appointment[];
}

const StudentView: React.FC<StudentViewProps> = ({ user, onMoodLogged, onStartChat, onBookAppointment, onCancelAppointment, appointments }) => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  
  const [confirmBooking, setConfirmBooking] = useState<{ counselor: Counselor, time: string } | null>(null);
  const [confirmCall, setConfirmCall] = useState<{ name: string, phone: string } | null>(null);

  const MOCK_ADVISOR = { id: 'a1', name: '李辅导员', phone: '135-1234-5678', avatar: 'https://picsum.photos/id/1014/100/100' };

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    onMoodLogged(mood);
    if (mood === Mood.CRISIS) {
      setShowEmergency(true);
    }
  };

  const handleBookingConfirm = () => {
    if (confirmBooking) {
      onBookAppointment(confirmBooking.counselor, confirmBooking.time);
      setConfirmBooking(null);
    }
  };

  const executeCall = () => {
    if (confirmCall) {
      window.location.href = `tel:${confirmCall.phone}`;
      setConfirmCall(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">今天感觉如何？</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {(Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => {
            const config = MOOD_CONFIG[mood];
            const isSelected = selectedMood === mood;
            return (
              <button key={mood} onClick={() => handleMoodSelect(mood)} className={`flex flex-col items-center p-4 rounded-xl transition-all w-28 ${isSelected ? `${config.bg} ring-2 ring-indigo-500 shadow-lg shadow-indigo-100` : 'hover:bg-gray-50'}`}>
                <i className={`fas ${config.icon} text-3xl mb-2 ${config.color}`}></i>
                <span className={`text-xs font-medium ${isSelected ? config.color : 'text-gray-600'}`}>{config.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white/20 rounded-lg"><i className="fas fa-comments text-2xl"></i></div><h3 className="text-xl font-bold">在线倾诉</h3></div>
          <p className="text-indigo-100 text-sm mb-6">随时与 AI 助手或在线咨询师聊一聊，缓解压力。</p>
          <div className="flex gap-3">
            <button onClick={() => onStartChat('AI')} className="flex-1 bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors">AI 助手</button>
            <button onClick={() => onStartChat(MOCK_COUNSELORS[0])} className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold border border-indigo-400">在线老师</button>
          </div>
        </div>

        <div className="bg-teal-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white/20 rounded-lg"><i className="fas fa-user-tie text-2xl"></i></div><h3 className="text-xl font-bold">辅导员联系</h3></div>
          <p className="text-teal-100 text-sm mb-6">生活事务或紧急情况，可直接联系辅导员。</p>
          <div className="flex gap-3">
            <button onClick={() => onStartChat(MOCK_ADVISOR)} className="flex-1 bg-white text-teal-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-50">在线留言</button>
            <button onClick={() => setConfirmCall({ name: MOCK_ADVISOR.name, phone: MOCK_ADVISOR.phone })} className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold border border-teal-400">直接通话</button>
          </div>
        </div>

        <div className="bg-red-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white/20 rounded-lg"><i className="fas fa-phone-alt text-2xl"></i></div><h3 className="text-xl font-bold">紧急干预</h3></div>
          <p className="text-red-100 text-sm mb-6">如果您正处于极度痛苦中，请立即寻求专业帮助。</p>
          <button onClick={() => setShowEmergency(true)} className="w-full bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50">立即求助</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">线下预约咨询</h2>
          <div className="space-y-4">
            {MOCK_COUNSELORS.map((c) => (
              <div key={c.id} className="border rounded-xl p-4 bg-gray-50/30">
                <div className="flex items-center gap-3 mb-3">
                  <img src={c.avatar} alt={c.name} className="w-10 h-10 rounded-full" />
                  <div><h4 className="font-bold text-gray-900 text-sm">{c.name}</h4><p className="text-[10px] text-indigo-600 font-medium">{c.specialization}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.availability.map((time) => (
                    <button key={time} onClick={() => setConfirmBooking({ counselor: c, time })} className="px-3 py-1.5 text-[10px] bg-white hover:bg-indigo-600 hover:text-white rounded border border-gray-200 text-gray-700 transition-all">{time}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">我的预约记录</h2>
          {appointments.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><i className="far fa-calendar-alt text-4xl mb-3 block"></i><p className="text-sm">暂无预约，点击左侧选择时间</p></div>
          ) : (
            <div className="space-y-3">
              {appointments.map(app => (
                <div key={app.id} className={`flex items-center justify-between p-4 rounded-xl border animate-fade-in ${app.status === 'CANCELLED' ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-indigo-50/50 border-indigo-100'}`}>
                  <div>
                    <p className={`text-sm font-bold ${app.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{app.counselorName}</p>
                    <p className="text-xs text-gray-500">{app.dateTime}</p>
                    <span className={`text-[10px] font-bold uppercase ${app.status === 'CANCELLED' ? 'text-gray-400' : 'text-green-600'}`}>
                      {app.status === 'CANCELLED' ? '预约已取消' : '预约成功'}
                    </span>
                  </div>
                  {app.status !== 'CANCELLED' && (
                    <button onClick={() => onCancelAppointment(app.id)} className="text-xs text-red-500 hover:text-red-700 font-bold p-2">取消预约</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {confirmBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">确认预约信息</h3>
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <div className="flex items-center gap-3 mb-2"><img src={confirmBooking.counselor.avatar} className="w-8 h-8 rounded-full" alt="" /><span className="font-bold text-sm">{confirmBooking.counselor.name}</span></div>
              <p className="text-xs text-gray-600">预约时间：<span className="text-indigo-600 font-bold">{confirmBooking.time}</span></p>
            </div>
            <div className="flex gap-3"><button onClick={() => setConfirmBooking(null)} className="flex-1 py-2 text-gray-500 font-bold text-sm">再想想</button><button onClick={handleBookingConfirm} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100">确认预约</button></div>
          </div>
        </div>
      )}

      {confirmCall && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-phone-alt text-xl"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认拨打电话？</h3>
            <p className="text-sm text-gray-500 mb-6">即将拨打给：<span className="font-bold text-gray-800">{confirmCall.name}</span></p>
            <div className="flex gap-3"><button onClick={() => setConfirmCall(null)} className="flex-1 py-2 text-gray-500 font-bold text-sm">取消</button><button onClick={executeCall} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-100">确认拨打</button></div>
          </div>
        </div>
      )}

      {showEmergency && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><i className="fas fa-exclamation-triangle text-2xl"></i></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">我们需要帮助您</h2>
            <p className="text-sm text-gray-500 mb-8">请立即拨打下方的紧急联系人电话，我们的老师 24 小时待命。</p>
            <div className="space-y-3">
              {[MOCK_ADVISOR, ...MOCK_COUNSELORS].map(person => (
                <button key={person.id} onClick={() => setConfirmCall({ name: person.name, phone: person.phone })} className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                  <div className="flex items-center gap-3"><img src={person.avatar} className="w-10 h-10 rounded-full" alt="" /><div className="text-left"><p className="font-bold text-red-900 text-sm">{person.name}</p></div></div>
                  <div className="bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"><i className="fas fa-phone-alt text-xs"></i></div>
                </button>
              ))}
              <button onClick={() => setShowEmergency(false)} className="w-full py-2 text-gray-400 text-sm font-bold mt-4">关闭窗口</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
