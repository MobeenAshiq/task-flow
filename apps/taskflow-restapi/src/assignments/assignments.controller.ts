import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@taskflow/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard) // Protect all routes in this controller
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // Only TEACHER or ADMIN can create an assignment
  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async createAssignment(@Body() createAssignmentDto: CreateAssignmentDto) {
    const result = await this.assignmentsService.create(createAssignmentDto);
    return { success: true, response: result };
  }

  // Only STUDENT can submit code/answers to an assignment
  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  async submitAssignment(
    @Param('id') assignmentId: string,
    @Body() submitDto: SubmitAssignmentDto
  ) {
    const result = await this.assignmentsService.submit(
      assignmentId,
      submitDto
    );
    return { success: true, response: result };
  }

  // Both TEACHER and STUDENT can view assignment details
  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.STUDENT)
  async getAssignment(@Param('id') id: string) {
    const result = await this.assignmentsService.findOne(id);
    return { success: true, response: result };
  }
}
