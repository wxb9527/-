
import { Counselor, UserRole, Mood } from './types';

export const MOCK_COUNSELORS: Counselor[] = [
  {
    id: 'c1',
    name: '张老师',
    role: UserRole.COUNSELOR,
    avatar: 'https://picsum.photos/id/1011/200/200',
    specialization: '压力管理与学业焦虑',
    phone: '138-0000-0001',
    availability: ['周一 09:00', '周二 14:00', '周四 10:00']
  },
  {
    id: 'c2',
    name: '李教授',
    role: UserRole.COUNSELOR,
    avatar: 'https://picsum.photos/id/1027/200/200',
    specialization: '人际关系与情感咨询',
    phone: '138-0000-0002',
    availability: ['周三 15:00', '周五 09:00', '周五 16:00']
  },
  {
    id: 'c3',
    name: '王医师',
    role: UserRole.COUNSELOR,
    avatar: 'https://picsum.photos/id/1025/200/200',
    specialization: '情绪障碍与深度治疗',
    phone: '138-0000-0003',
    availability: ['周一 14:00', '周三 10:00', '周六 09:00']
  }
];

export const MOOD_CONFIG = {
  [Mood.EXCELLENT]: { icon: 'fa-laugh-beam', label: '非常好', color: 'text-green-500', bg: 'bg-green-100' },
  [Mood.GOOD]: { icon: 'fa-smile', label: '还不错', color: 'text-blue-500', bg: 'bg-blue-100' },
  [Mood.NEUTRAL]: { icon: 'fa-meh', label: '一般般', color: 'text-gray-500', bg: 'bg-gray-100' },
  [Mood.SAD]: { icon: 'fa-frown', label: '有点难过', color: 'text-orange-500', bg: 'bg-orange-100' },
  [Mood.CRISIS]: { icon: 'fa-sad-tear', label: '需要帮助', color: 'text-red-600', bg: 'bg-red-100' }
};
