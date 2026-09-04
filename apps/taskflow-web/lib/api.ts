import { fetcher } from '@/lib/fetch';
import type {
  Assignment,
  AuthUser,
  Course,
  CourseDetail,
  ExecutionLanguage,
  Lecture,
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
    allowedLanguages?: ExecutionLanguage[];
    courseId: string;
    dueDate?: string;
    timeLimitMs?: number;
    memoryLimitMb?: number;
  }) =>
    fetcher<Assignment>('assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submit: (assignmentId: string, code: string, language: ExecutionLanguage) =>
    fetcher<{ id: string; status: string }>(`assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    }),
  listSubmissions: (assignmentId: string) =>
    fetcher<SubmissionRow[]>(`assignments/${assignmentId}/submissions`),
  grade: (submissionId: string, grade: number, feedback: string) =>
    fetcher<SubmissionRow>(`assignments/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      body: JSON.stringify({ grade, feedback }),
    }),
};

export interface CodeAnalysis {
  timeComplexity: string;
  spaceComplexity: string;
  styleSuggestions: string[];
  readabilityScore: number;
}

export interface SocraticHint {
  role: string;
  hint: string;
  guardrailEnforced: boolean;
  hasCodeSnippets: boolean;
}

export const aiApi = {
  analyzeCode: (studentCode: string, language: ExecutionLanguage) =>
    fetcher<CodeAnalysis>('ai/analyze-code', {
      method: 'POST',
      body: JSON.stringify({ studentCode, language }),
    }),
  socraticHint: (assignmentPrompt: string, studentCode: string, errorOutput?: string) =>
    fetcher<SocraticHint>('ai/socratic-hint', {
      method: 'POST',
      body: JSON.stringify({ assignmentPrompt, studentCode, errorOutput }),
    }),
  ask: (question: string, context?: string) =>
    fetcher<{ answer: string }>('ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    }),
};

export const lecturesApi = {
  listByCourse: (courseId: string) => fetcher<Lecture[]>(`lectures/course/${courseId}`),
  create: (payload: { title: string; content: string; date: string; courseId: string }) =>
    fetcher<Lecture>('lectures', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
