
import React, { useState, useMemo, useEffect } from 'react';
import { Mood, Counselor, User, Appointment, HealthTag } from '../types';
import { MOOD_CONFIG } from '../constants';
import UserInfoModal from '../components/UserInfoModal';
import PsychologicalTest from '../components/PsychologicalTest';
import { dataService } from '../services/dataService';

interface StudentViewProps {
  user: User;
  counselors: User[];
  advisors: User[];
  onMoodLogged: (mood: Mood) => void;
  onStartChat: (target: any | 'AI') => void;
  onBookAppointment: (counselor: Counselor, time: string, location: string) => void;
  onCancelAppointment: (appId: string) => void;
  onTriggerProfileEdit: () => void;
  onUpdateHealthTag: (tag: HealthTag) => void;
  appointments: Appointment[];
}

const LOCATIONS = [
  "心理咨询中心 301 室",
  "心理咨询中心 302 室",
  "学生社区心悦空间",
  "体育馆二楼疏泄室"
];

const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00"
];

const StudentView: React.FC<StudentViewProps> = ({ 
  user, 
  counselors, 
  advisors, 
  onMoodLogged, 
  onStartChat, 
  onBookAppointment, 
  onCancelAppointment, 
  onTriggerProfileEdit, 
  onUpdateHealthTag,
  appointments 
}) => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showTest, setShowTest] = useState(false);
  const [showCounselorPicker, setShowCounselorPicker] = useState(false);
  const [lastSync, setLastSync] = useState(Date.now());
  
  const [bookingStep, setBookingStep] = useState<{ counselor: Counselor, time?: string, location?: string } | null>(null);
  const [confirmCall, setConfirmCall] = useState<{ name: string, phone: string } | null>(null);

  // 实时监听消息状态变动
  useEffect(() => {
    const handleSync = () => setLastSync(Date.now());
    window.addEventListener('storage', handleSync);
    const itv = setInterval(handleSync, 2000);
    return () => {
      window.removeEventListener('storage', handleSync);
      clearInterval(itv);
    };
  }, []);

  const assignedAdvisor = useMemo(() => {
    return advisors.find(a => a.college === user.college) || advisors[0];
  }, [advisors, user.college]);

  // 判断是否有来自任何咨询师的未读消息
  const hasCounselorUnread = useMemo(() => {
    return counselors.some(c => dataService.hasUnreadMessages(user.id, c.id));
  }, [counselors, user.id, lastSync]);

  // 判断是否有来自辅导员的未读消息
  const hasAdvisorUnread = useMemo(() => {
    return assignedAdvisor ? dataService.hasUnreadMessages(user.id, assignedAdvisor.id) : false;
  }, [assignedAdvisor, user.id, lastSync]);

  const isPhoneInvalid = !user.phone || user.phone.length !== 11;

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    onMoodLogged(mood);
    if (mood === Mood.CRISIS) setShowEmergency(true);
  };

  const handleTestComplete = (tag: HealthTag) => {
    onUpdateHealthTag(tag);
    setShowTest(false);
  };

  const handleStartChat = (target: any) => {
    if (target !== 'AI' && target.id) {
      dataService.markMessagesAsRead(user.id, target.id);
    }
    onStartChat(target);
  };

  const getTagStyle = (tag?: HealthTag) => {
    switch (tag) {
      case '不健康': return 'bg-red-500 text-white shadow-red-100';
      case '亚健康': return 'bg-yellow-500 text-white shadow-yellow-100';
      default: return 'bg-green-500 text-white shadow-green-100';
    }
  };

  const handleDismissLocationUpdate = (appId: string) => {
    dataService.dismissLocationNotification(appId);
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* 顶部个人状态摘要 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl font-bold shadow-lg ${getTagStyle(user.healthTag)}`}>
              状态: {user.healthTag || '待测评'}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">心理健康评分</p>
              <p className="text-xs text-gray-500">点击右侧按钮进行定期自我测评</p>
            </div>
          </div>
          <button 
            onClick={() => setShowTest(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            开始测评
          </button>
        </div>
      </div>

      {isPhoneInvalid && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"><i className="fas fa-phone-slash"></i></div>
            <div>
              <p className="text-sm font-bold text-amber-900">请完善您的手机号码</p>
              <p className="text-[10px] text-amber-700">为了能在紧急情况下及时联系到您，请绑定11位手机号。</p>
            </div>
          </div>
          <button onClick={onTriggerProfileEdit} className="bg-amber-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-amber-700 shadow-sm">立即完善</button>
        </div>
      )}

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
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white relative">
          {hasCounselorUnread && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-bold bg-red-500 px-1.5 py-0.5 rounded">新消息</span>
            </div>
          )}
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white/20 rounded-lg"><i className="fas fa-comments text-2xl"></i></div><h3 className="text-xl font-bold">在线倾诉</h3></div>
          <p className="text-indigo-100 text-sm mb-6">随时与 AI 助手或在线咨询师聊一聊，缓解压力。</p>
          <div className="flex gap-3">
            <button onClick={() => handleStartChat('AI')} className="flex-1 bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50">AI 助手</button>
            <button onClick={() => setShowCounselorPicker(true)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold border ${hasCounselorUnread ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-indigo-500 text-white border-indigo-400'}`}>在线老师</button>
          </div>
        </div>

        <div className="bg-teal-600 p-6 rounded-2xl shadow-lg text-white relative">
          {hasAdvisorUnread && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-bold bg-red-500 px-1.5 py-0.5 rounded">待查看</span>
            </div>
          )}
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white/20 rounded-lg"><i className="fas fa-user-tie text-2xl"></i></div><h3 className="text-xl font-bold">辅导员联系</h3></div>
          <p className="text-teal-100 text-sm mb-6">生活事务或紧急情况，可直接联系辅导员。</p>
          <div className="flex gap-3">
            {assignedAdvisor && (
              <>
                <button onClick={() => handleStartChat(assignedAdvisor)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${hasAdvisorUnread ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-teal-600 hover:bg-teal-50'}`}>留言</button>
                <button onClick={() => setConfirmCall({ name: assignedAdvisor.name, phone: assignedAdvisor.phone! })} className="flex-1 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold border border-teal-400">通话</button>
              </>
            )}
          </div>
        </div>

        <div className="bg-red-500 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-white/20 rounded-lg"><i className="fas fa-phone-alt text-2xl"></i></div><h3 className="text-xl font-bold">紧急干预</h3></div>
          <p className="text-red-100 text-sm mb-6">如果您正感到绝望或想伤害自己，请立即寻求专业帮助。</p>
          <button onClick={() => setShowEmergency(true)} className="w-full bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50">立即求助</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">线下预约咨询</h2>
          <div className="space-y-4">
            {counselors.map((c) => (
              <div key={c.id} className="border rounded-xl p-4 bg-gray-50/30">
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={() => setViewingUser(c)} className="focus:outline-none hover:scale-105 transition-transform">
                    <img src={c.avatar} alt={c.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h4 className="font-bold text-gray-900 text-sm">{c.name}</h4><span className={`text-[10px] font-bold px-1.5 rounded-full ${c.gender === '女' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>{c.gender || '男'}</span></div>
                    <p className="text-[10px] text-indigo-600 font-medium">{(c as any).specialization || '全能心理咨询师'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setBookingStep({ counselor: c as any })}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  立即申请线下预约
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">我的预约记录 (最多10条)</h2>
          {appointments.length === 0 ? (
            <div className="text-center py-10 text-gray-400"><i className="far fa-calendar-alt text-4xl mb-3 block"></i><p className="text-sm">暂无预约记录</p></div>
          ) : (
            <div className="space-y-3">
              {appointments.filter(a => a.studentId === user.id).map(app => (
                <div key={app.id} className={`p-4 rounded-xl border animate-fade-in relative transition-all ${app.status === 'CANCELLED' ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-indigo-50/50 border-indigo-100'}`}>
                  {app.locationUpdated && (
                    <div className="mb-3 flex items-center justify-between bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg animate-fade-in">
                      <div className="flex items-center gap-2 text-left">
                        <i className="fas fa-info-circle text-amber-500 text-xs shrink-0"></i>
                        <span className="text-[10px] text-amber-800 font-bold">咨询老师已修改了预约地点</span>
                      </div>
                      <button onClick={() => handleDismissLocationUpdate(app.id)} className="text-amber-400 hover:text-amber-600 transition-colors">
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm font-bold ${app.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{app.counselorName}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">{app.dateTime}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${app.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' : app.status === 'CANCELLED' ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                      {app.status === 'CONFIRMED' ? '已确认' : app.status === 'CANCELLED' ? '已取消' : '申请中'}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-indigo-600 flex items-center gap-1 font-bold">
                    <i className="fas fa-location-dot"></i> {app.location}
                  </div>
                  {app.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => onCancelAppointment(app.id)} 
                      className="mt-3 text-[10px] text-red-500 font-bold hover:underline"
                    >
                      取消预约
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showTest && <PsychologicalTest onCancel={() => setShowTest(false)} onComplete={handleTestComplete} />}
      {viewingUser && <UserInfoModal target={viewingUser} onClose={() => setViewingUser(null)} />}
      
      {/* 预约详细步骤选择 */}
      {bookingStep && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">完善预约信息</h3>
            <p className="text-xs text-gray-400 mb-6 text-left">正在向 <span className="text-indigo-600 font-bold">{bookingStep.counselor.name}</span> 发起线下咨询申请</p>
            
            <div className="space-y-6 text-left">
              {/* 地点选择 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">选择预约地点</label>
                <div className="grid grid-cols-1 gap-2">
                  {LOCATIONS.map(loc => (
                    <button 
                      key={loc}
                      onClick={() => setBookingStep({ ...bookingStep, location: loc })}
                      className={`text-sm py-3 px-4 rounded-xl border text-left transition-all font-medium ${bookingStep.location === loc ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold ring-2 ring-indigo-100' : 'border-gray-100 hover:bg-gray-50 text-gray-600'}`}
                    >
                      <i className={`fas fa-location-dot mr-2 ${bookingStep.location === loc ? 'text-indigo-500' : 'text-gray-300'}`}></i>
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* 时间段选择 */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">选择预约时间</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map(time => (
                    <button 
                      key={time}
                      onClick={() => setBookingStep({ ...bookingStep, time: time })}
                      className={`text-[11px] py-2 px-3 rounded-lg border transition-all font-bold ${bookingStep.time === time ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-gray-100 hover:bg-gray-50 text-gray-500'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setBookingStep(null)} 
                className="flex-1 py-3 text-gray-400 font-bold text-sm"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  if (bookingStep.time && bookingStep.location) {
                    onBookAppointment(bookingStep.counselor, bookingStep.time, bookingStep.location);
                    setBookingStep(null);
                  }
                }}
                disabled={!bookingStep.time || !bookingStep.location}
                className="flex-2 bg-indigo-600 text-white py-3 px-8 rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                提交预约申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 咨询师选择弹窗 */}
      {showCounselorPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">选择在线老师</h3>
                <button onClick={() => setShowCounselorPicker(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-times"></i></button>
             </div>
             <p className="text-sm text-gray-500 mb-6 text-left">请从以下在线咨询师中选择一位开启实时对话：</p>
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {counselors.map(c => {
                  const unread = dataService.hasUnreadMessages(user.id, c.id);
                  return (
                    <button 
                      key={c.id} 
                      onClick={() => { handleStartChat(c); setShowCounselorPicker(false); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${unread ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-gray-50/50 border-gray-100 hover:bg-indigo-50 hover:border-indigo-200'}`}
                    >
                      <div className="relative">
                        <img src={c.avatar} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="" />
                        {unread && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{c.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 rounded-full ${c.gender === '女' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>{c.gender}</span>
                        </div>
                        <p className="text-xs text-indigo-600 mt-1">{(c as any).specialization || '资深心理咨询专家'}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${unread ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-indigo-600 border border-gray-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white'}`}>
                        <i className={`fas ${unread ? 'fa-bell' : 'fa-chevron-right'} text-xs`}></i>
                      </div>
                    </button>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {confirmCall && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-phone-alt text-xl"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认拨打电话？</h3>
            <p className="text-sm text-gray-500 mb-6">即将拨打给：<span className="font-bold text-gray-800">{confirmCall.name}</span></p>
            <div className="flex gap-3"><button onClick={() => setConfirmCall(null)} className="flex-1 py-2 text-gray-500 font-bold text-sm">取消</button><button onClick={() => { window.location.href = `tel:${confirmCall.phone}`; setConfirmCall(null); }} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-100">确认拨打</button></div>
          </div>
        </div>
      )}

      {showEmergency && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><i className="fas fa-exclamation-triangle text-2xl"></i></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">紧急救助中心</h2>
            <p className="text-sm text-gray-500 mb-8 px-4 font-bold text-red-600">系统已锁定：此类突发状况将由您的直属辅导员第一时间接听并处理。</p>
            <div className="space-y-3">
              {[assignedAdvisor].filter(Boolean).map(person => (
                <button key={person!.id} onClick={() => setConfirmCall({ name: person!.name, phone: person!.phone! })} className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors border border-red-100 group">
                  <div className="flex items-center gap-3 text-left">
                    <img src={person!.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                    <div className="text-left">
                       <p className="font-bold text-red-900 text-sm">{person!.name}</p>
                       <p className="text-[10px] text-red-400">所属学院辅导员</p>
                    </div>
                  </div>
                  <div className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"><i className="fas fa-phone-alt text-xs"></i></div>
                </button>
              ))}
              <button onClick={() => setShowEmergency(false)} className="w-full py-2 text-gray-400 text-sm font-bold mt-4 hover:text-gray-600">关闭窗口</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentView;
