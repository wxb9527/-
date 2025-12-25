
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, Appointment, HealthTag, Mood } from './types';
import Layout from './components/Layout';
import StudentView from './views/StudentView';
import CounselorView from './views/CounselorView';
import AdminView from './views/AdminView';
import AdvisorView from './views/AdvisorView';
import ChatWindow from './components/ChatWindow';
import ProfileEditor from './components/ProfileEditor';
import PasswordChangeModal from './components/PasswordChangeModal';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<{ target: any, isAI: boolean } | null>(null);
  const [notification, setNotification] = useState<{ text: string, sender?: User } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  
  const lastMsgIdRef = useRef<string | null>(null);

  const [dbData, setDbData] = useState({
    students: [] as User[],
    counselors: [] as User[],
    advisors: [] as User[]
  });

  const refreshGlobalData = useCallback(() => {
    const db = dataService.getDb();
    setDbData({
      students: [...(db.students || [])],
      counselors: [...(db.counselors || [])],
      advisors: [...(db.advisors || [])]
    });
    setAppointments([...dataService.getAppointments()]);
    
    if (user && user.role !== UserRole.ADMIN) {
      const allUsers = [...(db.students || []), ...(db.counselors || []), ...(db.advisors || [])];
      const latestSelf = allUsers.find(u => u.id === user.id);
      if (latestSelf && (latestSelf.healthTag !== user.healthTag || latestSelf.college !== user.college)) {
        setUser(prev => prev ? { ...prev, ...latestSelf } : latestSelf);
      }
    }

    if (user) {
      const allMsgs = JSON.parse(localStorage.getItem('unimind_chat_history') || '[]');
      if (allMsgs.length > 0) {
        const latestMsg = allMsgs[allMsgs.length - 1];
        if (latestMsg.id !== lastMsgIdRef.current) {
          if (latestMsg.receiverId === user.id && latestMsg.senderId !== user.id) {
            const sender = [...db.students, ...db.counselors, ...db.advisors].find(u => u.id === latestMsg.senderId);
            setNotification({ 
              text: `来自 ${sender?.name || '用户'} 的新消息: "${latestMsg.text.substring(0, 15)}..."`,
              sender: sender
            });
          }
          lastMsgIdRef.current = latestMsg.id;
        }
      }
    }
  }, [user]);

  useEffect(() => {
    dataService.init();
    refreshGlobalData();
    window.addEventListener('storage', refreshGlobalData);
    const pollInterval = setInterval(refreshGlobalData, 1000); 
    return () => {
      window.removeEventListener('storage', refreshGlobalData);
      clearInterval(pollInterval);
    };
  }, [refreshGlobalData]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleEl = document.getElementById('login-role') as HTMLSelectElement;
    const idEl = document.getElementById('login-id') as HTMLInputElement;
    const pwdEl = document.getElementById('login-password') as HTMLInputElement;

    const result = dataService.verifyLogin(idEl.value, pwdEl.value, roleEl.value as UserRole);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      setNotification({ text: '登录成功' });
      refreshGlobalData();
    } else {
      setNotification({ text: result.error || '登录失败' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveChat(null);
  };

  const handleUpdateHealthTag = (tag: HealthTag) => {
    if (user) {
      const updatedUser = { ...user, healthTag: tag };
      dataService.updateUser(updatedUser);
      setUser(updatedUser);
      setNotification({ text: `您的状态已更新：${tag}` });
      refreshGlobalData(); 
    }
  };

  const handleMoodLogged = (mood: Mood) => {
    if (user) {
      dataService.saveMoodRecord({
        id: Date.now().toString(),
        studentId: user.id,
        mood: mood,
        timestamp: Date.now()
      });
      setNotification({ text: '心情已记录，管理老师已收到反馈' });
      refreshGlobalData();
    }
  };

  const handleUpdateAppointmentStatus = (id: string, status: Appointment['status']) => {
    dataService.updateAppointmentStatus(id, status);
    setNotification({ text: '预约状态已更新' });
    refreshGlobalData();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#fff5f7]">
        {/* 背景图层：樱花风景 */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center animate-subtle-zoom"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=2000")',
            filter: 'saturate(1.1)'
          }}
        ></div>
        
        {/* 樱粉色渐变遮罩 */}
        <div className="absolute inset-0 z-1 bg-gradient-to-br from-rose-100/30 via-transparent to-pink-200/20"></div>

        {/* 登录卡片 */}
        <div className="relative z-10 bg-white/20 backdrop-blur-3xl rounded-[50px] shadow-[0_40px_100px_rgba(255,182,193,0.3)] p-12 max-w-md w-full animate-bounce-in border border-white/50">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl flex items-center justify-center text-white shadow-xl mx-auto mb-8 transform hover:rotate-6 transition-transform">
              <i className="fas fa-heart-pulse text-4xl"></i>
            </div>
            
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-rose-900 tracking-tighter mb-1">UniMind</h1>
              <div className="h-1 w-10 bg-rose-400 mx-auto rounded-full mb-3"></div>
              <p className="text-rose-700 text-xs font-bold tracking-widest uppercase opacity-80">心如樱花 · 温暖而生</p>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
                <div className="group">
                  <label className="block text-[10px] font-black text-rose-800/60 mb-1.5 uppercase px-2 tracking-widest group-focus-within:text-rose-600">身份角色</label>
                  <div className="relative">
                    <select id="login-role" className="w-full p-4 bg-white/40 border-2 border-transparent rounded-2xl outline-none focus:border-rose-300 focus:bg-white/60 text-sm appearance-none cursor-pointer transition-all font-bold text-rose-900 shadow-sm">
                        <option value={UserRole.STUDENT}>👨‍🎓 同学</option>
                        <option value={UserRole.COUNSELOR}>👩‍🏫 咨询老师</option>
                        <option value={UserRole.ADVISOR}>📋 辅导员</option>
                        <option value={UserRole.ADMIN}>⚙️ 管理员</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none text-xs"></i>
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-[10px] font-black text-rose-800/60 mb-1.5 uppercase px-2 tracking-widest group-focus-within:text-rose-600">账号/学号</label>
                  <div className="relative">
                    <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 group-focus-within:text-rose-500 transition-colors"></i>
                    <input id="login-id" type="text" placeholder="输入您的唯一标识" className="w-full p-4 pl-12 bg-white/40 border-2 border-transparent rounded-2xl outline-none focus:border-rose-300 focus:bg-white/60 text-sm transition-all font-bold placeholder:text-rose-200 text-rose-900 shadow-sm" required />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-[10px] font-black text-rose-800/60 mb-1.5 uppercase px-2 tracking-widest group-focus-within:text-rose-600">登录密码</label>
                  <div className="relative">
                    <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-rose-300 group-focus-within:text-rose-500 transition-colors"></i>
                    <input id="login-password" type={showLoginPwd ? "text" : "password"} placeholder="输入您的安全密码" className="w-full p-4 pl-12 bg-white/40 border-2 border-transparent rounded-2xl outline-none focus:border-rose-300 focus:bg-white/60 text-sm pr-12 transition-all font-bold placeholder:text-rose-200 text-rose-900 shadow-sm" required />
                    <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors">
                      <i className={`fas ${showLoginPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                
                <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-4 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(244,63,94,0.3)] mt-4">
                  立即开启心灵之旅
                </button>
            </form>
            
            {notification && (
              <div className="mt-6 flex items-center justify-center gap-2 text-rose-600 text-xs font-black animate-shake">
                <i className="fas fa-circle-exclamation"></i>
                {notification.text}
              </div>
            )}
        </div>
        
        {/* 页脚装饰 */}
        <div className="absolute bottom-10 z-1 text-rose-900/40 text-[10px] font-bold tracking-[0.2em] uppercase">
          University Mental Health Platform · Sakura Edition
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} onEditProfile={() => setIsProfileModalOpen(true)} onEditPassword={() => setIsPasswordModalOpen(true)}>
      <div className="animate-fade-in">
        {user.role === UserRole.STUDENT && (
          <StudentView 
            user={user} 
            counselors={dbData.counselors}
            advisors={dbData.advisors}
            appointments={appointments}
            onMoodLogged={handleMoodLogged}
            onStartChat={(t) => setActiveChat({ target: t === 'AI' ? { id: 'AI', name: 'AI 心理助手', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AI' } : t, isAI: t === 'AI' })}
            onBookAppointment={(c, t, l) => {
               const newApp: Appointment = { id: Date.now().toString(), studentId: user.id, studentName: user.name, studentAvatar: user.avatar, counselorId: c.id, counselorName: c.name, dateTime: t, location: l, status: 'PENDING', timestamp: Date.now() };
               dataService.saveAppointment(newApp);
               setNotification({ text: '预约已提交' });
               refreshGlobalData();
            }}
            onCancelAppointment={(id) => handleUpdateAppointmentStatus(id, 'CANCELLED')}
            onTriggerProfileEdit={() => setIsProfileModalOpen(true)}
            onUpdateHealthTag={handleUpdateHealthTag}
          />
        )}
        {user.role === UserRole.COUNSELOR && (
          <CounselorView 
            user={user} 
            students={dbData.students} 
            appointments={appointments}
            onSelectStudent={(s) => setActiveChat({ target: s, isAI: false })}
            onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            onUpdateAppointmentLocation={(id, loc) => {
              dataService.updateAppointmentLocation(id, loc);
              setNotification({ text: '地点已修改' });
              refreshGlobalData();
            }}
          />
        )}
        {user.role === UserRole.ADMIN && <AdminView user={user} onNotify={(msg) => { setNotification({ text: msg }); refreshGlobalData(); }} />}
        {user.role === UserRole.ADVISOR && (
          <AdvisorView 
            user={user} 
            students={dbData.students} 
            appointments={appointments} 
            onSelectStudent={(s) => setActiveChat({ target: s, isAI: false })} 
          />
        )}
      </div>

      {activeChat && <ChatWindow currentUser={user} targetUser={activeChat.target} isAI={activeChat.isAI} onClose={() => setActiveChat(null)} />}
      {isProfileModalOpen && (
        <ProfileEditor 
          user={user} 
          onSave={(u) => { dataService.updateUser(u); setUser(u); setIsProfileModalOpen(false); setNotification({ text: '资料已更新' }); refreshGlobalData(); }} 
          onCancel={() => setIsProfileModalOpen(false)} 
        />
      )}
      {isPasswordModalOpen && (
        <PasswordChangeModal 
          user={user} 
          onSave={(p) => { const u = {...user, password: p}; dataService.updateUser(u); setUser(u); setIsPasswordModalOpen(false); setNotification({ text: '密码已修改' }); refreshGlobalData(); }} 
          onCancel={() => setIsPasswordModalOpen(false)} 
        />
      )}
      
      {notification && (
        <div 
          onClick={() => { 
            if(notification.sender) {
              dataService.markMessagesAsRead(user.id, notification.sender.id);
              setActiveChat({ target: notification.sender, isAI: false }); 
            }
            setNotification(null); 
          }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-8 py-3 rounded-2xl shadow-2xl z-[300] animate-bounce-in text-sm font-bold border border-white/10 flex items-center gap-3 transition-transform hover:scale-105 ${notification.sender ? 'cursor-pointer' : ''}`}
        >
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
          {notification.text}
          {notification.sender && <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded-lg ml-2">点击回复</span>}
        </div>
      )}
    </Layout>
  );
};

export default App;
