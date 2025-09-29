import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EdgeCustomizationService } from './edge_customization.service';
import { CreateEdgeCustomizationDto } from './dto/create-edge_customization.dto';
import { UpdateEdgeCustomizationDto } from './dto/update-edge_customization.dto';

@Controller('edge-customization')
export class EdgeCustomizationController {
  constructor(private readonly edgeCustomizationService: EdgeCustomizationService) {}

  @Post()
  create(@Body() createEdgeCustomizationDto: CreateEdgeCustomizationDto) {
    return this.edgeCustomizationService.create(createEdgeCustomizationDto);
  }

  @Get()
  findAll() {
    return this.edgeCustomizationService.findAll();
  }

  // Используем 2 параметра в URL: /edge-customization/1234/some_key
  @Get(':edge_id/:key')
  findOne(
    @Param('edge_id') edge_id: string,
    @Param('key') key: string,
  ) {
    return this.edgeCustomizationService.findOne(edge_id, key); 
  }

  @Get(':edge_id')
  findByEdge(@Param('edge_id') edge_id: string) {
    return this.edgeCustomizationService.findByEdge(edge_id);
  }

  // Используем 2 параметра в URL: /edge-customization/1234/some_key
  @Patch(':edge_id/:key')
  update(
    @Param('edge_id') edge_id: string,
    @Param('key') key: string,
    @Body() updateEdgeCustomizationDto: UpdateEdgeCustomizationDto
  ) {
    return this.edgeCustomizationService.update(edge_id, key, updateEdgeCustomizationDto);
  }

  @Delete(':edge_id/:key')
  remove(@Param('edge_id') edge_id: string, @Param('key') key: string) {
    return this.edgeCustomizationService.remove(edge_id, key);
  }
}
