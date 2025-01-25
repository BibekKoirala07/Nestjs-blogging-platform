import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthenticationGuard } from 'src/guards/auth.guard';

import { CommentDto } from './dto/comment.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { getUserId } from 'src/shared/getUserId';
import { fileNameEditor, imageFileEditor } from './file.utils';
import { isAdmin } from 'src/shared/isAdmin';

@UseGuards(AuthenticationGuard)
@Controller('posts')
export class PostsController {
  constructor(private postService: PostsService) {}
  @Get()
  findAllPosts() {
    return this.postService.getAllPosts();
  }

  @Get('/:id')
  findPost(@Param('id', ParseIntPipe) id: number) {
    return this.postService.getPostById(id);
  }

  @Post()
  createPost(
    @Body(ValidationPipe) createPostDto: CreatePostDto,
    @Request() req,
  ) {
    const userId = getUserId(req);
    return this.postService.createPost(createPostDto, userId);
  }

  @Patch(':id')
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) UpdatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    const userId = getUserId(req);
    const isUserAdmin = isAdmin(req);
    return this.postService.updatePost(id, UpdatePostDto, userId, isUserAdmin);
  }

  @Delete(':id')
  deletePost(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const userId = getUserId(req);
    const isUserAdmin = isAdmin(req);
    return this.postService.deletePost(id, userId, isUserAdmin);
  }

  // comments related to posts

  @Get(':postId/comments')
  findAllCommentsOfPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req,
  ) {
    console.log('postId', postId);
    return this.postService.findAllCommentsOfPost(postId);
  }

  @Post(':postId/comments')
  createCommentForPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Body(ValidationPipe) commentDto: CommentDto,
    @Request() req,
  ) {
    const userId = getUserId(req);
    return this.postService.createCommentForPost(commentDto, postId, userId);
  }

  // posts related to images

  @Post(':postId/images')
  @UseInterceptors(
    FileInterceptor('post-image', {
      storage: diskStorage({
        destination: 'uploads',
        filename: fileNameEditor,
      }),
      fileFilter: imageFileEditor,
      limits: { fileSize: 1000 * 1000 * 10 }, // 10 MB ho yo
    }),
  )
  UploadImageAndAttactToPost(
    @Param('postId', ParseIntPipe) postId: number,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const userId = getUserId(req);
    const isUserAdmin = isAdmin(req);
    return this.postService.UploadImageAndAttachToPost(
      file,
      postId,
      userId,
      isUserAdmin,
    );
  }

  @Delete(':postId/images')
  deleteImage(@Param('postId', ParseIntPipe) postId: number, @Request() req) {
    const userId = getUserId(req);
    const isUserAdmin = isAdmin(req);
    return this.postService.DeleteImageFromPost(postId, userId, isUserAdmin);
  }
}
