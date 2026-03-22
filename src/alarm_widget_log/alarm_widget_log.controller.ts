import { Controller, Get, Param, Query } from '@nestjs/common';
import { AlarmWidgetLogService } from './alarm_widget_log.service';

@Controller('alarm-widget-log')
export class AlarmWidgetLogController {
  constructor(private readonly service: AlarmWidgetLogService) {}

  @Get('by-edge/:edgeId')
  findByEdge(
    @Param('edgeId') edgeId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('tag_name') tag_name?: string,
  ) {
    return this.service.findByEdge(
      edgeId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
      { tag_name },
    );
  }
}
