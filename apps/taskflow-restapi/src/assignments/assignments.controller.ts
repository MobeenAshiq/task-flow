import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  async createAssignment(@Body() createAssignmentDto: CreateAssignmentDto) {
    const result = await this.assignmentsService.create(createAssignmentDto);
    return { success: true, response: result };
  }

  @Get(':id')
  async getAssignment(@Param('id') id: string) {
    const result = await this.assignmentsService.findOne(id);
    return { success: true, response: result };
  }

  @Post(':id/submit')
  async submitAssignment(
    @Param('id') assignmentId: string,
    @Body() submitDto: SubmitAssignmentDto,
  ) {
    const result = await this.assignmentsService.submit(assignmentId, submitDto);
    return { success: true, response: result };
  }
}
