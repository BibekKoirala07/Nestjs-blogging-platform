import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCredentalsDto {
    @Length(4, 20)
    @IsOptional()
  @IsString()
  username?: string;

    @Length(4, 20)
    @IsOptional()
  @IsString()
  password?: string;

  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'ADMIN';
}
