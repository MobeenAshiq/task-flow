import { Controller, Post, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendPinDto } from './dto/send-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return { success: true, response: result };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return { success: true, response: result };
  }

  @Post('send-pin')
  async sendPin(@Body() sendPinDto: SendPinDto) {
    const result = await this.authService.sendPin(sendPinDto);
    return { success: true, response: result };
  }

  @Post('verify-pin')
  async verifyPin(@Body() verifyPinDto: VerifyPinDto) {
    const result = await this.authService.verifyPin(verifyPinDto);
    return { success: true, response: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    const result = await this.authService.getProfile(req.user.id);
    return { success: true, response: result };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const result = await this.authService.updateProfile(req.user.id, dto);
    return { success: true, response: result };
  }
}
