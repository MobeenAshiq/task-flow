import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SUBMISSION_QUEUE } from './constants/queue.constants';
import { SubmissionQueueProducer } from './producers/submission-queue.producer';

@Module({
  imports: [
    ConfigModule,
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
  providers: [SubmissionQueueProducer],
  exports: [SubmissionQueueProducer],
})
export class JobsModule {}
