
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  onEditProfile: () => void;
  onEditPassword: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, onEditProfile, onEditPassword, children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return '管理员';
      case UserRole.COUNSELOR: return '咨询师';
      case UserRole.STUDENT: return '学生';
      default: return '用户';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <i className="fas fa-heart-pulse text-xl"></i>
              </div>
              <span className="text-xl font-bold text-gray-800 tracking-tight">UniMind</span>
            </div>
            
            <div className="flex items-center gap-4 relative" ref={menuRef}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{getRoleLabel(user.role)}</p>
              </div>
              
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="focus:outline-none transition-transform active:scale-95"
              >
                <div className="relative">
                  <img 
                    src={user.avatar} 
                    alt="Avatar" 
                    className={`w-10 h-10 rounded-full border-2 transition-all ${isMenuOpen ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-indigo-100'}`} 
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-14 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-fade-in z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-500">ID: {user.id}</p>
                  </div>
                  
                  <button 
                    onClick={() => { onEditProfile(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <i className="fas fa-id-card w-4 text-center"></i>
                    <span>修改个人资料</span>
                  </button>

                  <button 
                    onClick={() => { onEditPassword(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <i className="fas fa-key w-4 text-center"></i>
                    <span>修改登录密码</span>
                  </button>
                  
                  <div className="h-px bg-gray-50 my-1"></div>
                  
                  <button 
                    onClick={() => { onLogout(); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    <i className="fas fa-sign-out-alt w-4 text-center"></i>
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      <footer className="bg-white border-t py-6 text-center text-gray-400 text-xs">
        &copy; 2024 UniMind 高校心理咨询服务系统
      </footer>
    </div>
  );
};

export default Layout;
