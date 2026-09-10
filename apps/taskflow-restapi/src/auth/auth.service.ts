import { Injectable, UnauthorizedException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from '@taskflow/shared';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendPinDto } from './dto/send-pin.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponse } from './interface/auth-response.interface';

const PIN_TTL_SECONDS = 10 * 60; // 10 minutes
const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  private pinKey(email: string) {
    return `auth:pin:${email}`;
  }

  async register(dto: RegisterDto & { name?: string; role?: UserRole; phone?: string }): Promise<AuthResponse> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = this.userRepo.create({
      name: dto.name || dto.email.split('@')[0],
      email: dto.email,
      password: hashedPassword,
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

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
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

    await this.redisService.getClient().set(this.pinKey(email), pin, 'EX', PIN_TTL_SECONDS);
    await this.mailService.sendVerificationPin(email, pin);
    this.logger.log(`Verification PIN sent to ${email}`);

    return {
      message: `Verification PIN has been sent to ${email}`,
      email,
    };
  }

  async verifyPin(dto: VerifyPinDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    const storedPin = await this.redisService.getClient().get(this.pinKey(email));

    if (!storedPin) {
      throw new UnauthorizedException('Verification PIN has expired or does not exist. Please request a new PIN.');
    }

    if (storedPin !== dto.pin.trim()) {
      throw new UnauthorizedException('Invalid verification PIN. Please check your email and try again.');
    }

    // Clear used PIN
    await this.redisService.getClient().del(this.pinKey(email));

    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      const randomPassword = await bcrypt.hash(`GmailAuth_${Math.random().toString(36).slice(-8)}!`, BCRYPT_SALT_ROUNDS);
      user = this.userRepo.create({
        name: dto.name || email.split('@')[0],
        email,
        password: randomPassword,
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

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepo.save(user);

    return { message: 'Password changed successfully' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const storedPin = await this.redisService.getClient().get(this.pinKey(email));

    if (!storedPin) {
      throw new UnauthorizedException('Reset PIN has expired or does not exist. Please request a new PIN.');
    }

    if (storedPin !== dto.pin.trim()) {
      throw new UnauthorizedException('Invalid reset PIN.');
    }

    await this.redisService.getClient().del(this.pinKey(email));

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User with this email was not found.');
    }

    user.password = await bcrypt.hash(dto.newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepo.save(user);

    return { message: 'Password reset successfully. You can now sign in with your new password.' };
  }
}
