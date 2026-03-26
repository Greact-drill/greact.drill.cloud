import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { TagAlarmLogService } from './tag_alarm_log.service';
import { CreateTagAlarmLogDto } from './dto/create-tag-alarm-log.dto';
import { GetTagAlarmLogDto } from './dto/get-tag-alarm-log.dto';

@Controller('tag-alarm-log')
export class TagAlarmLogController {
  constructor(private readonly service: TagAlarmLogService) {}

  @Post()
  create(@Body() dto: CreateTagAlarmLogDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: GetTagAlarmLogDto) {
    return this.service.findAll(query);
  }

  @Get('by-edge/:edgeId')
  findByEdge(
    @Param('edgeId') edgeId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('tag_name') tag_name?: string,
    @Query('alarm_type') alarm_type?: string,
    @Query('journal_type') journal_type?: 'indicator' | 'alarm',
  ) {
    return this.service.findByEdge(
      edgeId,
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
      { tag_name, alarm_type, journal_type },
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id, 10));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(parseInt(id, 10));
  }
}
