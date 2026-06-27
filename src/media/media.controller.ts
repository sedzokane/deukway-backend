import { Controller, Post, Delete, Param, UseGuards, Request, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as multer from 'multer';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('listings/:listingId')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: multer.memoryStorage() }))
  uploadListingImages(
    @Param('listingId') listingId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.mediaService.uploadListingImages(listingId, files);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.uploadAvatar(req.user.userId, file);
  }

  @Delete(':id')
  deleteMedia(@Param('id') id: string) {
    return this.mediaService.deleteMedia(id);
  }
}