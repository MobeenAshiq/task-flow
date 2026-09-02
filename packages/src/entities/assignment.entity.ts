import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('assignments')
export class AssignmentEntity extends BaseEntity {
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  starterCode?: string;
}
