import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { CourseEntity } from './course.entity';

@Entity('lectures')
export class LectureEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'emerald' })
  colorTag?: string;

  // The day the lecture was/will be given — distinct from createdAt, since a
  // teacher may log a lecture after the fact or schedule one ahead.
  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'uuid' })
  @Index()
  courseId: string;

  @ManyToOne(() => CourseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: CourseEntity;

  @Column({ type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: UserEntity;
}
