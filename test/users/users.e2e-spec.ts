import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UsersService } from '../../src/users/users.service';
import { DatabaseService } from 'src/database/database.service';
import { truncateDatabase } from 'src/shared/test.utils';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let dbService: DatabaseService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dbService = moduleFixture.get<DatabaseService>(DatabaseService);

    app.useGlobalPipes(new ValidationPipe());
    await truncateDatabase(dbService);

    await app.init();
  });

  beforeEach(async () => {
    await truncateDatabase(dbService);
    await registerAndLoginUser();
  });

  async function registerAndLoginUser() {
    const userCredentials = {
      username: 'test-user',
      password: 'test-password',
    };

    await request(app.getHttpServer())
      .post('/users/register')
      .send(userCredentials)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/users/login')
      .send(userCredentials)
      .expect(201);

    token = loginResponse.body.token;
  }

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // await dbService.onModuleDestroy();
    await app.close();
  });

  describe('/users/register (POST)', () => {
    it('should register a user with valid credentials', async () => {
      const userCredentials = {
        username: 'username-test',
        password: 'password',
      };

      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send(userCredentials)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', 'username-test');
      expect(response.body.message).toBe('Registeration successfull');
    });

    it('should fail to register a user with invalid data', async () => {
      const invalidCredentials = {
        username: '',
        password: 'short',
      };

      await request(app.getHttpServer())
        .post('/users/register')
        .send(invalidCredentials)
        .expect(400);
    });
  });

  describe('/users/login (POST)', () => {
    it('should log in a user with valid credentials', async () => {
      const loginCredentials = {
        username: 'test-user',
        password: 'test-password',
      };

      const response = await request(app.getHttpServer())
        .post('/users/login')
        .send(loginCredentials)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toBe('Login successful');
    });

    it('should fail to log in with invalid credentials', async () => {
      const invalidCredentials = {
        username: 'wrong-user',
        password: 'wrong-password',
      };

      await request(app.getHttpServer())
        .post('/users/login')
        .send(invalidCredentials)
        .expect(404);
    });
  });

  describe('/users/profile (GET)', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('username', 'test-user');
      expect(response.body.message).toBe('It is your profile');
    });

    it('should fail to get user profile without token', async () => {
      await request(app.getHttpServer()).get('/users/profile').expect(401);
    });
  });

  describe('/users/profile (PATCH)', () => {
    it('should update user profile with valid data', async () => {
      const updateCredentials = {
        username: 'updated-user',
      };

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateCredentials)
        .expect(200);

      expect(response.body.data).toHaveProperty('username', 'updated-user');
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should fail to update profile with invalid data', async () => {
      const invalidUpdate = {
        username: '',
      };

      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidUpdate)
        .expect(400);
    });
  });
});
