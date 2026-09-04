import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@taskflow/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JoinCourseDto } from './dto/join-course.dto';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async createCourse(@Req() req: any, @Body() dto: CreateCourseDto) {
    const course = await this.coursesService.createCourse(req.user.id, dto);
    return { success: true, response: course };
  }

  @Post('join')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async joinCourse(@Req() req: any, @Body() dto: JoinCourseDto) {
    const membership = await this.coursesService.joinCourse(req.user.id, dto);
    return { success: true, response: membership };
  }

  @Get()
  async getMyCourses(@Req() req: any) {
    const courses = await this.coursesService.getCoursesForUser(req.user);
    return { success: true, response: courses };
  }

  @Get(':id')
  async getCourseById(@Req() req: any, @Param('id') id: string) {
    const course = await this.coursesService.getCourseById(id, req.user.id);
    return { success: true, response: course };
  }

  @Get(':id/students')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getStudentsForCourse(@Req() req: any, @Param('id') id: string) {
    const students = await this.coursesService.getStudentsForCourse(id, req.user.id);
    return { success: true, response: students };
  }

  @Patch(':id/students/:studentId/approve')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async approveStudent(
    @Req() req: any,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.coursesService.approveStudentInCourse(id, studentId, req.user.id);
    return { success: true, response: result };
  }

  @Patch(':id/students/:studentId/reject')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async rejectStudent(
    @Req() req: any,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.coursesService.rejectStudentInCourse(id, studentId, req.user.id);
    return { success: true, response: result };
  }
}
