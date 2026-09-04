import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity, CourseMembershipEntity, LectureEntity } from '@taskflow/shared';
import { AuthModule } from '../auth/auth.module';
import { LecturesController } from './lectures.controller';
import { LecturesService } from './lectures.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LectureEntity, CourseEntity, CourseMembershipEntity]),
    AuthModule,
  ],
  controllers: [LecturesController],
  providers: [LecturesService],
})
export class LecturesModule {}
