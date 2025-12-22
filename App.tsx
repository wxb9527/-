
import React, { useState, useEffect } from 'react';
import { User, UserRole, Mood, Counselor, Appointment } from './types';
import Layout from './components/Layout';
import StudentView from './views/StudentView';
import CounselorView from './views/CounselorView';
import AdvisorView from './views/AdvisorView';
import ChatWindow from './components/ChatWindow';
import ProfileEditor from './components/ProfileEditor';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeChat, setActiveChat] = useState<{ target: any, isAI: boolean } | null>(null);
  const [lastMood, setLastMood] = useState<Mood | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [counselorMessageAlert, setCounselorMessageAlert] = useState<{ counselorName: string, id: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Centralized Appointment State
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Login Form State
  const [loginRole, setLoginRole] = useState<UserRole | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginName, setLoginName] = useState('');

  // Auto-clear notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const isProfileComplete = (u: User) => {
    if (u.role === UserRole.STUDENT) {
      return !!(u.phone && u.college && u.class);
    }
    return !!u.phone;
  };

  useEffect(() => {
    if (isAuthenticated && user && !isProfileComplete(user)) {
      setNotification('请尽快完善个人联系信息，以便紧急联络');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === UserRole.STUDENT && !activeChat) {
      const timer = setTimeout(() => {
        setCounselorMessageAlert({ counselorName: '张老师', id: 'c1' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.role, activeChat]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginName.trim()) {
      setNotification('请填写完整的登录信息');
      return;
    }

    const mockUser: User = {
      id: loginId,
      name: loginName,
      role: loginRole!,
      isOnline: true,
      avatar: loginRole === UserRole.STUDENT 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${loginId}` 
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${loginId}`
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    setNotification('欢迎回来，' + loginName);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveChat(null);
    setLoginRole(null);
    setLoginId('');
    setLoginName('');
    setCounselorMessageAlert(null);
  };

  const handleStartInterview = (counselorId: string, name: string) => {
    setActiveChat({ 
      target: { id: counselorId, name, avatar: 'https://picsum.photos/id/1011/200/200' }, 
      isAI: false 
    });
    setCounselorMessageAlert(null);
  };

  const handleAddAppointment = (counselor: Counselor, time: string) => {
    const newApp: Appointment = {
      id: Date.now().toString(),
      studentId: user!.id,
      studentName: user!.name,
      counselorId: counselor.id,
      counselorName: counselor.name,
      dateTime: time,
      status: 'CONFIRMED'
    };
    setAppointments(prev => [newApp, ...prev]);
    setNotification(`预约成功: ${time}`);
  };

  const handleCancelAppointment = (appId: string) => {
    setAppointments(prev => prev.map(app => 
      app.id === appId ? { ...app, status: 'CANCELLED' } : app
    ));
    setNotification('预约已取消');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-fade-in overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
              <i className="fas fa-heart-pulse text-3xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">UniMind</h1>
            <p className="text-gray-500 text-sm">全方位心理健康与学生事务管理</p>
          </div>
          
          {!loginRole ? (
            <div className="grid grid-cols-1 gap-4 animate-fade-in">
              <button onClick={() => setLoginRole(UserRole.STUDENT)} className="group w-full bg-white border border-gray-100 p-4 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><i className="fas fa-user-graduate"></i></div>
                <div><h3 className="font-bold text-gray-900 text-sm">学生登录</h3><p className="text-[10px] text-gray-500">记录心情、咨询、留言</p></div>
              </button>
              <button onClick={() => setLoginRole(UserRole.COUNSELOR)} className="group w-full bg-white border border-gray-100 p-4 rounded-2xl hover:border-purple-600 hover:bg-purple-50 transition-all flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><i className="fas fa-user-md"></i></div>
                <div><h3 className="font-bold text-gray-900 text-sm">咨询师登录</h3><p className="text-[10px] text-gray-500">专业心理评估与访谈</p></div>
              </button>
              <button onClick={() => setLoginRole(UserRole.ADVISOR)} className="group w-full bg-white border border-gray-100 p-4 rounded-2xl hover:border-teal-600 hover:bg-teal-50 transition-all flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><i className="fas fa-user-tie"></i></div>
                <div><h3 className="font-bold text-gray-900 text-sm">辅导员登录</h3><p className="text-[10px] text-gray-500">班级管理与生活指导</p></div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setLoginRole(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-arrow-left"></i></button>
                <h3 className="font-bold text-lg text-gray-800">{loginRole === UserRole.STUDENT ? '学生登录' : loginRole === UserRole.COUNSELOR ? '咨询师登录' : '辅导员登录'}</h3>
              </div>
              <input type="text" required value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder={loginRole === UserRole.STUDENT ? "请输入学号" : "请输入职工号"} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 focus:bg-white focus:border-indigo-500 transition-all outline-none" />
              <input type="text" required value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="请输入真实姓名" className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 focus:bg-white focus:border-indigo-500 transition-all outline-none" />
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-md active:scale-[0.98]">立即进入系统</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout user={user!} onLogout={handleLogout}>
      {!isProfileComplete(user!) && (
        <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3"><i className="fas fa-exclamation-triangle text-amber-500"></i><div><p className="text-sm font-bold text-amber-900">您的个人信息尚未完善</p><p className="text-xs text-amber-700">为了更好的服务，请填写您的联系方式。</p></div></div>
          <button onClick={() => setIsProfileModalOpen(true)} className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors">去完善</button>
        </div>
      )}

      {user?.role === UserRole.STUDENT ? (
        <StudentView 
          user={user}
          onMoodLogged={(mood) => { setLastMood(mood); setNotification('心情记录成功！'); }}
          onStartChat={(target) => {
            if (target === 'AI') setActiveChat({ target: { id: 'AI', name: 'AI 心理助手', avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png' }, isAI: true });
            else setActiveChat({ target, isAI: false });
          }}
          appointments={appointments.filter(a => a.studentId === user.id)}
          onBookAppointment={handleAddAppointment}
          onCancelAppointment={handleCancelAppointment}
        />
      ) : user?.role === UserRole.COUNSELOR ? (
        <CounselorView 
          user={user!} 
          onSelectStudent={(s) => setActiveChat({ target: s, isAI: false })}
          appointments={appointments}
        />
      ) : (
        <AdvisorView 
          user={user!} 
          onSelectStudent={(s) => setActiveChat({ target: s, isAI: false })}
          appointments={appointments}
        />
      )}

      <button onClick={() => setIsProfileModalOpen(true)} className="fixed bottom-6 left-6 w-12 h-12 bg-white text-gray-600 rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:scale-110 transition-transform group" title="完善资料">
        <i className="fas fa-user-cog"></i>
        {!isProfileComplete(user!) && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
      </button>

      {activeChat && <ChatWindow currentUser={user!} targetUser={activeChat.target} isAI={activeChat.isAI} onClose={() => setActiveChat(null)} />}
      {isProfileModalOpen && <ProfileEditor user={user!} onSave={(u) => { setUser(u); setIsProfileModalOpen(false); setNotification('个人资料已保存'); }} onCancel={() => setIsProfileModalOpen(false)} />}
      {notification && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[200] animate-bounce-in"><i className="fas fa-info-circle text-indigo-400"></i><span className="text-sm font-medium">{notification}</span></div>}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { transform: translate(-50%, 100px); opacity: 0; } 60% { transform: translate(-50%, -10px); opacity: 1; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-in { animation: bounceIn 0.5s ease-out forwards; }
      `}</style>
    </Layout>
  );
};

export default App;
