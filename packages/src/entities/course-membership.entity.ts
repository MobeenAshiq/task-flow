import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CourseEntity } from './course.entity';
import { UserEntity } from './user.entity';

import { MembershipStatus } from '../enums/membership-status.enum';

@Entity('course_memberships')
@Unique(['courseId', 'studentId'])
export class CourseMembershipEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  courseId: string;

  @Column({ type: 'uuid' })
  studentId: string;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.PENDING,
  })
  status: MembershipStatus;

  @ManyToOne(() => CourseEntity, (course) => course.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: CourseEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: UserEntity;
}
