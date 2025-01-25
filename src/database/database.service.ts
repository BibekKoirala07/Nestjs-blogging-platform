import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {  Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const environment =
      this.configService.get<string>('NODE_ENV') || 'development';

    console.log(`Running in ${environment} environment`);
    this.pool = new Pool({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      port: this.configService.get<number>('DB_PORT'),
    });
  }

  async onModuleInit() {
    const maxTries = 5;
    let triedTime = 0;
    let isConnected = false;

    while (triedTime < maxTries && !isConnected) {
      try {
        await this.pool.query('SELECT NOW()');
        console.log('Connected to PostgreSQL');
        await this.seed();
        isConnected = true;
        break;
      } catch (error) {
        console.error(
          'Failed to connect to the database: one time',
          triedTime,
          error,
        );
        if (triedTime === maxTries) {
          throw new Error('Database connection failed after multiple attempts');
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async seed() {
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'USER'
      );
    `;

    const createPostsTableQuery = `
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image VARCHAR(255),
        user_id INT REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const createCommentsTableQuery = `
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      post_id INT REFERENCES posts(id) ON DELETE CASCADE
    );
  `;

    await this.query(createUsersTableQuery);
    await this.query(createPostsTableQuery);

    await this.query(createCommentsTableQuery);

    const superAdminUsername = 'superadmin';
    const password = 'superAdminPassword';

    const checkUserQuery = 'SELECT * FROM users WHERE username = $1';

    const insertSuperAdminQuery =
      'INSERT INTO users(username, password, role) VALUES($1, $2, $3)';

    // const insertUserQuery =
    //   'INSERT INTO users(username, password, role) VALUES($1, $2, $3)';

    const existingSuperAdmin = await this.query(checkUserQuery, [
      superAdminUsername,
    ]);

    if (existingSuperAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.query(insertSuperAdminQuery, [
        superAdminUsername,
        hashedPassword,
        'ADMIN',
      ]);
    }

    console.log('Seeding bhayo');
  }

  async query(query: string, values: any[] = []) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(query, values);
      //   console.log('Database query executed successfully:', res);
      return res.rows;
    } catch (err) {
      console.error('Database error:', err);
      throw new Error('Database query failed');
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Disconnected from PostgreSQL');
  }
}
