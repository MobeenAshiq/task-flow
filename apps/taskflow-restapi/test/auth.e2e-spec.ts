import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '@taskflow/shared';

describe('AuthController (E2E)', () => {
  let app: INestApplication;
  let accessToken: string;

  const testUser = {
    name: 'Test Teacher',
    email: `teacher_${Date.now()}@taskflow.dev`,
    password: 'password123',
    role: UserRole.TEACHER,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST) - Should successfully register a new teacher', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.response.user.email).toBe(testUser.email);
    expect(res.body.response.accessToken).toBeDefined();
  });

  it('/auth/login (POST) - Should authenticate teacher and return JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.response.accessToken).toBeDefined();
    accessToken = res.body.response.accessToken;
  });

  it('/auth/me (GET) - Should return current user profile when Bearer token is valid', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.response.email).toBe(testUser.email);
  });

  it('/auth/me (GET) - Should reject unauthenticated requests with 401', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
