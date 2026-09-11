import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { SubmissionEntity } from '@taskflow/shared';
import { SUBMISSION_QUEUE } from './constants/queue.constants';
import { SubmissionQueueProducer } from './producers/submission-queue.producer';
import { SubmissionProcessor } from './processors/submission.processor';
import { CodeRunnerService } from './services/code-runner.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SubmissionEntity]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        return {
          connection: redisUrl
            ? new Redis(redisUrl, { maxRetriesPerRequest: null })
            : new Redis({
                host: configService.get<string>('REDIS_HOST', 'localhost'),
                port: configService.get<number>('REDIS_PORT', 6379),
                maxRetriesPerRequest: null,
              }),
        };
      },
    }),
    BullModule.registerQueue({
      name: SUBMISSION_QUEUE,
    }),
  ],
  providers: [SubmissionQueueProducer, SubmissionProcessor, CodeRunnerService],
  exports: [SubmissionQueueProducer],
})
export class JobsModule {}
