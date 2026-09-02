import { ExecutionLanguage, TestCase } from '@taskflow/shared';

export interface SubmissionJobPayload {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  code: string;
  language: ExecutionLanguage;
  testCases: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
}
