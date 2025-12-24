import React, { useState, useMemo, useEffect } from 'react';
import { User, Appointment, HealthTag, Message } from '../types';
import UserInfoModal from '../components/UserInfoModal';
import { dataService } from '../services/dataService';

interface AdvisorViewProps {
  user: User;
  students: User[];
  onSelectStudent: (student: User) => void;
  appointments: Appointment[];
}

const AdvisorView: React.FC<AdvisorViewProps> = ({ user, students, onSelectStudent, appointments }) => {
  const [confirmCall, setConfirmCall] = useState<{ name: string, phone: string } | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [recentContactIds, setRecentContactIds] = useState<string[]>([]);

  useEffect(() => {
    const updateRecent = () => {
      setRecentContactIds(dataService.getRecentChatContacts(user.id));
      setLastUpdate(new Date());
    };
    updateRecent();
    window.addEventListener('storage', updateRecent);
    const itv = setInterval(updateRecent, 2000);
    return () => {
      window.removeEventListener('storage', updateRecent);
      clearInterval(itv);
    };
  }, [user.id]);

  // 获取本学院所有学生
  const myCollegeStudents = useMemo(() => {
    return students.filter(s => s.college === user.college);
  }, [students, user.college]);

  // 获取最近联系的学生对象列表
  const recentStudents = useMemo(() => {
    return students.filter(s => recentContactIds.includes(s.id));
  }, [students, recentContactIds]);

  // 使用精准的未读逻辑判断是否有新消息
  const hasUnread = (studentId: string) => {
    return dataService.hasUnreadMessages(user.id, studentId);
  };

  const handleSelectStudent = (student: User) => {
    // 点击时标记为已读
    dataService.markMessagesAsRead(user.id, student.id);
    onSelectStudent(student);
  };

  // 详细统计指标
  const stats = useMemo(() => {
    const total = myCollegeStudents.length;
    const unhealthy = myCollegeStudents.filter(s => s.healthTag === '不健康').length;
    const subHealthy = myCollegeStudents.filter(s => s.healthTag === '亚健康').length;
    const healthy = myCollegeStudents.filter(s => (s.healthTag === '健康' || !s.healthTag)).length;

    const getPct = (count: number) => {
      if (total === 0) return 0;
      return Math.round((count / total) * 100);
    };

    return { 
      total, 
      unhealthy, subHealthy, healthy,
      unhealthyPct: getPct(unhealthy),
      subHealthyPct: getPct(subHealthy),
      healthyPct: getPct(healthy)
    };
  }, [myCollegeStudents]);

  const riskStudents = useMemo(() => {
    return myCollegeStudents
      .filter(s => s.healthTag === '亚健康' || s.healthTag === '不健康')
      .sort((a, b) => {
        const order = { '不健康': 0, '亚健康': 1, '健康': 2 };
        return (order[a.healthTag || '健康'] ?? 2) - (order[b.healthTag || '健康'] ?? 2);
      });
  }, [myCollegeStudents]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* 顶部核心数据看板 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              <h2 className="text-2xl font-black text-gray-900">{user.college} 风险监控中心</h2>
            </div>
            <p className="text-sm text-gray-400">
              辖区总人数: <span className="font-bold text-gray-700">{stats.total}</span> · 
              异常待处理: <span className="font-bold text-red-600">{riskStudents.length}</span> · 
              最后同步: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-red-50 border border-red-100 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-sm">
              <span className="text-[10px] font-bold text-red-400 uppercase">严重预警</span>
              <span className="text-2xl font-black text-red-600">{stats.unhealthy}</span>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-sm">
              <span className="text-[10px] font-bold text-yellow-500 uppercase">风险推送</span>
              <span className="text-2xl font-black text-yellow-600">{stats.subHealthy}</span>
            </div>
          </div>
        </div>

        {/* 心理健康状态分布详细统计 */}
        <div className="border-t border-gray-50 pt-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie text-indigo-500"></i>
            本院心理健康分布占比
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-green-600">健康状态</span>
                <span className="text-[10px] text-gray-400 font-mono"><span className="text-gray-900 font-bold">{stats.healthy}</span> 人 ({stats.healthyPct}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${stats.healthyPct}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-yellow-600">亚健康状态</span>
                <span className="text-[10px] text-gray-400 font-mono"><span className="text-gray-900 font-bold">{stats.subHealthy}</span> 人 ({stats.subHealthyPct}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${stats.subHealthyPct}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-red-600">不健康状态</span>
                <span className="text-[10px] text-gray-400 font-mono"><span className="text-gray-900 font-bold">{stats.unhealthy}</span> 人 ({stats.unhealthyPct}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${stats.unhealthyPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <i className="fas fa-comment-alt text-indigo-500"></i>
              近期对话反馈
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {recentStudents.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => handleSelectStudent(s)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${hasUnread(s.id) ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                >
                  <div className="relative">
                    <img src={s.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                    {hasUnread(s.id) && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-gray-900 truncate">{s.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{s.class}</p>
                  </div>
                  {hasUnread(s.id) && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">新</span>}
                </button>
              ))}
              {recentStudents.length === 0 && <p className="text-[11px] text-gray-400 text-center py-10">暂无对话记录</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <i className="fas fa-user-shield text-indigo-500"></i>
              管理身份
            </h3>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">当前职务</p>
              <p className="text-sm font-bold text-gray-900">{user.college} 辅导员</p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-microchip text-indigo-600"></i>
              风险成员实时干预
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
            {riskStudents.map((student) => {
              const isUnhealthy = student.healthTag === '不健康';
              const isSubHealthy = student.healthTag === '亚健康';
              const msgAlert = hasUnread(student.id);
              
              return (
                <div 
                  key={student.id} 
                  className={`relative p-5 rounded-2xl border transition-all hover:shadow-xl group animate-slide-up ${
                    msgAlert ? 'ring-2 ring-indigo-500 border-indigo-200 shadow-lg' :
                    isUnhealthy ? 'bg-red-50 border-red-200 ring-2 ring-red-100' : 
                    isSubHealthy ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button onClick={() => setViewingUser(student)} className="relative shrink-0">
                      <img 
                        src={student.avatar} 
                        className={`w-14 h-14 rounded-full border-2 shadow-sm transition-transform group-hover:scale-110 ${isUnhealthy ? 'border-red-500 animate-pulse' : 'border-white'}`} 
                        alt="" 
                      />
                      {isUnhealthy && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                          <i className="fas fa-exclamation text-[10px]"></i>
                        </div>
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-900 truncate text-sm">{student.name}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold text-white shadow-sm ${
                          isUnhealthy ? 'bg-red-600' : 'bg-yellow-500'
                        }`}>
                          {student.healthTag}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">{student.class}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200/30 flex gap-2">
                    <button 
                      onClick={() => setConfirmCall({ name: student.name, phone: student.phone! })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white border border-gray-100 text-gray-500 text-[10px] font-bold hover:bg-green-600 hover:text-white transition-all shadow-sm"
                    >
                      <i className="fas fa-phone-alt"></i> 电话
                    </button>
                    <button 
                      onClick={() => handleSelectStudent(student)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold shadow-md transition-all ${msgAlert ? 'bg-red-500 animate-pulse text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      <i className={`fas ${msgAlert ? 'fa-bell' : 'fa-comment-dots'}`}></i> {msgAlert ? '新回复' : '沟通'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {viewingUser && <UserInfoModal target={viewingUser} onClose={() => setViewingUser(null)} />}
      
      {confirmCall && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><i className="fas fa-phone-alt text-xl"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">立即联系学生？</h3>
            <p className="text-sm text-gray-500 mb-6">即将呼叫：<span className="font-bold text-gray-800">{confirmCall.name}</span></p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCall(null)} className="flex-1 py-2 text-gray-400 font-bold text-sm">取消</button>
              <button onClick={() => { window.location.href = `tel:${confirmCall.phone}`; setConfirmCall(null); }} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm shadow-lg shadow-green-100">拨打电话</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorView;