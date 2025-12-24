import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, Appointment, HealthTag } from './types';
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

    // 增强消息推送逻辑：不论是谁发给当前用户的，都要提醒
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

  const handleUpdateAppointmentStatus = (id: string, status: Appointment['status']) => {
    dataService.updateAppointmentStatus(id, status);
    setNotification({ text: '预约状态已更新' });
    refreshGlobalData();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full animate-fade-in border border-slate-100">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg mx-auto mb-6">
              <i className="fas fa-heart-pulse text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold mb-1 text-slate-900">UniMind</h1>
            <p className="text-slate-400 text-sm mb-8">高校心理健康智慧服务平台</p>
            
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase px-1">身份角色</label>
                  <select id="login-role" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none">
                      <option value={UserRole.STUDENT}>学生</option>
                      <option value={UserRole.COUNSELOR}>咨询师</option>
                      <option value={UserRole.ADVISOR}>辅导员</option>
                      <option value={UserRole.ADMIN}>管理员</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase px-1">账号/学号</label>
                  <input id="login-id" type="text" placeholder="请输入账号" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase px-1">登录密码</label>
                  <div className="relative">
                    <input id="login-password" type={showLoginPwd ? "text" : "password"} placeholder="请输入密码" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm pr-12" required />
                    <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-600">
                      <i className={`fas ${showLoginPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg mt-4">进入系统</button>
            </form>
            {notification && <p className="mt-4 text-red-500 text-xs font-bold animate-pulse">{notification.text}</p>}
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
            onMoodLogged={() => setNotification({ text: '心情已记录' })}
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
              // 点击通知时立即标记为已读
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