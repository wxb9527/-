
import React from 'react';
import { User, UserRole } from '../types';

interface UserInfoModalProps {
  target: User;
  onClose: () => void;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ target, onClose }) => {
  const isStudent = target.role === UserRole.STUDENT;
  const isCounselor = target.role === UserRole.COUNSELOR;
  const isAdvisor = target.role === UserRole.ADVISOR;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-bounce-in overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <i className="fas fa-times"></i>
        </button>

        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <img src={target.avatar} alt="" className="w-24 h-24 rounded-full border-4 border-indigo-50 shadow-lg mx-auto" />
            <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-[10px] text-white ${target.gender === '女' ? 'bg-pink-500' : 'bg-blue-500'}`}>
              <i className={`fas ${target.gender === '女' ? 'fa-venus' : 'fa-mars'}`}></i>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{target.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-widest">
              {isStudent ? '学生' : isCounselor ? '咨询师' : isAdvisor ? '辅导员' : '系统管理'}
            </p>
            {isStudent && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${target.healthTag === '健康' ? 'bg-green-500' : target.healthTag === '亚健康' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                {target.healthTag || '待测'}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <i className="fas fa-id-badge text-indigo-400 w-5"></i>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase font-bold">账号/学工号</p>
              <p className="text-gray-900 font-mono">{target.id}</p>
            </div>
          </div>

          {(isStudent || isAdvisor) && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <i className="fas fa-university text-indigo-400 w-5"></i>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold">所属学院</p>
                <p className="text-gray-900">{target.college || '未填写'}</p>
              </div>
            </div>
          )}

          {isStudent && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <i className="fas fa-users text-indigo-400 w-5"></i>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold">班级</p>
                <p className="text-gray-900">{target.class || '未填写'}</p>
              </div>
            </div>
          )}

          {isCounselor && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <i className="fas fa-award text-indigo-400 w-5"></i>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold">擅长领域</p>
                <p className="text-gray-900">{target.specialization || '全能咨询'}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <i className="fas fa-phone-alt text-indigo-500 w-5"></i>
            <div className="flex-1">
              <p className="text-[10px] text-indigo-400 uppercase font-bold">联系电话</p>
              <p className="text-indigo-900 font-bold">{target.phone || '未绑定'}</p>
            </div>
            {target.phone && (
              <a href={`tel:${target.phone}`} className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-all shadow-md">
                <i className="fas fa-phone-alt text-xs"></i>
              </a>
            )}
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black">确定</button>
      </div>
    </div>
  );
};

export default UserInfoModal;
