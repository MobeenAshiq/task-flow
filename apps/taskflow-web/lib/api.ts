import { fetcher } from '@/lib/fetch';
import type {
  Assignment,
  AuthUser,
  Course,
  CourseDetail,
  ExecutionLanguage,
  SubmissionRow,
  UserRole,
} from '@/lib/types';

interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string };
}

export const authApi = {
  login: (email: string, password: string) =>
    fetcher<AuthResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string, role: UserRole) =>
    fetcher<AuthResponse>('auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    }),
  me: () => fetcher<AuthUser>('auth/me'),
};

export const coursesApi = {
  list: () => fetcher<Course[]>('courses'),
  get: (id: string) => fetcher<CourseDetail>(`courses/${id}`),
  create: (title: string, description: string) =>
    fetcher<Course>('courses', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),
  join: (joinCode: string) =>
    fetcher<{ id: string; courseId: string }>('courses/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode }),
    }),
};

export const assignmentsApi = {
  listByCourse: (courseId: string) =>
    fetcher<Assignment[]>(`assignments/course/${courseId}`),
  get: (id: string) => fetcher<Assignment>(`assignments/${id}`),
  create: (payload: {
    title: string;
    description: string;
    starterCode?: string;
    language?: ExecutionLanguage;
    courseId: string;
    dueDate?: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
  }) =>
    fetcher<Assignment>('assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submit: (assignmentId: string, code: string) =>
    fetcher<{ id: string; status: string }>(`assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  listSubmissions: (assignmentId: string) =>
    fetcher<SubmissionRow[]>(`assignments/${assignmentId}/submissions`),
  grade: (submissionId: string, grade: number, feedback: string) =>
    fetcher<SubmissionRow>(`assignments/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ grade, feedback }),
    }),
};
