import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { GetHistoryDto } from './dto/get-history.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findLatestByEdge(@Query() query: GetHistoryDto) {
    return this.historyService.findLatestByEdge(query.edge);
  }

  @Get('details')
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findLatestByEdgeWithTags(@Query() query: GetHistoryDto) {
    return this.historyService.findLatestByEdgeWithTags(query.edge);
  }
}
