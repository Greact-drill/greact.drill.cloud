import { Module } from '@nestjs/common';
import { EdgeService } from './edge.service';
import { EdgeController } from './edge.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [EdgeController],
  providers: [EdgeService, PrismaService],
})
export class EdgeModule {}
