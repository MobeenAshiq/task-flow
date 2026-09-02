export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum ExecutionLanguage {
  JAVASCRIPT = 'JAVASCRIPT',
  TYPESCRIPT = 'TYPESCRIPT',
  PYTHON = 'PYTHON',
  CPP = 'CPP',
  NODEJS = 'NODEJS',
}

export enum SubmissionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  COMPILATION_ERROR = 'COMPILATION_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  joinCode: string;
  teacherId: string;
  createdAt: string;
  studentCount?: number;
  assignmentCount?: number;
  teacherName?: string;
}

export interface Lecture {
  id: string;
  title: string;
  content: string;
  date: string;
  courseId: string;
  creatorId: string;
  createdAt: string;
}

export interface RosterEntry {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}

export interface CourseDetail extends Course {
  roster?: RosterEntry[];
}

export interface AssignmentSubmissionSummary {
  id: string;
  status: SubmissionStatus;
  language: ExecutionLanguage;
  submittedAt: string;
  grade?: number | null;
  score?: number | null;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  starterCode?: string;
  allowedLanguages: ExecutionLanguage[];
  dueDate?: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  courseId?: string;
  createdAt: string;
  submission?: AssignmentSubmissionSummary | null;
}

export interface SubmissionRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  code: string;
  language: ExecutionLanguage;
  status: SubmissionStatus;
  score: number;
  maxScore: number;
  grade?: number | null;
  feedback?: string | null;
  gradedAt?: string | null;
  gradedByName?: string | null;
  submittedAt: string;
  isLate: boolean;
}
