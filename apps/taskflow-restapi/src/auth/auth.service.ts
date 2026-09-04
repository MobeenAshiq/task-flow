import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '@taskflow/shared';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendPinDto } from './dto/send-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthResponse } from './interface/auth-response.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly pinStore = new Map<string, { pin: string; expiresAt: number }>();

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto & { name?: string; role?: UserRole; phone?: string }): Promise<AuthResponse> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = this.userRepo.create({
      name: dto.name || dto.email.split('@')[0],
      email: dto.email,
      password: dto.password,
      role: dto.role || UserRole.STUDENT,
      phone: dto.phone,
      isApproved: dto.role === UserRole.TEACHER || dto.role === UserRole.ADMIN,
    });
    const savedUser = await this.userRepo.save(user);

    const accessToken = this.jwtService.sign({
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    });

    return {
      accessToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        phone: savedUser.phone,
        isApproved: savedUser.isApproved,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
        phone: true,
        isApproved: true,
      },
    });

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isApproved: user.isApproved,
      },
    };
  }

  async sendPin(dto: SendPinDto) {
    const email = dto.email.toLowerCase().trim();
    if (!email.includes('@')) {
      throw new BadRequestException('Invalid email address format');
    }

    // Generate a 6-digit numeric OTP verification PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

    this.pinStore.set(email, { pin, expiresAt });
    this.logger.log(`🔑 Gmail Verification PIN generated for ${email}: ${pin}`);
    console.log(`\n==================================================`);
    console.log(`📧 GMAIL VERIFICATION PIN SENT TO ${email}: ${pin}`);
    console.log(`==================================================\n`);

    return {
      message: `Verification PIN has been sent to ${email}`,
      email,
      // Returning pin in dev environment so user can easily copy/paste or see it immediately
      devPin: pin,
    };
  }

  async verifyPin(dto: VerifyPinDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const stored = this.pinStore.get(email);

    if (!stored || Date.now() > stored.expiresAt) {
      throw new UnauthorizedException('Verification PIN has expired or does not exist. Please request a new PIN.');
    }

    if (stored.pin !== dto.pin.trim()) {
      throw new UnauthorizedException('Invalid verification PIN. Please check your email and try again.');
    }

    // Clear used PIN
    this.pinStore.delete(email);

    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({
        name: dto.name || email.split('@')[0],
        email,
        password: `GmailAuth_${Math.random().toString(36).slice(-8)}!`,
        role: dto.role || UserRole.STUDENT,
        isApproved: dto.role === UserRole.TEACHER || dto.role === UserRole.ADMIN,
      });
      user = await this.userRepo.save(user);
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isApproved: user.isApproved,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      isApproved: user.isApproved,
      avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;

    const updated = await this.userRepo.save(user);
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      phone: updated.phone,
      isApproved: updated.isApproved,
      avatarUrl: updated.avatarUrl,
    };
  }
}
