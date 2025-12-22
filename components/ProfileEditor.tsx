
import React, { useState } from 'react';
import { User, UserRole, HealthTag } from '../types';

interface ProfileEditorProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
  isMandatory?: boolean;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onSave, onCancel, isMandatory = false }) => {
  const [formData, setFormData] = useState<any>({ ...user, gender: user.gender || '男', healthTag: user.healthTag || '健康' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!formData.phone) { setError('手机号码不能为空'); return; }
    if (!phoneRegex.test(formData.phone)) { setError('请输入正确的11位手机号码'); return; }
    setError(null);
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[150] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <i className="fas fa-id-card text-indigo-600"></i>
          {isMandatory ? '请完善个人资料' : '编辑个人资料'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">真实姓名</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">性别</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none">
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
          </div>

          {user.role === UserRole.STUDENT && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">当前心理健康状态 (手动声明)</label>
              <select 
                value={formData.healthTag} 
                onChange={(e) => setFormData({ ...formData, healthTag: e.target.value as HealthTag })} 
                className={`w-full border rounded-xl px-4 py-2.5 font-bold outline-none ${formData.healthTag === '健康' ? 'bg-green-50 border-green-200 text-green-700' : formData.healthTag === '亚健康' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'}`}
              >
                <option value="健康">健康 (一切正常)</option>
                <option value="亚健康">亚健康 (感觉压力有点大)</option>
                <option value="不健康">不健康 (非常不舒服，需要寻求帮助)</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1">如选择非“健康”状态，系统将自动通知咨询师和辅导员。</p>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">联系电话 (11位数字)</label>
            <input type="tel" maxLength={11} value={formData.phone || ''} onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setError(null); }} className={`w-full bg-indigo-50/50 border ${error ? 'border-red-500' : 'border-indigo-100'} rounded-xl px-4 py-3 outline-none font-bold`} required />
            {error && <p className="text-[10px] text-red-500 mt-1 font-bold">{error}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            {!isMandatory && <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold">取消</button>}
            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg">保存修改</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditor;
