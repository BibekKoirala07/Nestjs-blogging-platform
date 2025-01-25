import { DatabaseService } from 'src/database/database.service';

export const truncateDatabase = async (dbService: DatabaseService) => {
  await dbService.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
  await dbService.query('TRUNCATE TABLE posts RESTART IDENTITY CASCADE;');
  await dbService.query('TRUNCATE TABLE comments RESTART IDENTITY CASCADE;');
};
