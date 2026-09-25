import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('cms_contents')
export class CmsContentEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  subtitle?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;
}
