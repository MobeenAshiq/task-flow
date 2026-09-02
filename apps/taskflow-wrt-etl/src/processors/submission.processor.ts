import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionEntity, SubmissionStatus } from '@taskflow/shared';
import { SUBMISSION_QUEUE, SubmissionJobType } from '../constants/queue.constants';
import { SubmissionJobPayload } from '../interfaces/submission-job.interface';
import { CodeRunnerService } from '../services/code-runner.service';

@Processor(SUBMISSION_QUEUE)
export class SubmissionProcessor extends WorkerHost {
  private readonly logger = new Logger(SubmissionProcessor.name);

  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly submissionRepository: Repository<SubmissionEntity>,
    private readonly codeRunnerService: CodeRunnerService,
  ) {
    super();
  }

  async process(job: Job<SubmissionJobPayload, any, string>): Promise<any> {
    if (job.name !== SubmissionJobType.PROCESS_SUBMISSION) {
      return;
    }

    const { submissionId, code, language, testCases, timeLimitMs, memoryLimitMb } = job.data;
    this.logger.log(`[Worker] Processing submission job ${job.id} for Submission: ${submissionId}`);

    // 1. Mark status as PROCESSING
    await this.submissionRepository.update(submissionId, {
      status: SubmissionStatus.PROCESSING,
    });

    try {
      // 2. Execute isolated code runner
      const outcome = await this.codeRunnerService.execute(
        code,
        language,
        testCases,
        timeLimitMs,
        memoryLimitMb,
      );

      // 3. Persist results back to PostgreSQL
      await this.submissionRepository.update(submissionId, {
        status: outcome.status,
        score: outcome.score,
        maxScore: outcome.maxScore,
        testResults: outcome.testResults,
        executionTimeMs: outcome.executionTimeMs,
        memoryUsedKb: outcome.memoryUsedKb,
        executionLogs: outcome.executionLogs,
      });

      this.logger.log(`[Worker] Successfully completed submission ${submissionId} (Status: ${outcome.status}, Score: ${outcome.score}/${outcome.maxScore})`);
      return outcome;
    } catch (error: any) {
      this.logger.error(`[Worker] Execution error for submission ${submissionId}: ${error?.message}`, error?.stack);

      await this.submissionRepository.update(submissionId, {
        status: SubmissionStatus.RUNTIME_ERROR,
        executionLogs: error?.message || 'Execution error occurred',
      });

      throw error;
    }
  }
}
