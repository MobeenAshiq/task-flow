import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentEntity, SubmissionEntity, SubmissionStatus } from '@taskflow/shared';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
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
      ...dto,
      creatorId: creatorId || '00000000-0000-0000-0000-000000000000',
    });
    return await this.assignmentRepo.save(assignment);
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async submit(assignmentId: string, dto: SubmitAssignmentDto, studentId?: string) {
    const assignment = await this.findOne(assignmentId);

    // 1. Save pending submission in DB
    const submission = this.submissionRepo.create({
      studentId: studentId || '00000000-0000-0000-0000-000000000000',
      assignmentId: assignment.id,
      code: dto.code,
      language: assignment.language,
      status: SubmissionStatus.PENDING,
    });
    const savedSubmission = await this.submissionRepo.save(submission);

    // 2. Enqueue background evaluation job to Redis via BullMQ
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
