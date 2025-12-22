
import React, { useState, useEffect } from 'react';
import { User, UserRole, Mood, Counselor, Appointment, HealthTag } from './types';
import Layout from './components/Layout';
import StudentView from './views/StudentView';
import CounselorView from './views/CounselorView';
import AdvisorView from './views/AdvisorView';
import AdminView from './views/AdminView';
import ChatWindow from './components/ChatWindow';
import ProfileEditor from './components/ProfileEditor';
import PasswordChangeModal from './components/PasswordChangeModal';
import { dataService } from './services/dataService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<{ target: any, isAI: boolean } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  
  const [dbData, setDbData] = useState({
    students: [] as User[],
    counselors: [] as User[],
    advisors: [] as User[]
  });

  const refreshGlobalData = () => {
    const db = dataService.getDb();
    setDbData({
      students: db.students || [],
      counselors: db.counselors || [],
      advisors: db.advisors || []
    });
    setAppointments(dataService.getAppointments());
    
    // 如果当前已登录，确保本地 user 状态同步最新的数据库状态（例如 HealthTag）
    if (user) {
      const allUsers = [...(db.students || []), ...(db.counselors || []), ...(db.advisors || []), ...(db.admins || [])];
      const latestUser = allUsers.find(u => u.id === user.id);
      if (latestUser && JSON.stringify(latestUser) !== JSON.stringify(user)) {
        setUser(latestUser);
      }
    }
  };

  useEffect(() => {
    dataService.init();
    refreshGlobalData();

    const handleSync = () => {
      refreshGlobalData();
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, [user?.id]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roleEl = document.getElementById('login-role-hidden') as HTMLSelectElement;
    const idEl = document.getElementById('login-id') as HTMLInputElement;
    const pwdEl = document.getElementById('login-password') as HTMLInputElement;

    if (!roleEl || !idEl || !pwdEl) return;

    const loginRole = roleEl.value as UserRole;
    const loginId = idEl.value;
    const loginPassword = pwdEl.value;

    const result = dataService.verifyLogin(loginId, loginPassword, loginRole);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      setNotification('登录成功');
      refreshGlobalData();
      
      const needsProfileUpdate = (result.user.role === UserRole.STUDENT || result.user.role === UserRole.COUNSELOR || result.user.role === UserRole.ADVISOR) && 
                                 (!result.user.phone || result.user.phone.length !== 11);
      if (needsProfileUpdate) setIsProfileModalOpen(true);
    } else {
      setNotification(result.error || '登录失败');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    dataService.updateUser(updatedUser);
    setUser(updatedUser);
    setIsProfileModalOpen(false);
    setNotification('个人资料已更新');
    refreshGlobalData();
  };

  const handleUpdateHealthTag = (tag: HealthTag) => {
    if (user) {
      const updatedUser = { ...user, healthTag: tag };
      dataService.updateUser(updatedUser); // 核心：同步到 localStorage "数据库"
      setUser(updatedUser);
      setNotification(`心理状态已同步：${tag}`);
      refreshGlobalData();
    }
  };

  const handleChangePassword = (newPassword: string) => {
    if (user) {
      const updatedUser = { ...user, password: newPassword };
      dataService.updateUser(updatedUser);
      setUser(updatedUser);
      setIsPasswordModalOpen(false);
      setNotification('密码修改成功');
    }
  };

  const handleBookAppointment = (c: Counselor, time: string, location: string) => {
    if (!user) return;
    const newApp: Appointment = {
      id: Date.now().toString(),
      studentId: user.id,
      studentName: user.name,
      studentAvatar: user.avatar,
      counselorId: c.id,
      counselorName: c.name,
      dateTime: time,
      location: location,
      status: 'PENDING', // 默认为申请中
      timestamp: Date.now()
    };
    dataService.saveAppointment(newApp);
    setNotification('预约申请已提交');
    refreshGlobalData();
  };

  const handleUpdateAppointmentStatus = (id: string, status: Appointment['status']) => {
    dataService.updateAppointmentStatus(id, status);
    setNotification('预约状态已更新');
    refreshGlobalData();
  };

  const handleUpdateAppointmentLocation = (id: string, location: string) => {
    dataService.updateAppointmentLocation(id, location);
    setNotification('预约地点已更新');
    refreshGlobalData();
  };

  // Guard: user must be authenticated and exists
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mx-auto mb-6">
              <i className="fas fa-heart-pulse text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">UniMind</h1>
            <p className="text-gray-400 text-sm mb-8">高校心理咨询服务系统</p>
            
            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase px-1">身份角色</label>
                  <select id="login-role-hidden" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                      <option value={UserRole.STUDENT}>我是学生</option>
                      <option value={UserRole.COUNSELOR}>我是咨询师</option>
                      <option value={UserRole.ADVISOR}>我是辅导员</option>
                      <option value={UserRole.ADMIN}>我是管理员</option>
                  </select>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase px-1">账号/学号/工号</label>
                  <input id="login-id" type="text" placeholder="请输入您的账号" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" required />
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase px-1">登录密码</label>
                  <div className="relative">
                    <input 
                      id="login-password" 
                      type={showLoginPwd ? "text" : "password"} 
                      placeholder="请输入您的密码" 
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm pr-12" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-indigo-600 transition-colors"
                    >
                      <i className={`fas ${showLoginPwd ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] mt-4">
                  立即登录
                </button>
            </form>
            {notification && <p className="mt-4 text-red-500 text-xs font-bold animate-pulse">{notification}</p>}
            
            <p className="mt-8 text-[10px] text-gray-300 text-center">
              首次登录请向各学院辅导员咨询初始账号信息
            </p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch(user.role) {
      case UserRole.ADMIN: return <AdminView user={user} onNotify={(msg) => { setNotification(msg); refreshGlobalData(); }} />;
      case UserRole.ADVISOR: return <AdvisorView user={user} appointments={appointments} students={dbData.students} onSelectStudent={(s) => setActiveChat({ target: s, isAI: false })} />;
      case UserRole.COUNSELOR: return (
        <CounselorView 
          user={user} 
          appointments={appointments} 
          students={dbData.students} 
          onSelectStudent={(s) => setActiveChat({ target: s, isAI: false })} 
          onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
          onUpdateAppointmentLocation={handleUpdateAppointmentLocation}
        />
      );
      case UserRole.STUDENT: return (
        <StudentView 
          user={user} 
          counselors={dbData.counselors}
          advisors={dbData.advisors}
          appointments={appointments} 
          onMoodLogged={() => setNotification('心情已记录')}
          onStartChat={(t) => {
            if (!t) return;
            if (t === 'AI') {
              setActiveChat({ 
                target: { id: 'AI', name: 'AI 心理助手', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AI' }, 
                isAI: true 
              });
            } else {
              setActiveChat({ target: t, isAI: false });
            }
          }}
          onBookAppointment={handleBookAppointment}
          onCancelAppointment={(id) => handleUpdateAppointmentStatus(id, 'CANCELLED')}
          onTriggerProfileEdit={() => setIsProfileModalOpen(true)}
          onUpdateHealthTag={handleUpdateHealthTag}
        />
      );
      default: return null;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} onEditProfile={() => setIsProfileModalOpen(true)} onEditPassword={() => setIsPasswordModalOpen(true)}>
      {renderView()}
      {activeChat && <ChatWindow currentUser={user} targetUser={activeChat.target} isAI={activeChat.isAI} onClose={() => setActiveChat(null)} />}
      {isProfileModalOpen && <ProfileEditor user={user} onSave={handleUpdateProfile} onCancel={() => setIsProfileModalOpen(false)} isMandatory={false} />}
      {isPasswordModalOpen && <PasswordChangeModal user={user} onSave={handleChangePassword} onCancel={() => setIsPasswordModalOpen(false)} />}
      {notification && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl z-[300] animate-bounce-in text-sm font-bold">
          {notification}
        </div>
      )}
    </Layout>
  );
};

export default App;
