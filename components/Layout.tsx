
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <i className="fas fa-heart-pulse text-xl"></i>
              </div>
              <span className="text-xl font-bold text-gray-800">UniMind</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role === UserRole.STUDENT ? '学生' : '心理咨询师'}</p>
              </div>
              <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-100" />
              <button 
                onClick={onLogout}
                className="text-gray-500 hover:text-red-600 transition-colors p-2"
                title="退出登录"
              >
                <i className="fas fa-sign-out-alt text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      <footer className="bg-white border-t py-4 text-center text-gray-500 text-sm">
        &copy; 2024 UniMind 高校心理咨询服务系统
      </footer>
    </div>
  );
};

export default Layout;
