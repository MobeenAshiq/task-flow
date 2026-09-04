import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@taskflow/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AiService } from './ai.service';
import { GradeDraftDto } from './dto/grade-draft.dto';
import { GenerateAssignmentDto } from './dto/generate-assignment.dto';
import { SocraticHintDto } from './dto/socratic-hint.dto';
import { ExplainErrorDto } from './dto/explain-error.dto';
import { AnalyzeCodeDto } from './dto/analyze-code.dto';
import { ClassInsightsDto } from './dto/class-insights.dto';
import { AskQuestionDto } from './dto/ask-question.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // --- Teacher AI Endpoints ---

  @Post('grade-draft')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async generateGradingDraft(@Body() dto: GradeDraftDto) {
    const draft = await this.aiService.generateGradingDraft(dto);
    return { success: true, response: draft };
  }

  @Post('generate-assignment')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async generateAssignmentAssets(@Body() dto: GenerateAssignmentDto) {
    const assets = await this.aiService.generateAssignmentAssets(dto);
    return { success: true, response: assets };
  }

  @Post('class-insights')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async generateClassInsights(@Body() dto: ClassInsightsDto) {
    const insights = await this.aiService.generateClassInsights(dto);
    return { success: true, response: insights };
  }

  // --- Student Socratic AI Endpoints ---

  @Post('socratic-hint')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async getSocraticHint(@Body() dto: SocraticHintDto) {
    const hint = await this.aiService.getSocraticHint(dto);
    return { success: true, response: hint };
  }

  @Post('explain-error')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async explainError(@Body() dto: ExplainErrorDto) {
    const explanation = await this.aiService.explainError(dto);
    return { success: true, response: explanation };
  }

  @Post('analyze-code')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async analyzeCode(@Body() dto: AnalyzeCodeDto) {
    const analysis = await this.aiService.analyzeComplexityAndStyle(dto);
    return { success: true, response: analysis };
  }

  @Post('ask')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  async askQuestion(@Body() dto: AskQuestionDto) {
    const result = await this.aiService.askCodingQuestion(dto);
    return { success: true, response: result };
  }
}
