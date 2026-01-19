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

  @Get('roots')
  findRoots() {
    return this.edgeService.findRoots();
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

  @Get(':edgeId/widget-configs')
  async getWidgetConfigs(@Param('edgeId') edgeId: string) {
    return this.edgeService.getWidgetConfigs(edgeId);
  }

  @Get('page/:page/widget-configs')
  async getWidgetConfigsByPage(@Param('page') page: string) {
    return this.edgeService.getWidgetConfigsByPage(page);
  }

  @Get('widget-configs/all')
  async getAllWidgetConfigs() {
    return this.edgeService.getAllWidgetConfigs();
  }

  @Get('page/:page/table-config')
  async getTableConfigByPage(@Param('page') page: string) {
    return this.edgeService.getTableConfigsByPage(page);
  }

  @Get('table-configs/all')
  async getAllTableConfigs() {
    return this.edgeService.getAllTableConfigs();
  }
}