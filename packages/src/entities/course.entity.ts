import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { CourseMembershipEntity } from './course-membership.entity';
import { AssignmentEntity } from './assignment.entity';

@Entity('courses')
export class CourseEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10, unique: true })
  joinCode: string;

  @Column({ type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: UserEntity;

  @OneToMany(() => CourseMembershipEntity, (membership) => membership.course)
  memberships: CourseMembershipEntity[];

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.course)
  assignments: AssignmentEntity[];
}
