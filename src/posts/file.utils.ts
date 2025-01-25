import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export const fileNameEditor = (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  file: Express.Multer.File,
  callback: (error: Error | null, filename: string) => void,
) => {
  const timestamp = Date.now();
  const originalName = file.originalname;
  const newFileName = `${timestamp}-${originalName}`;
  callback(null, newFileName);
};

export const imageFileEditor = (
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedFormats = ['png', 'jpeg'];
  const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedFormats.includes(fileExtension)) {
    return callback(new BadRequestException('Invalid file format'), false);
  }
  callback(null, true);
};
