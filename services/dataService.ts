
import { User, UserRole, HealthTag, Message, Appointment } from '../types';

const ADMIN_ACCOUNTS: User[] = [
  { id: 'admin01', name: '系统管理员', password: 'admin_password_123', role: UserRole.ADMIN, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin1', gender: '男' }
];

const DEFAULT_RAW_STUDENTS = `
2023001,王小明,password123,信息学院,计科2101,13811112222,男,健康
2023002,李华,password123,艺术学院,视觉2102,13833334444,女,亚健康
2023003,张悦,password123,经管学院,金融2103,13855556666,女,健康
`.trim();

const DEFAULT_RAW_COUNSELORS = `
T001,张老师,admin,学业焦虑与压力管理,13800000001,女
T002,李老师,password,人际关系与情感咨询,13800000002,男
`.trim();

const DEFAULT_RAW_ADVISORS = `
A001,王辅导,admin,信息学院,13511112222,男
A002,赵辅导,admin,艺术学院,13533334444,女
`.trim();

const DB_KEY = 'unimind_mock_db';
const CHAT_KEY = 'unimind_chat_history';
const APP_KEY = 'unimind_appointments';

export const dataService = {
  parseTxtToStudents(txt: string): User[] {
    return txt.split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split(/[,\s\t]+/).map(s => s.trim());
      const [id, name, password, college, className, phone, gender, healthTag] = parts;
      return {
        id: id || 'S'+Date.now(),
        name: name || '未命名',
        password: password || '123456',
        role: UserRole.STUDENT,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id || 'default'}`,
        college: college || '未分配学院', 
        class: className || '未分配班级',
        phone: phone || '',
        gender: (gender as any) || '男',
        healthTag: (healthTag as HealthTag) || '健康'
      };
    });
  },

  parseTxtToCounselors(txt: string): User[] {
    return txt.split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split(/[,\s\t]+/).map(s => s.trim());
      const [id, name, password, specialization, phone, gender] = parts;
      return {
        id: id || 'C'+Date.now(),
        name: name || '未命名咨询师',
        password: password || 'admin',
        role: UserRole.COUNSELOR,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id || 'default'}`,
        specialization: specialization || '全能咨询', 
        phone: phone || '',
        gender: (gender as any) || '男'
      } as any;
    });
  },

  parseTxtToAdvisors(txt: string): User[] {
    return txt.split('\n').filter(l => l.trim()).map(line => {
      const parts = line.split(/[,\s\t]+/).map(s => s.trim());
      const [id, name, password, college, phone, gender] = parts;
      return {
        id: id || 'A'+Date.now(),
        name: name || '未命名辅导员',
        password: password || 'admin',
        role: UserRole.ADVISOR,
        avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${id || 'default'}`,
        college: college || '通用学院', 
        phone: phone || '',
        gender: (gender as any) || '男'
      };
    });
  },

  init() {
    if (!localStorage.getItem(DB_KEY)) {
      this.saveToDb(
        this.parseTxtToStudents(DEFAULT_RAW_STUDENTS),
        this.parseTxtToCounselors(DEFAULT_RAW_COUNSELORS),
        this.parseTxtToAdvisors(DEFAULT_RAW_ADVISORS),
        ADMIN_ACCOUNTS
      );
    }
    if (!localStorage.getItem(CHAT_KEY)) {
      localStorage.setItem(CHAT_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(APP_KEY)) {
      localStorage.setItem(APP_KEY, JSON.stringify([]));
    }
  },

  saveToDb(students: User[], counselors: User[], advisors: User[], admins: User[]) {
    localStorage.setItem(DB_KEY, JSON.stringify({ students, counselors, advisors, admins }));
    window.dispatchEvent(new Event('storage'));
  },

  getDb() {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return { students: [], counselors: [], advisors: [], admins: [] };
    return JSON.parse(data);
  },

  getAppointments(): Appointment[] {
    return JSON.parse(localStorage.getItem(APP_KEY) || '[]');
  },

  saveAppointment(app: Appointment) {
    let apps = this.getAppointments();
    apps.unshift(app);
    if (apps.length > 10) {
      apps = apps.slice(0, 10);
    }
    localStorage.setItem(APP_KEY, JSON.stringify(apps));
    window.dispatchEvent(new Event('storage'));
  },

  updateAppointmentStatus(id: string, status: Appointment['status']) {
    const apps = this.getAppointments();
    const updated = apps.map(a => a.id === id ? { ...a, status } : a);
    localStorage.setItem(APP_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  updateAppointmentLocation(id: string, location: string) {
    const apps = this.getAppointments();
    const updated = apps.map(a => 
      a.id === id ? { ...a, location, locationUpdated: true } : a
    );
    localStorage.setItem(APP_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  dismissLocationNotification(id: string) {
    const apps = this.getAppointments();
    const updated = apps.map(a => 
      a.id === id ? { ...a, locationUpdated: false } : a
    );
    localStorage.setItem(APP_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  },

  getMessages(user1Id: string, user2Id: string): Message[] {
    const allMessages: Message[] = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    return allMessages.filter(m => 
      (m.senderId === user1Id && m.receiverId === user2Id) ||
      (m.senderId === user2Id && m.receiverId === user1Id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  },

  saveMessage(msg: Message) {
    const allMessages: Message[] = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    allMessages.push(msg);
    localStorage.setItem(CHAT_KEY, JSON.stringify(allMessages));
    window.dispatchEvent(new Event('storage'));
  },

  getRecentChatContacts(currentUserId: string): string[] {
    const allMessages: Message[] = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');
    const contacts = new Set<string>();
    for (let i = allMessages.length - 1; i >= 0; i--) {
      const m = allMessages[i];
      if (m.senderId === currentUserId) contacts.add(m.receiverId);
      if (m.receiverId === currentUserId) contacts.add(m.senderId);
    }
    return Array.from(contacts);
  },

  importData(role: UserRole, content: string): number {
    const db = this.getDb();
    let count = 0;
    if (role === UserRole.STUDENT) {
      db.students = this.parseTxtToStudents(content);
      count = db.students.length;
    } else if (role === UserRole.COUNSELOR) {
      db.counselors = this.parseTxtToCounselors(content);
      count = db.counselors.length;
    } else if (role === UserRole.ADVISOR) {
      db.advisors = this.parseTxtToAdvisors(content);
      count = db.advisors.length;
    }
    this.saveToDb(db.students, db.counselors, db.advisors, db.admins);
    return count;
  },

  exportData(role: UserRole): string {
    const db = this.getDb();
    if (role === UserRole.STUDENT) {
      return db.students.map((s: any) => `${s.id},${s.name},${s.password},${s.college},${s.class},${s.phone},${s.gender},${s.healthTag || '健康'}`).join('\n');
    }
    if (role === UserRole.COUNSELOR) return db.counselors.map((c: any) => `${c.id},${c.name},${c.password},${c.specialization},${c.phone},${c.gender}`).join('\n');
    if (role === UserRole.ADVISOR) return db.advisors.map((a: any) => `${a.id},${a.name},${a.password},${a.college},${a.phone},${a.gender}`).join('\n');
    return '';
  },

  getUsersByRole(role: UserRole): User[] {
    const db = this.getDb();
    if (role === UserRole.STUDENT) return db.students;
    if (role === UserRole.COUNSELOR) return db.counselors;
    if (role === UserRole.ADVISOR) return db.advisors;
    if (role === UserRole.ADMIN) return db.admins;
    return [];
  },

  addUser(user: User): { success: boolean, error?: string } {
    const db = this.getDb();
    const allUsers = [...db.students, ...db.counselors, ...db.advisors, ...db.admins];
    if (allUsers.some((u: User) => u.id === user.id)) {
      return { success: false, error: 'ID已存在' };
    }
    if (user.role === UserRole.STUDENT) db.students.push(user);
    else if (user.role === UserRole.COUNSELOR) db.counselors.push(user);
    else if (user.role === UserRole.ADVISOR) db.advisors.push(user);
    this.saveToDb(db.students, db.counselors, db.advisors, db.admins);
    return { success: true };
  },

  updateUser(updatedUser: User): void {
    const db = this.getDb();
    if (updatedUser.role === UserRole.STUDENT) db.students = db.students.map((u: any) => u.id === updatedUser.id ? updatedUser : u);
    else if (updatedUser.role === UserRole.COUNSELOR) db.counselors = db.counselors.map((u: any) => u.id === updatedUser.id ? updatedUser : u);
    else if (updatedUser.role === UserRole.ADVISOR) db.advisors = db.advisors.map((u: any) => u.id === updatedUser.id ? updatedUser : u);
    else if (updatedUser.role === UserRole.ADMIN) db.admins = db.admins.map((u: any) => u.id === updatedUser.id ? updatedUser : u);
    this.saveToDb(db.students, db.counselors, db.advisors, db.admins);
  },

  verifyLogin(id: string, password: string, role: UserRole): { success: boolean; error?: string; user?: User } {
    const db = this.getDb();
    let list: User[] = [];
    if (role === UserRole.STUDENT) list = db.students;
    else if (role === UserRole.COUNSELOR) list = db.counselors;
    else if (role === UserRole.ADVISOR) list = db.advisors;
    else if (role === UserRole.ADMIN) list = db.admins;
    
    const user = list.find((u: User) => u.id === id);
    if (!user) return { success: false, error: '账号不存在' };
    if (user.password !== password) return { success: false, error: '密码错误' };
    return { success: true, user };
  }
};
