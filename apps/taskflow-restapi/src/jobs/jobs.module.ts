import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionEntity } from '@taskflow/shared';
import { SUBMISSION_QUEUE } from './constants/queue.constants';
import { SubmissionQueueProducer } from './producers/submission-queue.producer';
import { SubmissionProcessor } from './processors/submission.processor';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SubmissionEntity]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue({
      name: SUBMISSION_QUEUE,
    }),
  ],
  providers: [SubmissionQueueProducer, SubmissionProcessor],
  exports: [SubmissionQueueProducer],
})
export class JobsModule {}
