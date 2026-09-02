import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { AssignmentEntity } from './assignment.entity';
import { SubmissionStatus } from '../enums/submission-status.enum';
import { ExecutionLanguage } from '../enums/execution-language.enum';
import { TestResult } from '../interfaces/test-result.interface';

@Entity('submissions')
@Index(['studentId', 'assignmentId']) // Composite index for efficient querying by student & assignment
export class SubmissionEntity extends BaseEntity {
  @Column({ type: 'text' })
  code: string;

  @Column({
    type: 'enum',
    enum: ExecutionLanguage,
  })
  language: ExecutionLanguage;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  @Index()
  status: SubmissionStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 100 })
  maxScore: number;

  @Column({ type: 'jsonb', nullable: true })
  testResults?: TestResult[];

  @Column({ type: 'text', nullable: true })
  executionLogs?: string;

  @Column({ type: 'int', nullable: true })
  executionTimeMs?: number;

  @Column({ type: 'int', nullable: true })
  memoryUsedKb?: number;

  // Teacher Manual Grading Fields
  @Column({ type: 'int', nullable: true })
  grade?: number;

  @Column({ type: 'text', nullable: true })
  feedback?: string;

  @Column({ type: 'timestamptz', nullable: true })
  gradedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  gradedById?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'gradedById' })
  gradedBy?: UserEntity;

  // Foreign keys
  @Column({ type: 'uuid' })
  studentId: string;

  @Column({ type: 'uuid' })
  assignmentId: string;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: UserEntity;

  @ManyToOne(() => AssignmentEntity, (assignment) => assignment.submissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment: AssignmentEntity;
}
