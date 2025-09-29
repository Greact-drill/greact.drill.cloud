import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TagCustomizationService } from './tag_customization.service';
import { CreateTagCustomizationDto } from './dto/create-tag_customization.dto';
import { UpdateTagCustomizationDto } from './dto/update-tag_customization.dto';

@Controller('tag-customization')
export class TagCustomizationController {
  constructor(private readonly tagCustomizationService: TagCustomizationService) {}

  @Post()
  create(@Body() createTagCustomizationDto: CreateTagCustomizationDto) {
    return this.tagCustomizationService.create(createTagCustomizationDto);
  }

  @Get()
  findAll() {
    return this.tagCustomizationService.findAll();
  }

  @Get(':edge_id/:tag_id/:key')
  findOne(
    @Param('edge_id') edge_id: string,
    @Param('tag_id') tag_id: string,
    @Param('key') key: string
  ) {
    return this.tagCustomizationService.findOne(edge_id, tag_id, key);
  }

  @Get(':edge_id/:tag_id')
  findByEdgeAndTag(
    @Param('edge_id') edge_id: string,
    @Param('tag_id') tag_id: string,
  ) {
    return this.tagCustomizationService.findByEdgeAndTag(edge_id, tag_id);
  }

  @Get(':edge_id')
  findByEdge(@Param('edge_id') edge_id: string) {
    return this.tagCustomizationService.findByEdge(edge_id);
  }

  @Patch(':edge_id/:tag_id/:key')
  update(
    @Param('edge_id') edge_id: string,
    @Param('tag_id') tag_id: string,
    @Param('key') key: string,
    @Body() updateTagCustomizationDto: UpdateTagCustomizationDto
  ) {
    return this.tagCustomizationService.update(edge_id, tag_id, key, updateTagCustomizationDto);
  }

  @Delete(':edge_id/:tag_id/:key')
  remove(
    @Param('edge_id') edge_id: string,
    @Param('tag_id') tag_id: string,
    @Param('key') key: string
  ) {
    return this.tagCustomizationService.remove(edge_id, tag_id, key);
  }
}
