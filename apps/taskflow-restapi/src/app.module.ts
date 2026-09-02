import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserEntity,
  CourseEntity,
  CourseMembershipEntity,
  AssignmentEntity,
  SubmissionEntity,
} from '@taskflow/shared';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { RedisModule } from './redis/redis.module';
import { JobsModule } from './jobs/jobs.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthModule } from './health/health.module';
import { AppLoggerModule } from './common/logger/logger.module';
import { RunnerModule } from './runner/runner.module';
import { AiModule } from './ai/ai.module';

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
        synchronize: true,
      }),
    }),
    AppLoggerModule,
    RedisModule,
    JobsModule,
    GatewaysModule,
    HealthModule,
    RunnerModule,
    AiModule,
    AuthModule,
    CoursesModule,
    AssignmentsModule,
  ],
})
export class AppModule {}
