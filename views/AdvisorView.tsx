
import React, { useState, useMemo, useEffect } from 'react';
import { User, Appointment, HealthTag, Message } from '../types';
import UserInfoModal from '../components/UserInfoModal';
import { dataService } from '../services/dataService';
import { MOOD_CONFIG } from '../constants';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return myCollegeStudents;
    return myCollegeStudents.filter(s => 
      s.name.includes(searchTerm) || s.id.includes(searchTerm) || (s.class && s.class.includes(searchTerm))
    );
  }, [myCollegeStudents, searchTerm]);

  // 获取最近联系的学生对象列表
  const recentStudents = useMemo(() => {
    return students.filter(s => recentContactIds.includes(s.id));
  }, [students, recentContactIds]);

  const hasUnread = (studentId: string) => {
    return dataService.hasUnreadMessages(user.id, studentId);
  };

  const handleSelectStudent = (student: User) => {
    dataService.markMessagesAsRead(user.id, student.id);
    onSelectStudent(student);
  };

  const stats = useMemo(() => {
    const total = myCollegeStudents.length;
    const unhealthy = myCollegeStudents.filter(s => s.healthTag === '不健康').length;
    const subHealthy = myCollegeStudents.filter(s => s.healthTag === '亚健康').length;
    const healthy = myCollegeStudents.filter(s => (s.healthTag === '健康' || !s.healthTag)).length;

    const getPct = (count: number) => total === 0 ? 0 : Math.round((count / total) * 100);

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
    <div className="space-y-6 animate-fade-in text-left pb-12">
      {/* 顶部核心数据看板 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
              <h2 className="text-2xl font-black text-gray-900">{user.college} 辅导员管理中心</h2>
            </div>
            <p className="text-sm text-gray-400">
              学院总人数: <span className="font-bold text-gray-700">{stats.total}</span> · 
              待关注学生: <span className="font-bold text-red-600">{riskStudents.length}</span> · 
              最后更新: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-red-50 border border-red-100 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-sm">
              <span className="text-[10px] font-bold text-red-400 uppercase">严重预警</span>
              <span className="text-2xl font-black text-red-600">{stats.unhealthy}</span>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 px-6 py-3 rounded-2xl flex flex-col items-center min-w-[100px] shadow-sm">
              <span className="text-[10px] font-bold text-yellow-500 uppercase">关注名单</span>
              <span className="text-2xl font-black text-yellow-600">{stats.subHealthy}</span>
            </div>
          </div>
        </div>

        {/* 心理健康状态分布统计 */}
        <div className="border-t border-gray-50 pt-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie text-indigo-500"></i>
            学生心理健康状态分布
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-green-600">健康状况良好</span>
                <span className="text-[10px] text-gray-400 font-mono"><span className="text-gray-900 font-bold">{stats.healthy}</span> 人 ({stats.healthyPct}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${stats.healthyPct}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-yellow-600">亚健康/压力较大</span>
                <span className="text-[10px] text-gray-400 font-mono"><span className="text-gray-900 font-bold">{stats.subHealthy}</span> 人 ({stats.subHealthyPct}%)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${stats.subHealthyPct}%` }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-red-600">急需干预/预警</span>
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
        {/* 左侧：风险名单与最近沟通 */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <i className="fas fa-bolt text-red-500"></i>
              风险学生快报
            </h3>
            <div className="space-y-3">
              {riskStudents.slice(0, 5).map(s => {
                const latestMood = dataService.getLatestMood(s.id);
                const moodCfg = latestMood ? MOOD_CONFIG[latestMood.mood] : null;
                return (
                  <div key={s.id} onClick={() => setViewingUser(s)} className="p-3 bg-red-50/50 rounded-2xl border border-red-100 cursor-pointer hover:bg-red-50 transition-all">
                    <div className="flex items-center gap-3">
                      <img src={s.avatar} className="w-8 h-8 rounded-full border border-white" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{s.name}</p>
                        {moodCfg && <p className={`text-[8px] font-black ${moodCfg.color}`}>当前情绪: {moodCfg.label}</p>}
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${s.healthTag === '不健康' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'}`}>
                        {s.healthTag}
                      </span>
                    </div>
                  </div>
                );
              })}
              {riskStudents.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">暂无高风险预警</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
              <i className="fas fa-comment-alt text-indigo-500"></i>
              待处理消息
            </h3>
            <div className="space-y-3">
              {recentStudents.filter(s => hasUnread(s.id)).map(s => (
                <button 
                  key={s.id} 
                  onClick={() => handleSelectStudent(s)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-100 animate-pulse transition-all text-left"
                >
                  <img src={s.avatar} className="w-8 h-8 rounded-full border border-white" alt="" />
                  <div className="flex-1">
                    <p className="font-bold text-xs text-indigo-900">{s.name}</p>
                    <p className="text-[8px] text-indigo-400 font-bold uppercase">点击回复学生</p>
                  </div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </button>
              ))}
              {recentStudents.filter(s => hasUnread(s.id)).length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">暂无未读消息</p>}
            </div>
          </div>
        </aside>

        {/* 右侧：全院学生心情监测名单 */}
        <main className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
              <i className="fas fa-heart-circle-check text-indigo-600"></i>
              全院学生心情监测看板
            </h3>
            <div className="relative w-full sm:w-64">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
              <input 
                type="text" 
                placeholder="搜索姓名、学号或班级..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-full pl-9 pr-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-gray-50/50">
                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-50">
                  <th className="px-6 py-4">学生姓名</th>
                  <th className="px-6 py-4">班级/学号</th>
                  <th className="px-6 py-4">健康标签</th>
                  <th className="px-6 py-4">最新记录心情</th>
                  <th className="px-6 py-4 text-right">操作管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student) => {
                  const latestMood = dataService.getLatestMood(student.id);
                  const moodCfg = latestMood ? MOOD_CONFIG[latestMood.mood] : null;
                  const isUnread = hasUnread(student.id);
                  const isRisk = student.healthTag === '不健康' || student.healthTag === '亚健康';

                  return (
                    <tr key={student.id} className={`group hover:bg-gray-50/80 transition-all ${isUnread ? 'bg-indigo-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={student.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                            {isUnread && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-bounce"></div>}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{student.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 font-medium">{student.class || '未记录班级'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${
                          student.healthTag === '不健康' ? 'bg-red-500 text-white' : 
                          student.healthTag === '亚健康' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {student.healthTag || '健康'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {moodCfg ? (
                          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${moodCfg.bg} border border-white/50 w-fit`}>
                            <i className={`fas ${moodCfg.icon} text-xs ${moodCfg.color}`}></i>
                            <span className={`text-[11px] font-black ${moodCfg.color}`}>{moodCfg.label}</span>
                            <span className="text-[9px] text-gray-400 ml-1 font-medium">{new Date(latestMood.timestamp).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 italic">暂无今日记录</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setViewingUser(student)}
                            className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                            title="查看详情"
                          >
                            <i className="fas fa-user-circle"></i>
                          </button>
                          <button 
                            onClick={() => setConfirmCall({ name: student.name, phone: student.phone || '' })}
                            className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-green-50 hover:text-green-600 transition-all"
                            title="拨打电话"
                          >
                            <i className="fas fa-phone"></i>
                          </button>
                          <button 
                            onClick={() => handleSelectStudent(student)}
                            className={`p-2 rounded-lg transition-all ${isUnread ? 'bg-red-500 text-white shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                            title="发送消息"
                          >
                            <i className="fas fa-comment-dots"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-user-slash text-gray-200 text-2xl"></i>
                </div>
                <p className="text-gray-400 text-sm">未搜索到相关学生信息</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {viewingUser && <UserInfoModal target={viewingUser} onClose={() => setViewingUser(null)} />}
      
      {confirmCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[250] animate-fade-in" onClick={() => setConfirmCall(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <i className="fas fa-phone-alt text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">立即联系学生？</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">即将呼叫：<span className="font-black text-gray-800">{confirmCall.name}</span><br/>请确保环境安静，给予学生充分的耐心与倾听。</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmCall(null)} className="flex-1 py-3 text-gray-400 font-bold text-sm">取消</button>
              <button onClick={() => { if(confirmCall.phone) window.location.href = `tel:${confirmCall.phone}`; else alert('该学生暂未录入手机号'); setConfirmCall(null); }} className="flex-2 bg-green-600 text-white py-3 rounded-2xl font-bold text-sm shadow-xl shadow-green-100 hover:bg-green-700 transition-all">确认呼叫</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisorView;
