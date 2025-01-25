import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from 'src/database/database.service';
import { truncateDatabase } from 'src/shared/test.utils';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    dbService = moduleFixture.get<DatabaseService>(DatabaseService);

    await app.init();
  });

  beforeEach(async () => {
    await truncateDatabase(dbService);
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await app.close();
  });

  async function generatePostId(token) {
    const postResponse = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Post', content: 'Test Content' })
      .expect(201);

    return postResponse.body.data.id;
  }

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

    return loginResponse.body.token;
  }

  async function registerAndLoginAdmin() {
    const adminCredentials = {
      username: 'test-admin-user',
      password: 'test-admin-password',
    };

    await request(app.getHttpServer())
      .post('/users/register')
      .send({ ...adminCredentials, role: 'ADMIN' })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/users/login')
      .send(adminCredentials)
      .expect(201);

    return loginResponse.body.token;
  }

  describe('/posts (GET)', () => {
    it('should return all the posts only if the person is ADMIN', async () => {
      const adminToken = await registerAndLoginAdmin();

      const response = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
    it('should provide error wrong token is provided', async () => {
      const token = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .get('/posts')
        .set('Authorization', `Bearer ${token + 'random'}`)
        .expect(401);

      expect(response.body.message).toContain('invalid signature');
    });
  });

  describe('/posts/:id (GET)', () => {
    it('should return a post is authenticated ', async () => {
      const token = await registerAndLoginUser();
      const postId = await generatePostId(token);
      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('content');
    });
  });

  describe('/posts (POST)', () => {
    it('should create a post', async () => {
      const token = await registerAndLoginUser();

      const response = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Post', content: 'New Content' })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', 'New Post');
    });

    it('should fails to create without token', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')

        .send({ title: 'New Post', content: 'New Content' })
        .expect(401);
    });

    it('should fail to create a post without required fields', async () => {
      const token = await registerAndLoginUser();
      await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '' })
        .expect(400);
    });
  });

  describe('/posts/:id (PATCH)', () => {
    it('should update a post on if user is author', async () => {
      const token = await registerAndLoginUser();
      const postId = await generatePostId(token);

      const response = await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.data).toHaveProperty('title', 'Updated Title');
    });

    it('should fail to update a post without proper authorization', async () => {
      const token = await registerAndLoginUser();
      const postId = await generatePostId(token);
      await request(app.getHttpServer())
        .patch(`/posts/${postId}`)
        .send({ title: 'Unauthorized Update' })
        .expect(401);
    });
  });

  describe('/posts/:id (DELETE)', () => {
    it('should delete a post', async () => {
      const token = await registerAndLoginUser();
      const postId = await generatePostId(token);

      await request(app.getHttpServer())
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should fail to delete a post without authorization', async () => {
      const token = await registerAndLoginUser();
      const postId = await generatePostId(token);
      await request(app.getHttpServer()).delete(`/posts/${postId}`).expect(401);
    });
  });

  describe('/posts/:postId/comments (POST)', () => {
    it('should add a comment to a post', async () => {
      const token = await registerAndLoginUser();
      const postId = await generatePostId(token);

      const response = await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Great Post!' })
        .expect(201);

      expect(response.body.data.length).toBeGreaterThanOrEqual(0);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('content', 'Great Post!');
    });

    it('should fail to add a comment without authorization', async () => {
      const token = await registerAndLoginUser();
      const postId = await generatePostId(token);
      await request(app.getHttpServer())
        .post(`/posts/${postId}/comments`)
        .send({ content: 'J payo tei' })
        .expect(401);
    });
  });
});
