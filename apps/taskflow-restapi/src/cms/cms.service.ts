import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsContentEntity } from '@taskflow/shared';
import { CreateCmsContentDto } from './dto/create-cms-content.dto';
import { UpdateCmsContentDto } from './dto/update-cms-content.dto';

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(CmsContentEntity)
    private readonly cmsRepository: Repository<CmsContentEntity>,
  ) {}

  async getPublicContent(type?: string): Promise<CmsContentEntity[]> {
    const where: any = { isPublished: true };
    if (type) {
      where.type = type;
    }
    return this.cmsRepository.find({
      where,
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async getAllContent(type?: string): Promise<CmsContentEntity[]> {
    const where: any = {};
    if (type) {
      where.type = type;
    }
    return this.cmsRepository.find({
      where,
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(idOrKey: string): Promise<CmsContentEntity> {
    const item = await this.cmsRepository.findOne({
      where: [{ id: idOrKey }, { key: idOrKey }],
    });
    if (!item) {
      throw new NotFoundException(`CMS content item '${idOrKey}' not found.`);
    }
    return item;
  }

  async create(dto: CreateCmsContentDto): Promise<CmsContentEntity> {
    const existing = await this.cmsRepository.findOne({ where: { key: dto.key } });
    if (existing) {
      Object.assign(existing, dto);
      return this.cmsRepository.save(existing);
    }
    const newItem = this.cmsRepository.create(dto);
    return this.cmsRepository.save(newItem);
  }

  async update(id: string, dto: UpdateCmsContentDto): Promise<CmsContentEntity> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.cmsRepository.save(item);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const item = await this.findOne(id);
    await this.cmsRepository.remove(item);
    return { success: true };
  }

  async seedDefaults(): Promise<{ count: number; items: CmsContentEntity[] }> {
    const defaultItems: Partial<CmsContentEntity>[] = [
      // Top Announcement Bar
      {
        key: 'announcement-top-bar',
        type: 'announcement',
        title: 'TaskFlow 2.0 Live — Interactive Live Sandbox Execution & Verified Certificates!',
        subtitle: 'Join thousands of learners building real code projects today.',
        badge: 'Live Now',
        linkUrl: '/courses',
        isPublished: true,
        order: 1,
      },
      // Hero Banner Configuration
      {
        key: 'hero-banner-main',
        type: 'banner',
        title: 'Master Real-World Development with Interactive Sandbox Execution',
        subtitle: 'Join an immersive learning ecosystem with live code evaluation, Socratic AI assistance, and instructor-verified certification.',
        badge: 'Interactive Learning Platform 2.0',
        linkUrl: '/courses',
        isPublished: true,
        order: 1,
      },
      // Topics / Categories
      {
        key: 'topic-dev',
        type: 'topic',
        title: 'Development & Coding',
        subtitle: 'Interactive Labs & Live Run Sandbox',
        badge: 'Popular',
        linkUrl: '/courses?category=Development',
        icon: 'Code',
        metadata: { color: 'emerald' },
        isPublished: true,
        order: 1,
      },
      {
        key: 'topic-ai',
        type: 'topic',
        title: 'Artificial Intelligence & ML',
        subtitle: 'Live Python & Model Execution',
        badge: 'Trending',
        linkUrl: '/courses?category=AI',
        icon: 'Cpu',
        metadata: { color: 'purple' },
        isPublished: true,
        order: 2,
      },
      {
        key: 'topic-ui',
        type: 'topic',
        title: 'UI/UX & Product Design',
        subtitle: 'Modern Design Systems & Prototyping',
        badge: 'Design',
        linkUrl: '/courses?category=UIUX',
        icon: 'Layers',
        metadata: { color: 'pink' },
        isPublished: true,
        order: 3,
      },
      {
        key: 'topic-cloud',
        type: 'topic',
        title: 'Cloud & Infrastructure',
        subtitle: 'DevOps, Containers & API Architecture',
        badge: 'DevOps',
        linkUrl: '/courses?category=Cloud',
        icon: 'Globe',
        metadata: { color: 'cyan' },
        isPublished: true,
        order: 4,
      },
      // Features Bar
      {
        key: 'feature-sandbox',
        type: 'feature',
        title: 'Live Sandbox Execution',
        subtitle: 'Run Python, C++, Node.js code securely in your browser.',
        icon: 'Terminal',
        isPublished: true,
        order: 1,
      },
      {
        key: 'feature-ai',
        type: 'feature',
        title: 'Socratic AI Assistant',
        subtitle: 'Get targeted hints and automated static analysis without spoiling solutions.',
        icon: 'Sparkles',
        isPublished: true,
        order: 2,
      },
      {
        key: 'feature-certs',
        type: 'feature',
        title: 'Verified Certificates',
        subtitle: 'Earn shareable credentials upon completing course requirements and assignments.',
        icon: 'Award',
        isPublished: true,
        order: 3,
      },
      {
        key: 'feature-roster',
        type: 'feature',
        title: 'Teacher Approval Roster',
        subtitle: 'Instructors review and approve student join requests for guided learning.',
        icon: 'UserCheck',
        isPublished: true,
        order: 4,
      },
      // FAQs
      {
        key: 'faq-1',
        type: 'faq',
        title: 'How does code submission work on TaskFlow?',
        subtitle: 'Submissions are compiled and executed against automated test cases in real-time inside secure worker containers. Results and logs appear immediately on your dashboard.',
        isPublished: true,
        order: 1,
      },
      {
        key: 'faq-2',
        type: 'faq',
        title: 'Can instructors publish custom assignments and tests?',
        subtitle: 'Yes! Instructors can create rich courses, attach lectures, define test cases with hidden inputs/outputs, and manage student approval rosters.',
        isPublished: true,
        order: 2,
      },
      {
        key: 'faq-3',
        type: 'faq',
        title: 'What programming languages are supported in the sandbox?',
        subtitle: 'TaskFlow currently supports Python, Node.js/JavaScript, C++, Java, and Go with automated execution queues.',
        isPublished: true,
        order: 3,
      },
      {
        key: 'faq-4',
        type: 'faq',
        title: 'Is TaskFlow free for self-paced students?',
        subtitle: 'Yes, public catalog courses and open sandbox access are free for students. Instructor-guided cohorts require approval from course creators.',
        isPublished: true,
        order: 4,
      },
      // News & Announcements
      {
        key: 'news-v2-launch',
        type: 'news',
        title: 'TaskFlow 2.0 Released with Socratic AI Hints',
        subtitle: 'We have updated our evaluation engine to provide step-by-step guidance when test cases fail.',
        badge: 'Platform Release',
        linkUrl: '/courses',
        isPublished: true,
        order: 1,
      },
    ];

    const savedItems: CmsContentEntity[] = [];
    for (const itemData of defaultItems) {
      let existing = await this.cmsRepository.findOne({ where: { key: itemData.key } });
      if (existing) {
        Object.assign(existing, itemData);
        savedItems.push(await this.cmsRepository.save(existing));
      } else {
        const newItem = this.cmsRepository.create(itemData as CmsContentEntity);
        savedItems.push(await this.cmsRepository.save(newItem));
      }
    }

    return { count: savedItems.length, items: savedItems };
  }
}
