import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserCredentialsDto } from './dto/user-credentails.dto';

import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { RegisterCredentailssDto } from './dto/register-credentails.dto';
import { LoginCredentailsDto } from './dto/login-credentails.dto';
import { UpdateCredentalsDto } from './dto/update-credentails.dto';

@Injectable()
export class UsersService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
  ) {}

  private generateJwtToken(
    userId: number,
    username: string,
    role: 'ADMIN' | 'USER',
  ): string {
    const payload = { userId, username, role: role ? role : 'USER' };
    return this.jwtService.sign(payload);
  }

  async getUsers() {
    const getUserQuery = `SELECT * FROM users`;
    const users = await this.databaseService.query(getUserQuery);

    console.log('users', users);

    const usersWithoutPassword = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return { message: 'All users Provided', data: usersWithoutPassword };
  }

  async registerUser(registerCredentailssDto: RegisterCredentailssDto) {
    const { username, password, role } = registerCredentailssDto;

    if (username == 'superadmin') {
      throw new UnauthorizedException('superadmin is not allowed to register');
    }

    const checkUserQuery = 'SELECT * FROM users WHERE username = $1';
    const existingUser = await this.databaseService.query(checkUserQuery, [
      username,
    ]);

    if (existingUser.length > 0) {
      throw new ConflictException('Username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertUserQuery = `
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, $3)
    RETURNING id, username, role;
  `;

    const newUser = await this.databaseService.query(insertUserQuery, [
      username,
      hashedPassword,
      role || 'USER',
    ]);

    const user = newUser[0];

    const { password: hashed, ...userWithOutPassword } = user;

    return {
      message: 'Registeration successfull',
      data: userWithOutPassword,
    };
  }

  async loginUser(loginCredentailsDto: LoginCredentailsDto) {
    const { username, password } = loginCredentailsDto;
    const findUserQuery = 'SELECT * FROM users WHERE username = $1';
    const result = await this.databaseService.query(findUserQuery, [username]);

    console.log('result', result);

    if (result.length === 0) {
      throw new NotFoundException('No such user exists');
    }
    const user = result[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('isPasswordValid', isPasswordValid);

    if (!isPasswordValid) {
      throw new NotFoundException('Invalid username or password');
    }

    const token = this.generateJwtToken(user.id, user.username, user.role);

    const { password: hash, ...userWithOutPassword } = user;

    return {
      message: 'Login successful',
      data: userWithOutPassword,
      token: token,
    };
  }

  async getUserProfile(userId: number) {
    const findUserQuery = 'SELECT * FROM users WHERE id = $1';
    const existingUser = await this.databaseService.query(findUserQuery, [
      userId,
    ]);

    if (existingUser.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = existingUser[0];

    const { password: hashed, ...userWithoutPassword } = user;



    return { message: 'It is your profile', data: userWithoutPassword };
  }

  async updateProfile(
    updateCreadentialsDto: UpdateCredentalsDto,
    userId: any,
  ): Promise<any> {
    const { username, password } = updateCreadentialsDto;
    const isUserNameProvided = username != null && username.trim() !== '';
    const isPasswordProvided = password != null && password.trim() !== '';

    console.log('data', username, password);

    console.log(isUserNameProvided, isPasswordProvided);

    if (isUserNameProvided && username.toString().length < 4) {
      throw new BadRequestException(
        'Username should be at least 4 characters long',
      );
    }

    if (isPasswordProvided && password.toString().length < 4) {
      console.log('yeha aayo');
      throw new BadRequestException(
        'Password should be at least 4 characters long',
      );
    }

    const findUserQuery = 'SELECT * FROM users WHERE id = $1';
    const existingUser = await this.databaseService.query(findUserQuery, [
      userId,
    ]);

    // console.log('existingUser', existingUser);

    if (existingUser.length === 0) {
      throw new NotFoundException('User not found');
    }

    const updates = [];
    const updateValues: any[] = [];

    const usernameIsSame =
      username && username.toString() === existingUser[0].username.toString();

    console.log('usernameIsSame', usernameIsSame);

    if (usernameIsSame) {
      throw new ConflictException(
        'It seems like you already have this username',
      );
    }

    if (username) {
      const checkUsernameQuery = 'SELECT * FROM users WHERE username = $1';
      const existingUsername = await this.databaseService.query(
        checkUsernameQuery,
        [username],
      );

      // console.log('existing username', existingUsername);
      if (existingUsername.length > 0) {
        throw new ConflictException(
          'Username already exists. Choose another username',
        );
      }

      updates.push(`username = $${updates.length + 1}`);
      updateValues.push(username);
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password.toString(), salt);
      updates.push(`password = $${updates.length + 1}`);
      updateValues.push(hash);
    }

    console.log('updates', updates);
    console.log('updatesValues', updateValues);

    if (updates.length > 0) {
      const updateQuery = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${updates.length + 1}
        RETURNING id, username, role;
      `;

      updateValues.push(userId);

      const updatedUser = await this.databaseService.query(
        updateQuery,
        updateValues,
      );

      return {
        message: 'Profile updated successfully',
        data: updatedUser[0],
      };
    }
    return {
      message: 'No changes were made',
      data: existingUser[0],
    };
  }
}
