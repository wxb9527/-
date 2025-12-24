
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, UserRole, HealthTag } from '../types';
import { dataService } from '../services/dataService';

interface AdminViewProps {
  user: User;
  onNotify: (msg: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ user, onNotify }) => {
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.STUDENT);
  const [users, setUsers] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ gender: '男', healthTag: '健康' });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    refreshList();
    window.addEventListener('storage', refreshList);
    return () => window.removeEventListener('storage', refreshList);
  }, [activeTab]);

  const refreshList = () => {
    setUsers(dataService.getUsersByRole(activeTab));
    setAllStudents(dataService.getUsersByRole(UserRole.STUDENT));
  };

  // 全校健康状态统计计算
  const schoolStats = useMemo(() => {
    const total = allStudents.length;
    const unhealthy = allStudents.filter(s => s.healthTag === '不健康').length;
    const subHealthy = allStudents.filter(s => s.healthTag === '亚健康').length;
    const healthy = allStudents.filter(s => s.healthTag === '健康' || !s.healthTag).length;

    const getPct = (count: number) => total === 0 ? 0 : Math.round((count / total) * 100);

    return {
      total,
      healthy,
      subHealthy,
      unhealthy,
      healthyPct: getPct(healthy),
      subHealthyPct: getPct(subHealthy),
      unhealthyPct: getPct(unhealthy)
    };
  }, [allStudents]);

  const getRoleText = () => {
    if (activeTab === UserRole.STUDENT) return '学生';
    if (activeTab === UserRole.COUNSELOR) return '咨询师';
    if (activeTab === UserRole.ADVISOR) return '辅导员';
    return '';
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const count = dataService.importData(activeTab, content);
        onNotify(`成功加载 ${count} 条${getRoleText()}数据`);
        setHasChanges(false);
        refreshList();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingUser) {
      const userToCreate: User = {
        ...newUser,
        role: activeTab,
        avatar: `https://api.dicebear.com/7.x/${activeTab === UserRole.STUDENT ? 'avataaars' : 'bottts'}/svg?seed=${newUser.id}`,
      } as User;
      const result = dataService.addUser(userToCreate);
      if (result.success) {
        setIsAddingUser(false);
        setNewUser({ gender: '男', healthTag: '健康' });
        onNotify('系统库已添加新成员');
        setHasChanges(true);
      } else {
        onNotify(result.error || '新增失败');
        return;
      }
    } else if (editingUser) {
      dataService.updateUser(editingUser);
      setEditingUser(null);
      onNotify('个人资料已在系统库更新');
      setHasChanges(true);
    }
    refreshList();
    setShowPwd(false);
  };

  const handleSaveToLocalFile = () => {
    const content = dataService.exportData(activeTab);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getRoleText()}名单_最新同步.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setHasChanges(false);
    onNotify('已生成最新 TXT，请在保存时覆盖您的原始文件');
  };

  const handleCopyToClipboard = () => {
    const content = dataService.exportData(activeTab);
    navigator.clipboard.writeText(content).then(() => {
      onNotify('数据已复制！请在本地 TXT 中全选并粘贴覆盖');
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 text-left">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileImport} 
        accept=".txt" 
        className="hidden" 
      />

      {/* 全校健康状态仪表盘 */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-gray-900">全校学生心理健康概览</h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold ml-2">样本总量: {schoolStats.total}人</span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">数据实时更新中</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 健康卡片 */}
          <div className="bg-green-50/50 border border-green-100 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><i className="fas fa-face-smile text-5xl text-green-600"></i></div>
            <p className="text-[10px] font-bold text-green-600 uppercase mb-1">健康状态</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{schoolStats.healthy}</span>
              <span className="text-sm font-bold text-gray-400">人</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-gray-400">占比</span>
                <span className="text-green-600">{schoolStats.healthyPct}%</span>
              </div>
              <div className="w-full bg-green-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${schoolStats.healthyPct}%` }}></div>
              </div>
            </div>
          </div>

          {/* 亚健康卡片 */}
          <div className="bg-yellow-50/50 border border-yellow-100 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><i className="fas fa-face-meh text-5xl text-yellow-600"></i></div>
            <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1">亚健康状态</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{schoolStats.subHealthy}</span>
              <span className="text-sm font-bold text-gray-400">人</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-gray-400">占比</span>
                <span className="text-yellow-600">{schoolStats.subHealthyPct}%</span>
              </div>
              <div className="w-full bg-yellow-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full transition-all duration-1000" style={{ width: `${schoolStats.subHealthyPct}%` }}></div>
              </div>
            </div>
          </div>

          {/* 不健康卡片 */}
          <div className="bg-red-50/50 border border-red-100 p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform"><i className="fas fa-face-frown text-5xl text-red-600"></i></div>
            <p className="text-[10px] font-bold text-red-600 uppercase mb-1">不健康状态 (需干预)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900">{schoolStats.unhealthy}</span>
              <span className="text-sm font-bold text-gray-400">人</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-gray-400">占比</span>
                <span className="text-red-600">{schoolStats.unhealthyPct}%</span>
              </div>
              <div className="w-full bg-red-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${schoolStats.unhealthyPct}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <i className="fas fa-database text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">数据同步中心</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {hasChanges ? '⚠️ 系统库有未同步到文件的修改' : '✅ 系统数据与文件当前一致'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
          >
            <i className="fas fa-file-import"></i> 导入 TXT
          </button>

          <button 
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-50 text-teal-700 border border-teal-100 rounded-xl font-bold text-sm hover:bg-teal-100 transition-all"
          >
            <i className="fas fa-copy"></i> 复制内容
          </button>
          
          <button 
            onClick={handleSaveToLocalFile}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${hasChanges ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
          >
            <i className="fas fa-save"></i> 保存修改到 TXT
          </button>

          <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all">
            <i className="fas fa-user-plus"></i> 新增{getRoleText()}
          </button>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-200/50 p-1.5 rounded-2xl w-fit border border-gray-200">
        {[UserRole.STUDENT, UserRole.COUNSELOR, UserRole.ADVISOR].map(role => (
          <button 
            key={role}
            onClick={() => setActiveTab(role)} 
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {role === UserRole.STUDENT ? '学生管理' : role === UserRole.COUNSELOR ? '咨询师管理' : '辅导员管理'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <th className="px-6 py-4">学号/工号</th>
                <th className="px-6 py-4">姓名及资料</th>
                <th className="px-6 py-4">健康声明</th>
                <th className="px-6 py-4">联系电话</th>
                <th className="px-6 py-4 text-right">管理</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-sm text-gray-500">{u.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-indigo-50" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{u.name}</p>
                        <p className="text-[10px] text-gray-400">{(u as any).college || (u as any).specialization || '教职工'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${u.healthTag === '不健康' ? 'bg-red-100 text-red-600' : u.healthTag === '亚健康' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                      {u.healthTag || '健康'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{u.phone || '未录入'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setEditingUser(u)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all">编辑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="py-20 text-center">
              <i className="fas fa-folder-open text-4xl text-gray-200 mb-4 block"></i>
              <p className="text-gray-400 text-sm">暂无数据，请先点击上方“导入 TXT”</p>
            </div>
          )}
        </div>
      </div>

      {(editingUser || isAddingUser) && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">
                 <i className={`fas ${isAddingUser ? 'fa-plus' : 'fa-user-pen'}`}></i>
               </div>
               {isAddingUser ? '录入新资料' : '更新成员信息'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">学号/工号</label>
                  <input 
                    type="text" 
                    disabled={!!editingUser}
                    value={isAddingUser ? (newUser.id || '') : (editingUser?.id || '')} 
                    onChange={e => setNewUser({...newUser, id: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
                    required 
                  />
                </div>
                <div className="text-left">
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">性别</label>
                  <select 
                    value={isAddingUser ? newUser.gender : editingUser?.gender}
                    onChange={e => isAddingUser ? setNewUser({...newUser, gender: e.target.value as any}) : setEditingUser({...editingUser!, gender: e.target.value as any})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">姓名</label>
                <input 
                  type="text" 
                  value={isAddingUser ? (newUser.name || '') : (editingUser?.name || '')} 
                  onChange={e => isAddingUser ? setNewUser({...newUser, name: e.target.value}) : setEditingUser({...editingUser!, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">健康评估标签</label>
                <select 
                  value={isAddingUser ? newUser.healthTag : editingUser?.healthTag}
                  onChange={e => isAddingUser ? setNewUser({...newUser, healthTag: e.target.value as HealthTag}) : setEditingUser({...editingUser!, healthTag: e.target.value as HealthTag})}
                  className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none font-bold ${isAddingUser ? (newUser.healthTag === '健康' ? 'text-green-600' : 'text-red-500') : (editingUser?.healthTag === '健康' ? 'text-green-600' : 'text-red-500')}`}
                >
                  <option value="健康">健康</option>
                  <option value="亚健康">亚健康</option>
                  <option value="不健康">不健康</option>
                </select>
              </div>

              <div className="text-left">
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">联系电话</label>
                <input 
                  type="tel" 
                  maxLength={11}
                  value={isAddingUser ? (newUser.phone || '') : (editingUser?.phone || '')} 
                  onChange={e => isAddingUser ? setNewUser({...newUser, phone: e.target.value}) : setEditingUser({...editingUser!, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none" 
                  placeholder="11位手机号"
                  required 
                />
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => { setEditingUser(null); setIsAddingUser(false); }} className="flex-1 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors">取消</button>
                <button type="submit" className="flex-2 bg-indigo-600 text-white py-3 px-8 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">保存到系统库</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
