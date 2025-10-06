import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { PrismaService } from '../prisma.service';
import { SyncController } from './sync.controller';

@Module({
  controllers: [TagController, SyncController],
  providers: [TagService, PrismaService],
})
export class TagModule {}
