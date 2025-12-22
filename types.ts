
export enum UserRole {
  STUDENT = 'STUDENT',
  COUNSELOR = 'COUNSELOR',
  ADVISOR = 'ADVISOR',
  ADMIN = 'ADMIN'
}

export enum Mood {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  NEUTRAL = 'NEUTRAL',
  SAD = 'SAD',
  CRISIS = 'CRISIS'
}

export type HealthTag = '健康' | '亚健康' | '不健康';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  password?: string;
  isOnline?: boolean;
  phone?: string;
  college?: string;
  class?: string;
  gender?: '男' | '女';
  healthTag?: HealthTag;
  specialization?: string; // 咨询师专有
}

export interface Counselor extends User {
  specialization: string;
  phone: string;
  availability: string[];
}

export interface MoodRecord {
  id: string;
  studentId: string;
  mood: Mood;
  timestamp: number;
  note?: string;
}

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  counselorId: string;
  counselorName: string;
  dateTime: string;
  location: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  timestamp: number;
  locationUpdated?: boolean; // 地点是否已修改且未被学生确认
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}
