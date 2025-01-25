import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CommentDto } from './dto/comment.dto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PostsService {
  constructor(private databaseService: DatabaseService) {}

  private async checkWhetherUserIsAuthorOrAdmin(
    id: number,
    userId: number,
    isUserAdmin: boolean,
  ) {
    const findPostQuery = `SELECT * FROM posts WHERE id = $1`;
    const postExists = await this.databaseService.query(findPostQuery, [id]);

    if (!postExists.length) {
      throw new NotFoundException('Post not found');
    }

    const post = postExists[0];
    if (post.user_id !== userId && !isUserAdmin) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action as you arenot author or ADMIN',
      );
    }

    return post;
  }

  async getAllPosts() {
    const query = `SELECT * FROM posts`;
    const posts = await this.databaseService.query(query);

    console.log('posts', posts);

    return {
      message: posts.length
        ? 'All posts found'
        : 'There are no post to display',
      data: posts,
    };
  }

  async getPostById(id: number) {
    const query = `SELECT * FROM posts WHERE id = $1`;
    const post = await this.databaseService.query(query, [id]);

    if (!post.length) {
      throw new NotFoundException('Post not found');
    }

    console.log('post', post);

    return { message: 'Post found successfully', data: post[0] };
  }

  async createPost(createPostDto: CreatePostDto, userId: number): Promise<any> {
    const { title, content } = createPostDto;
    const query = `
      INSERT INTO posts (title, content, user_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const newPost = await this.databaseService.query(query, [
      title,
      content,
      userId,
    ]);

    console.log('newPost', newPost);

    return { message: 'Post created successfully', data: newPost[0] };
  }

  async updatePost(
    id: number,
    updatePostDto: UpdatePostDto,
    userId: any,
    isUserAdmin: boolean,
  ) {
    const { title, content } = updatePostDto;

    await this.checkWhetherUserIsAuthorOrAdmin(id, userId, isUserAdmin);

    const updateQuery = `
    UPDATE posts
    SET title = COALESCE($1, title), content = COALESCE($2, content)
    WHERE id = $3
    RETURNING *;
  `;

    const updatedPost = await this.databaseService.query(updateQuery, [
      title,
      content,
      id,
    ]);

    console.log('updatedPost', updatedPost);

    return { message: 'Post updated successfully', data: updatedPost[0] };
  }

  async deletePost(id: number, userId: number, isUserAdmin = false) {
    await this.checkWhetherUserIsAuthorOrAdmin(id, userId, isUserAdmin);

    const deleteQuery = `DELETE FROM posts WHERE id = $1 RETURNING *`;
    const deletedPost = await this.databaseService.query(deleteQuery, [id]);

    return { message: 'Post deleted successfully', data: deletedPost[0] };
  }

  async findAllCommentsOfPost(postId: number): Promise<any> {
    const findPostQuery = `SELECT * FROM posts WHERE id = $1`;
    const postExists = await this.databaseService.query(findPostQuery, [
      postId,
    ]);

    if (!postExists.length) throw new NotFoundException('No such post found');

    const findCommentsQuery = `SELECT * FROM comments WHERE post_id = $1`;
    const comments = await this.databaseService.query(findCommentsQuery, [
      postId,
    ]);

    return { message: `Comments found for postId: ${postId}`, data: comments };
  }

  async createCommentForPost(
    commentDto: CommentDto,
    postId: number,
    userId: number,
  ) {
    const { content } = commentDto;
    if (!content || !postId || !userId) {
      throw new BadRequestException('Missing required parameters');
    }

    const findPostQuery = `SELECT * FROM posts WHERE id = $1`;
    const postExists = await this.databaseService.query(findPostQuery, [
      postId,
    ]);

    if (!postExists.length) throw new BadRequestException('No Such post found');

    const insertCommentQuery = `
      INSERT INTO comments (content, post_id, user_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const comment = await this.databaseService.query(insertCommentQuery, [
      content,
      postId,
      userId,
    ]);

    return { message: 'New comment created', data: comment };
  }

  async UploadImageAndAttachToPost(
    file: Express.Multer.File,
    postId: number,
    userId: number,
    isUserAdmin: boolean,
  ) {
    console.log('data', file, postId, userId, isUserAdmin);

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const findPostQuery = `SELECT * FROM posts WHERE id = $1`;
    const postExists = await this.databaseService.query(findPostQuery, [
      postId,
    ]);

    console.log('postExists', postExists);

    if (!postExists.length) {
      await fs.unlink(file.path);
      throw new NotFoundException('No such post found');
    }

    const post = postExists[0];
    if (post.user_id !== userId && !isUserAdmin) {
      await fs.unlink(file.path);
      throw new UnauthorizedException('You are not the author of this post');
    }

    if (post.image) {
      await fs.unlink(file.path);
      throw new GoneException('Post already has an image');
    }

    const updateQuery = `
      UPDATE posts
      SET image = $1
      WHERE id = $2
      RETURNING *;
    `;

    const updatedPost = await this.databaseService.query(updateQuery, [
      `uploads/${file.filename}`,
      postId,
    ]);

    console.log('updatedPost', updatedPost);

    return {
      message: 'Image added to post successfully',
      data: updatedPost[0],
    };
  }

  async DeleteImageFromPost(
    postId: number,
    userId: number,
    isUserAdmin: boolean,
  ) {
    const findPostQuery = `SELECT * FROM posts WHERE id = $1`;
    const postExists = await this.databaseService.query(findPostQuery, [
      postId,
    ]);

    if (!postExists.length) {
      throw new NotFoundException('No such post found');
    }

    const post = postExists[0];
    if (post.user_id !== userId && !isUserAdmin) {
      throw new UnauthorizedException('You are not the author of this post');
    }

    if (!post.image) {
      throw new BadRequestException('Post does not have an image to delete');
    }

    console.log(__dirname);

    const imagePath = path.join(__dirname, '../', '../', post.image);
    console.log('imagePath: ', imagePath);
    await fs.unlink(imagePath);

    const updateQuery = `
    UPDATE posts
    SET image = NULL
    WHERE id = $1
    RETURNING *;
  `;

    const imageDeletedPost = await this.databaseService.query(updateQuery, [
      postId,
    ]);

    return {
      message: 'Image deleted from post successfully',
      data: imageDeletedPost[0],
    };
  }
}
