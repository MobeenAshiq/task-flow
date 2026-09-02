import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { SubmissionEntity } from './submission.entity';
import { CourseEntity } from './course.entity';
import { TestCase } from '../interfaces/test-case.interface';
import { ExecutionLanguage } from '../enums/execution-language.enum';

@Entity('assignments')
export class AssignmentEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  starterCode?: string;

  @Column({
    type: 'enum',
    enum: ExecutionLanguage,
    default: ExecutionLanguage.NODEJS,
  })
  language: ExecutionLanguage;

  @Column({ type: 'jsonb', default: [] })
  testCases: TestCase[];

  @Column({ type: 'int', default: 2000 })
  timeLimitMs: number; // e.g. 2000ms

  @Column({ type: 'int', default: 128 })
  memoryLimitMb: number; // e.g. 128MB

  @Column({ type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  // Course Relation
  @Column({ type: 'uuid', nullable: true })
  @Index()
  courseId?: string;

  @ManyToOne(() => CourseEntity, (course) => course.assignments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity;

  // Creator Foreign key reference
  @Column({ type: 'uuid' })
  @Index()
  creatorId: string;

  // Relations
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: UserEntity;

  @OneToMany(() => SubmissionEntity, (submission) => submission.assignment)
  submissions: SubmissionEntity[];
}
