import { Module } from '@nestjs/common';
import { CurrentService } from './current.service';
import { CurrentController } from './current.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CurrentController],
  providers: [CurrentService, PrismaService],
})
export class CurrentModule { }
