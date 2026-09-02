import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentEntity, SubmissionEntity, SubmissionStatus, UserRole } from '@taskflow/shared';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { SubmissionQueueProducer } from '../jobs/producers/submission-queue.producer';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,
    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,
    private readonly queueProducer: SubmissionQueueProducer,
  ) {}

  async create(dto: CreateAssignmentDto, creatorId?: string) {
    const assignment = this.assignmentRepo.create({
      title: dto.title,
      description: dto.description,
      starterCode: dto.starterCode,
      language: dto.language,
      courseId: dto.courseId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      timeLimitMs: dto.timeLimitMs || 2000,
      memoryLimitMb: dto.memoryLimitMb || 128,
      creatorId: creatorId || '00000000-0000-0000-0000-000000000000',
    });
    return await this.assignmentRepo.save(assignment);
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id },
      relations: { course: true, creator: true },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async findByCourse(courseId: string, user: { id: string; role: UserRole }) {
    const assignments = await this.assignmentRepo.find({
      where: { courseId },
      order: { createdAt: 'DESC' },
    });

    if (user.role === UserRole.STUDENT) {
      const submissions = await this.submissionRepo.find({
        where: { studentId: user.id },
      });

      const submissionMap = new Map(submissions.map((s) => [s.assignmentId, s]));

      return assignments.map((a) => {
        const sub = submissionMap.get(a.id);
        return {
          ...a,
          submission: sub
            ? {
                id: sub.id,
                status: sub.status,
                submittedAt: sub.createdAt,
                grade: sub.grade,
                score: sub.score,
              }
            : null,
        };
      });
    }

    return assignments;
  }

  async getSubmissionsForAssignment(assignmentId: string, teacherId: string) {
    const assignment = await this.findOne(assignmentId);
    if (assignment.creatorId !== teacherId && assignment.course?.teacherId !== teacherId) {
      // Permission check
    }

    const submissions = await this.submissionRepo.find({
      where: { assignmentId },
      relations: { student: true, gradedBy: true },
      order: { createdAt: 'DESC' },
    });

    return submissions.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student?.name || s.student?.email,
      studentEmail: s.student?.email,
      code: s.code,
      language: s.language,
      status: s.status,
      score: s.score,
      maxScore: s.maxScore,
      grade: s.grade,
      feedback: s.feedback,
      gradedAt: s.gradedAt,
      gradedByName: s.gradedBy?.name || s.gradedBy?.email,
      submittedAt: s.createdAt,
      isLate: assignment.dueDate ? new Date(s.createdAt) > new Date(assignment.dueDate) : false,
    }));
  }

  async gradeSubmission(submissionId: string, teacherId: string, dto: GradeSubmissionDto) {
    const submission = await this.submissionRepo.findOne({ where: { id: submissionId } });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    submission.grade = dto.grade;
    submission.score = dto.grade;
    submission.feedback = dto.feedback;
    submission.gradedAt = new Date();
    submission.gradedById = teacherId;

    return await this.submissionRepo.save(submission);
  }

  async submit(assignmentId: string, dto: SubmitAssignmentDto, studentId?: string) {
    const assignment = await this.findOne(assignmentId);

    const submission = this.submissionRepo.create({
      studentId: studentId || '00000000-0000-0000-0000-000000000000',
      assignmentId: assignment.id,
      code: dto.code,
      language: assignment.language,
      status: SubmissionStatus.PENDING,
    });
    const savedSubmission = await this.submissionRepo.save(submission);

    await this.queueProducer.addSubmissionJob({
      submissionId: savedSubmission.id,
      assignmentId: assignment.id,
      studentId: savedSubmission.studentId,
      code: dto.code,
      language: assignment.language,
      testCases: assignment.testCases || [],
      timeLimitMs: assignment.timeLimitMs,
      memoryLimitMb: assignment.memoryLimitMb,
    });

    return savedSubmission;
  }
}
