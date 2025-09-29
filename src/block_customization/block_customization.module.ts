import { Module } from '@nestjs/common';
import { BlockCustomizationService } from './block_customization.service';
import { BlockCustomizationController } from './block_customization.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BlockCustomizationController],
  providers: [BlockCustomizationService, PrismaService],
})
export class BlockCustomizationModule {}
