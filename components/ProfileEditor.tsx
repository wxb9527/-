
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface ProfileEditorProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<User>({ ...user });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <i className="fas fa-id-card text-indigo-600"></i>
          完善个人信息
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">真实姓名</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">联系电话</label>
              <input 
                type="tel" 
                placeholder="请输入手机号"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            {user.role === UserRole.STUDENT && (
              <>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">所属学院</label>
                  <input 
                    type="text" 
                    placeholder="如：信息学院"
                    value={formData.college || ''}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">班级</label>
                  <input 
                    type="text" 
                    placeholder="如：计科2101"
                    value={formData.class || ''}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-200"
            >
              保存信息
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
