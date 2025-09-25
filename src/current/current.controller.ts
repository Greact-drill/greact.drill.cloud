import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Query } from '@nestjs/common';
import { CurrentService } from './current.service';
import { CreateCurrentDto } from './dto/create-current.dto';
import { UpdateCurrentDto } from './dto/update-current.dto';
import { GetCurrentDto } from './dto/get-current.dto';

@Controller('current')
export class CurrentController {
  constructor(private readonly currentService: CurrentService) { }

  // @Post()
  // create(@Body() createCurrentDto: CreateCurrentDto) {
  //   return this.currentService.create(createCurrentDto);
  // }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  findCurrentByEdge(@Query() query: GetCurrentDto) {
    return this.currentService.findCurrentByEdge(query.edge);
  }

  // @Get(':id')
  // @Header('Cache-Control', 'no-store')
  // @Header('Pragma', 'no-cache')
  // @Header('Expires', '0')
  // findOne(@Param('id') id: string) {
  //   return this.currentService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCurrentDto: UpdateCurrentDto) {
  //   return this.currentService.update(+id, updateCurrentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.currentService.remove(+id);
  // }
}
