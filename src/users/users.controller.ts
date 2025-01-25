import {
  Body,
  Controller,
  Request,
  Get,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserCredentialsDto } from './dto/user-credentails.dto';

import { getUserId } from '../shared/getUserId';
import { AuthenticationGuard } from 'src/guards/auth.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { RoleGuard } from 'src/guards/roles.guard';
import { RegisterCredentailssDto } from './dto/register-credentails.dto';
import { LoginCredentailsDto } from './dto/login-credentails.dto';
import { UpdateCredentalsDto } from './dto/update-credentails.dto';
// import { RoleGuard } from 'src/guards/role.guard';
// import { Roles } from 'src/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}
  @Get()
  @UseGuards(AuthenticationGuard, RoleGuard)
  @Roles('ADMIN')
  getUsers(@Request() req) {
    return this.userService.getUsers();
  }

  @Post('register')
  registerUser(
    @Body(ValidationPipe) registerCredentailssDto: RegisterCredentailssDto,
  ) {
    console.log('registerUser', registerCredentailssDto);
    return this.userService.registerUser(registerCredentailssDto);
  }

  @Post('login')
  loginUser(@Body(ValidationPipe) loginCredentailsDto: LoginCredentailsDto) {
    console.log('loginUser', loginCredentailsDto);
    return this.userService.loginUser(loginCredentailsDto);
  }

  @UseGuards(AuthenticationGuard)
  @Get('profile')
  getUserProfile(@Request() req) {
    const userId = getUserId(req);
    return this.userService.getUserProfile(userId);
  }

  @UseGuards(AuthenticationGuard)
  @Patch('profile')
  updateProfile(
    @Body() updateCreadentialsDto: UpdateCredentalsDto,
    @Request() req,
  ) {
    const userId = getUserId(req);
    console.log('userId: ' + userId);
    return this.userService.updateProfile(updateCreadentialsDto, userId);
  }
}
