import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@taskflow/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LecturesService } from './lectures.service';
import { CreateLectureDto } from './dto/create-lecture.dto';

@Controller('lectures')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async create(@Req() req: any, @Body() dto: CreateLectureDto) {
    const lecture = await this.lecturesService.create(req.user.id, dto);
    return { success: true, response: lecture };
  }

  @Get('course/:courseId')
  async getByCourse(@Req() req: any, @Param('courseId') courseId: string) {
    const lectures = await this.lecturesService.findByCourse(courseId, req.user);
    return { success: true, response: lectures };
  }
}
