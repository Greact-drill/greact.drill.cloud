import { Module } from '@nestjs/common';
import { AlarmWidgetLogService } from './alarm_widget_log.service';
import { AlarmWidgetLogController } from './alarm_widget_log.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AlarmWidgetLogController],
  providers: [AlarmWidgetLogService, PrismaService],
  exports: [AlarmWidgetLogService],
})
export class AlarmWidgetLogModule {}
