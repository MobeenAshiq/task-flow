import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('submissions')
export class SubmissionEntity extends BaseEntity {
  @Column()
  assignmentId: string;

  @Column({ nullable: true })
  userId?: string;

  @Column('text')
  code: string;

  @Column({ default: 'SUBMITTED' })
  status: string;
}
