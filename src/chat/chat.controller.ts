import { Controller, Get, Post, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  @Get('conversations')
  getConversations(@Request() req) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Get('unread/count')
  getUnreadCount(@Request() req) {
    return this.chatService.getUnreadCount(req.user.userId);
  }

  @Get(':userId')
  getConversation(@Request() req, @Param('userId') userId: string) {
    return this.chatService.getConversation(req.user.userId, userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'deukway/chat', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });
    return { url: result.secure_url };
  }
}