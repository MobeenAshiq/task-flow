import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionEntity, SubmissionStatus, TestResult } from '@taskflow/shared';
import { SUBMISSION_QUEUE, SubmissionJobType } from '../constants/queue.constants';
import { SubmissionJobPayload } from '../interfaces/submission-job.interface';

@Processor(SUBMISSION_QUEUE)
export class SubmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmissionProcessor.name);

  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly submissionRepository: Repository<SubmissionEntity>,
  ) {
    super();
  }

  async process(job: Job<SubmissionJobPayload, any, string>): Promise<any> {
    if (job.name !== SubmissionJobType.PROCESS_SUBMISSION) {
      return;
    }

    const { submissionId, code, testCases } = job.data;
    this.logger.log(`Processing submission job: ${job.id} (Submission ID: ${submissionId})`);

    // 1. Update status to PROCESSING
    await this.submissionRepository.update(submissionId, {
      status: SubmissionStatus.PROCESSING,
    });

    try {
      // 2. Mock Test Runner execution (Replace with Docker/Isolated Runtime call)
      const { status, score, maxScore, testResults, executionTimeMs } =
        await this.executeCodeAgainstTestCases(code, testCases);

      // 3. Persist results back to database
      await this.submissionRepository.update(submissionId, {
        status,
        score,
        maxScore,
        testResults,
        executionTimeMs,
      });

      this.logger.log(`Completed submission ${submissionId} with status: ${status}`);
    } catch (error: any) {
      this.logger.error(`Failed executing submission ${submissionId}`, error?.stack);

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.RUNTIME_ERROR,
        executionLogs: error?.message || 'Fatal execution failure',
      });

      throw error; // Let BullMQ handle retries
    }
  }

  private async executeCodeAgainstTestCases(
    code: string,
    testCases: any[],
  ): Promise<{
    status: SubmissionStatus;
    score: number;
    maxScore: number;
    testResults: TestResult[];
    executionTimeMs: number;
  }> {
    const testResults: TestResult[] = [];
    let passedCount = 0;

    for (const tc of testCases || []) {
      // Evaluation logic
      const passed = true; // Simulated pass
      if (passed) passedCount++;

      testResults.push({
        testCaseId: tc.id,
        passed,
        actualOutput: tc.expectedOutput,
        expectedOutput: tc.expectedOutput,
        executionTimeMs: 15,
      });
    }

    const total = testCases?.length || 1;
    const score = Math.round((passedCount / total) * 100);
    const status =
      passedCount === total ? SubmissionStatus.PASSED : SubmissionStatus.FAILED;

    return {
      status,
      score,
      maxScore: 100,
      testResults,
      executionTimeMs: 45,
    };
  }
}
