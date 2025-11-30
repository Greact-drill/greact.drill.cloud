import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EdgeService } from './edge.service';
import { CreateEdgeDto } from './dto/create-edge.dto';
import { UpdateEdgeDto } from './dto/update-edge.dto';

@Controller('edge')
export class EdgeController {
  constructor(private readonly edgeService: EdgeService) {}

  @Post()
  create(@Body() createEdgeDto: CreateEdgeDto) {
    return this.edgeService.create(createEdgeDto);
  }

  @Get()
  findAll() {
    return this.edgeService.findAll();
  }

  @Get('tree')
  findTree() {
    return this.edgeService.findTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.edgeService.findOne(id);
  }

  @Get(':id/children')
  findChildren(@Param('id') id: string) {
    return this.edgeService.findChildren(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEdgeDto: UpdateEdgeDto) {
    return this.edgeService.update(id, updateEdgeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.edgeService.remove(id);
  }
}