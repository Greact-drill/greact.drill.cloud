import { Module } from '@nestjs/common';
import { EdgeCustomizationService } from './edge_customization.service';
import { EdgeCustomizationController } from './edge_customization.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [EdgeCustomizationController],
  providers: [EdgeCustomizationService, PrismaService],
})
export class EdgeCustomizationModule {}
