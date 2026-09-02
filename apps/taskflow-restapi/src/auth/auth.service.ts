import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interface/auth-response.interface';

@Injectable()
export class AuthService {
  async login(dto: LoginDto): Promise<AuthResponse> {
    return {
      accessToken: 'dummy-access-token',
      user: { id: 'usr_1', email: dto.email },
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    return {
      accessToken: 'dummy-access-token',
      user: { id: 'usr_1', email: dto.email },
    };
  }
}
