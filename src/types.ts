export interface School {
  id?: string;
  name: string;
  region?: string;
  subscriptionTier: 'FREE' | 'PRO' | 'PREMIUM';
  createdAt: any;
}

export interface Teacher {
  id?: string;
  schoolId: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  institutionName?: string;
  isAdmin: boolean;
  createdAt: any;
}

export interface Class {
  id?: string;
  schoolId: string;
  teacherId: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  createdAt: any;
}

export interface Student {
  id?: string;
  schoolId: string;
  classId: string;
  name: string;
  rollNo?: string; // USN or Roll Number
  section?: string;
  email?: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
  parentPhone?: string;
  age?: number;
  gender?: string;
  branch?: string;
  year?: string;
  skillsToLearn?: string[];
  skillsOffered?: string[];
}

export interface Skill {
  id?: string;
  studentId: string;
  schoolId: string;
  name: string;
  proficiency: number; // 0-100
  category?: string;
  updatedAt: any;
}

export interface Activity {
  id?: string;
  studentId: string;
  schoolId: string;
  name: string;
  type: string;
  status: 'PENDING' | 'COMPLETED';
  score?: number;
  date: string;
}

export interface Attendance {
  id?: string;
  studentId: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
  recordedAt: any;
}

export interface Lesson {
  id?: string;
  schoolId: string;
  classId: string;
  date: string;
  topic: string;
  type: 'THEORY' | 'LAB';
  coveredTopics?: string[];
  notes?: string;
  loggedBy: string;
}

export interface Project {
  id?: string;
  schoolId: string;
  name: string;
  description: string;
  techStack: string[];
  status: 'ONGOING' | 'COMPLETED';
  studentIds: string[];
  githubUrl?: string;
  createdAt: any;
}

export interface Exam {
  id?: string;
  schoolId: string;
  classId: string;
  subject: string;
  date: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'LAB';
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

export interface Notification {
  id?: string;
  schoolId: string;
  title: string;
  message: string;
  type: 'EXAM' | 'ATTENDANCE' | 'SYSTEM' | 'GENERAL';
  date: string;
  read: boolean;
}

export interface SkillRequest {
  id?: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  skillName: string;
  type: 'NEED_HELP' | 'OFFER_HELP';
  description?: string;
  status: 'OPEN' | 'MATCHED' | 'CLOSED';
  createdAt: any;
}
