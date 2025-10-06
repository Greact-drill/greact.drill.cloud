import { Module } from '@nestjs/common';
import { TagCustomizationService } from './tag_customization.service';
import { TagCustomizationController } from './tag_customization.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TagCustomizationController],
  providers: [TagCustomizationService, PrismaService],
})
export class TagCustomizationModule {}
