import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SUBMISSION_QUEUE, SubmissionJobType } from '../constants/queue.constants';
import { SubmissionJobPayload } from '../interfaces/submission-job.interface';

@Injectable()
export class SubmissionQueueProducer {
  private readonly logger = new Logger(SubmissionQueueProducer.name);

  constructor(
    @InjectQueue(SUBMISSION_QUEUE) private readonly submissionQueue: Queue,
  ) {}

  async addSubmissionJob(payload: SubmissionJobPayload) {
    this.logger.log(`Enqueueing submission job for ID: ${payload.submissionId}`);

    const job = await this.submissionQueue.add(
      SubmissionJobType.PROCESS_SUBMISSION,
      payload,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: { age: 3600 }, // retain completed jobs for 1 hour
        removeOnFail: { age: 86400 },    // retain failed jobs for 24 hours
      },
    );

    return { jobId: job.id };
  }
}
