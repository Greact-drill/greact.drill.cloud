import { Module } from '@nestjs/common';
import { TagAlarmLogService } from './tag_alarm_log.service';
import { TagAlarmLogController } from './tag_alarm_log.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TagAlarmLogController],
  providers: [TagAlarmLogService, PrismaService],
  exports: [TagAlarmLogService],
})
export class TagAlarmLogModule {}
