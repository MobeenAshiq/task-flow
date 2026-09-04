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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async createAssignment(@Req() req: any, @Body() dto: CreateAssignmentDto) {
    const assignment = await this.assignmentsService.create(dto, req.user.id);
    return { success: true, response: assignment };
  }

  @Get('course/:courseId')
  async getByCourse(@Req() req: any, @Param('courseId') courseId: string) {
    const assignments = await this.assignmentsService.findByCourse(courseId, req.user);
    return { success: true, response: assignments };
  }

  @Get(':id')
  async getAssignment(@Param('id') id: string) {
    const assignment = await this.assignmentsService.findOne(id);
    return { success: true, response: assignment };
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async submitAssignment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    const submission = await this.assignmentsService.submit(id, dto, req.user.id);
    return { success: true, response: submission };
  }

  @Post(':id/run')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async runAssignmentCode(
    @Param('id') id: string,
    @Body() dto: { code: string; language: any },
  ) {
    const result = await this.assignmentsService.runCode(id, dto);
    return { success: true, response: result };
  }

  @Get(':id/submissions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getSubmissions(@Req() req: any, @Param('id') id: string) {
    const submissions = await this.assignmentsService.getSubmissionsForAssignment(id, req.user.id);
    return { success: true, response: submissions };
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async gradeSubmission(
    @Req() req: any,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    const graded = await this.assignmentsService.gradeSubmission(submissionId, req.user.id, dto);
    return { success: true, response: graded };
  }
}
