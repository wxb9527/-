
import React, { useState } from 'react';
import { User } from '../types';

interface PasswordChangeModalProps {
  user: User;
  onSave: (newPassword: string) => void;
  onCancel: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ user, onSave, onCancel }) => {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPwd !== user.password) {
      setError('原密码错误');
      return;
    }
    if (newPwd.length < 6) {
      setError('新密码长度至少为 6 位');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('两次输入的新密码不一致');
      return;
    }
    onSave(newPwd);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <i className="fas fa-key text-indigo-600"></i>
          修改登录密码
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">原密码</label>
            <div className="relative">
              <input 
                type={showOld ? "text" : "password"} 
                value={oldPwd}
                onChange={(e) => { setOldPwd(e.target.value); setError(''); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                required
              />
              <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">
                <i className={`fas ${showOld ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">新密码</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"} 
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setError(''); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">
                <i className={`fas ${showNew ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">确认新密码</label>
            <div className="relative">
              <input 
                type={showConfirm ? "text" : "password"} 
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); setError(''); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none pr-12"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600">
                <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">取消</button>
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg">保存新密码</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChangeModal;
