import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CourseEntity,
  CourseMembershipEntity,
  MembershipStatus,
  UserEntity,
  UserRole,
} from '@taskflow/shared';
import { CreateCourseDto } from './dto/create-course.dto';
import { JoinCourseDto } from './dto/join-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepo: Repository<CourseEntity>,
    @InjectRepository(CourseMembershipEntity)
    private readonly membershipRepo: Repository<CourseMembershipEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createCourse(teacherId: string, dto: CreateCourseDto): Promise<CourseEntity> {
    let joinCode = this.generateJoinCode();
    let isUnique = false;

    // Guarantee unique 6-digit join code
    for (let attempts = 0; attempts < 10; attempts++) {
      const existing = await this.courseRepo.findOne({ where: { joinCode } });
      if (!existing) {
        isUnique = true;
        break;
      }
      joinCode = this.generateJoinCode();
    }

    if (!isUnique) {
      throw new ConflictException('Failed to generate unique join code. Please try again.');
    }

    const course = this.courseRepo.create({
      title: dto.title,
      description: dto.description,
      category: dto.category || 'Development',
      coverImage: dto.coverImage || '/course_webdev.jpg',
      level: dto.level || 'Beginner',
      rating: 4.9,
      joinCode,
      teacherId,
    });

    return await this.courseRepo.save(course);
  }

  async joinCourse(studentId: string, dto: JoinCourseDto): Promise<CourseMembershipEntity> {
    const formattedCode = dto.joinCode.trim().toUpperCase();
    const course = await this.courseRepo.findOne({ where: { joinCode: formattedCode } });

    if (!course) {
      throw new NotFoundException(`No course found with join code: ${formattedCode}`);
    }

    // Check if student is already enrolled
    const existingMembership = await this.membershipRepo.findOne({
      where: { courseId: course.id, studentId },
    });

    if (existingMembership) {
      throw new ConflictException('You are already enrolled in this course.');
    }

    const membership = this.membershipRepo.create({
      courseId: course.id,
      studentId,
      status: MembershipStatus.PENDING,
    });

    return await this.membershipRepo.save(membership);
  }

  async getCoursesForUser(user: { id: string; role: UserRole }) {
    if (user.role === UserRole.TEACHER || user.role === UserRole.ADMIN) {
      const courses = await this.courseRepo.find({
        where: { teacherId: user.id },
        relations: { assignments: true, memberships: true },
        order: { createdAt: 'DESC' },
      });

      return courses.map((c) => ({
        ...c,
        studentCount: c.memberships?.length || 0,
        assignmentCount: c.assignments?.length || 0,
      }));
    } else {
      // Student enrolled courses
      const memberships = await this.membershipRepo.find({
        where: { studentId: user.id },
        relations: { course: { teacher: true, assignments: true } },
        order: { createdAt: 'DESC' },
      });

      return memberships.map((m) => ({
        ...m.course,
        teacherName: m.course?.teacher?.name || m.course?.teacher?.email,
        assignmentCount: m.course?.assignments?.length || 0,
        membershipStatus: m.status,
      }));
    }
  }

  async getCourseById(courseId: string, userId: string) {
    const course = await this.courseRepo.findOne({
      where: { id: courseId },
      relations: {
        teacher: true,
        assignments: { submissions: true },
        memberships: { student: true },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found`);
    }

    const isTeacher = course.teacherId === userId;
    const isStudentEnrolled = course.memberships.some((m) => m.studentId === userId);

    if (!isTeacher && !isStudentEnrolled) {
      throw new ForbiddenException('You do not have access to this course.');
    }

    return {
      ...course,
      studentCount: course.memberships.length,
      roster: course.memberships.map((m) => ({
        id: m.student.id,
        name: m.student.name,
        email: m.student.email,
        phone: m.student.phone,
        isApproved: m.student.isApproved,
        membershipStatus: m.status || MembershipStatus.APPROVED,
        joinedAt: m.createdAt,
      })),
    };
  }

  async getStudentsForCourse(courseId: string, teacherId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.teacherId !== teacherId) {
      throw new ForbiddenException('Only the course teacher can access student approvals.');
    }

    const memberships = await this.membershipRepo.find({
      where: { courseId },
      relations: { student: true },
      order: { createdAt: 'DESC' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      studentId: m.student.id,
      name: m.student.name,
      email: m.student.email,
      phone: m.student.phone || 'Not provided',
      avatarUrl: m.student.avatarUrl,
      status: m.status || MembershipStatus.PENDING,
      isApproved: m.student.isApproved,
      joinedAt: m.createdAt,
    }));
  }

  async approveStudentInCourse(courseId: string, studentId: string, teacherId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.teacherId !== teacherId) {
      throw new ForbiddenException('Only the course teacher can approve students.');
    }

    const membership = await this.membershipRepo.findOne({
      where: { courseId, studentId },
    });
    if (!membership) {
      throw new NotFoundException('Student membership not found');
    }

    membership.status = MembershipStatus.APPROVED;
    await this.membershipRepo.save(membership);

    // Also set user isApproved flag
    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (student) {
      student.isApproved = true;
      await this.userRepo.save(student);
    }

    return { success: true, message: 'Student approved successfully' };
  }

  async rejectStudentInCourse(courseId: string, studentId: string, teacherId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || course.teacherId !== teacherId) {
      throw new ForbiddenException('Only the course teacher can reject students.');
    }

    const membership = await this.membershipRepo.findOne({
      where: { courseId, studentId },
    });
    if (!membership) {
      throw new NotFoundException('Student membership not found');
    }

    membership.status = MembershipStatus.REJECTED;
    await this.membershipRepo.save(membership);

    return { success: true, message: 'Student rejected successfully' };
  }

  private generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getPublicCatalog(): Promise<any[]> {
    const courses = await this.courseRepo.find({
      relations: { teacher: true, memberships: true, assignments: true },
      order: { createdAt: 'DESC' },
      take: 12,
    });

    return courses.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      joinCode: c.joinCode,
      teacherId: c.teacherId,
      createdAt: c.createdAt,
      studentCount: c.memberships?.length || 0,
      assignmentCount: c.assignments?.length || 0,
      teacherName: c.teacher?.name || c.teacher?.email || 'Faculty Instructor',
      category: c.category || 'Development',
      coverImage: c.coverImage || '/course_webdev.jpg',
      level: c.level || 'Beginner',
      rating: c.rating || 4.9,
    }));
  }
}
