import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity, CourseMembershipEntity, LectureEntity, UserRole } from '@taskflow/shared';
import { CreateLectureDto } from './dto/create-lecture.dto';

@Injectable()
export class LecturesService {
  constructor(
    @InjectRepository(LectureEntity)
    private readonly lectureRepo: Repository<LectureEntity>,
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    @InjectRepository(CourseMembershipEntity)
    private readonly membershipRepo: Repository<CourseMembershipEntity>,
  ) {}

  async create(teacherId: string, dto: CreateLectureDto): Promise<LectureEntity> {
    const course = await this.courseRepo.findOne({ where: { id: dto.courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('Only the course teacher can post a lecture here.');
    }

    const lecture = this.lectureRepo.create({
      title: dto.title,
      content: dto.content,
      date: new Date(dto.date),
      courseId: dto.courseId,
      creatorId: teacherId,
    });
    return await this.lectureRepo.save(lecture);
  }

  async findByCourse(
    courseId: string,
    user: { id: string; role: UserRole },
  ): Promise<LectureEntity[]> {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const isTeacher = course.teacherId === user.id;
    if (!isTeacher && user.role !== UserRole.ADMIN) {
      const membership = await this.membershipRepo.findOne({
        where: { courseId, studentId: user.id },
      });
      if (!membership) {
        throw new ForbiddenException('You do not have access to this course.');
      }
    }

    return await this.lectureRepo.find({
      where: { courseId },
      order: { date: 'DESC' },
    });
  }
}
