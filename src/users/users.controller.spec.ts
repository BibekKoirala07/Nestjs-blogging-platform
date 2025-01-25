import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserCredentialsDto } from './dto/user-credentails.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('UsersController', () => {
  let usersController: UsersController;
  let userService: UsersService;

  const mockUserService = {
    registerUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: userService,
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  // describe('findAllUsers', async () => {
  //   it('should return an array of users', async () => {
  //     const result = await service.getUsers();
  //     expect(Array.isArray(result)).toBeTruthy();
  //   });
  // });

  describe('register', async () => {
    it('it should register a user', async () => {
      const userCredentialsDto: UserCredentialsDto = {
        username: 'username',
        password: 'passwordone',
        role: 'USER',
      };
      const mockOutput = {
        message: 'Registration successful',
        data: { id: 1, username: 'username', role: 'USER' },
      };

      mockUserService.registerUser.mockResolvedValue(mockOutput);

      const result = await usersController.registerUser(userCredentialsDto);
      expect(result).toEqual(mockOutput);
    });

    it('should pass through UnauthorizedException from service', async () => {
      const userDto: UserCredentialsDto = {
        username: 'superadmin',
        password: 'password123',
      };

      mockUserService.registerUser.mockRejectedValue(
        new UnauthorizedException('superadmin is not allowed to register'),
      );

      await expect(usersController.registerUser(userDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
