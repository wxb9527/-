
export enum UserRole {
  STUDENT = 'STUDENT',
  COUNSELOR = 'COUNSELOR',
  ADVISOR = 'ADVISOR'
}

export enum Mood {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  NEUTRAL = 'NEUTRAL',
  SAD = 'SAD',
  CRISIS = 'CRISIS'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  isOnline?: boolean;
  phone?: string;
  college?: string;
  class?: string;
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
  counselorId: string;
  counselorName: string;
  dateTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}
