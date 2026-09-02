import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import {
  UserEntity,
  CourseEntity,
  CourseMembershipEntity,
  AssignmentEntity,
  SubmissionEntity,
} from '@taskflow/shared';
import { SUBMISSION_QUEUE } from './constants/queue.constants';
import { SubmissionProcessor } from './processors/submission.processor';
import { CodeRunnerService } from './services/code-runner.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'taskflow'),
        entities: [
          UserEntity,
          CourseEntity,
          CourseMembershipEntity,
          AssignmentEntity,
          SubmissionEntity,
        ],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      SubmissionEntity,
      AssignmentEntity,
      CourseEntity,
      CourseMembershipEntity,
      UserEntity,
    ]),
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
  providers: [SubmissionProcessor, CodeRunnerService],
})
export class AppModule {}
