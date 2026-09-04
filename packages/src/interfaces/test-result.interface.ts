export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  error?: string;
}
