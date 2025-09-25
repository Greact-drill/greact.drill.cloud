import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Query } from '@nestjs/common';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { GetHistoryDto } from './dto/get-history.dto';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }

  // @Post()
  // create(@Body() createHistoryDto: CreateHistoryDto) {
  //   return this.historyService.create(createHistoryDto);
  // }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findLatestByEdge(@Query() query: GetHistoryDto) {
    return this.historyService.findLatestByEdge(query.edge);
  }

  // @Get(':id')
  // @Header('Cache-Control', 'no-store')
  // @Header('Pragma', 'no-cache')
  // @Header('Expires', '0')
  // findOne(@Param('id') id: string) {
  //   return this.historyService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateHistoryDto: UpdateHistoryDto) {
  //   return this.historyService.update(+id, updateHistoryDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.historyService.remove(+id);
  // }
}
