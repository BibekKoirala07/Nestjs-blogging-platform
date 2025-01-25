import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsNotEmpty()
  @MinLength(3)
  content: string;

  // @IsNotEmpty()
  // @IsString()
  // @IsNumber()
  // @MinLength(3)
  // author: number | string;
}
