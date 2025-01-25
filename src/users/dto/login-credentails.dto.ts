import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class LoginCredentailsDto {
  @Length(4, 20)
  @IsString()
  username: string;

  @Length(4, 20)
  @IsString()
  password: string;

  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'ADMIN';
}
