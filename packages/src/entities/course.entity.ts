import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import type { CourseMembershipEntity } from './course-membership.entity';
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

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'Development' })
  category: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage: string;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'Beginner' })
  level: string;

  @Column({ type: 'float', default: 4.9 })
  rating: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: UserEntity;

  @OneToMany('CourseMembershipEntity', (membership: any) => membership.course)
  memberships: CourseMembershipEntity[];

  @OneToMany(() => AssignmentEntity, (assignment) => assignment.course)
  assignments: AssignmentEntity[];
}
