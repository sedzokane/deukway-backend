import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadListingImages(listingId: string, files: Express.Multer.File[]) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Annonce introuvable');

    const uploads = await Promise.all(
      files.map((file, index) =>
        new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: `deukway/listings/${listingId}` },
            (error, result) => {
              if (error) reject(error);
              else resolve({ url: result.secure_url, publicId: result.public_id, order: index });
            },
          ).end(file.buffer);
        }),
      ),
    );

    const media = await Promise.all(
      uploads.map(upload =>
        this.prisma.media.create({
          data: { listingId, url: upload.url, publicId: upload.publicId, order: upload.order },
        }),
      ),
    );

    return media;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    console.log('uploadAvatar called', userId, file ? 'file ok' : 'file undefined');
    if (!file) throw new NotFoundException('Fichier manquant');

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'deukway/avatars',
          transformation: [{ width: 400, height: 400, crop: 'fill' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      ).end(file.buffer);
    });

    console.log('Cloudinary upload result:', result.secure_url);

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: result.secure_url },
    });

    return { avatar: result.secure_url };
  }

  async deleteMedia(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media introuvable');

    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }

    await this.prisma.media.delete({ where: { id } });
    return { message: 'Media supprime' };
  }
}