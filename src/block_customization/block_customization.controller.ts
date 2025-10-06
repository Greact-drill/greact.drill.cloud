import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlockCustomizationService } from './block_customization.service';
import { CreateBlockCustomizationDto } from './dto/create-block_customization.dto';
import { UpdateBlockCustomizationDto } from './dto/update-block_customization.dto';

@Controller('block-customization')
export class BlockCustomizationController {
  constructor(private readonly blockCustomizationService: BlockCustomizationService) {}

  @Post()
  create(@Body() createBlockCustomizationDto: CreateBlockCustomizationDto) {
    return this.blockCustomizationService.create(createBlockCustomizationDto);
  }

  @Get()
  findAll() {
    return this.blockCustomizationService.findAll();
  }

  // Используем 2 параметра в URL: /block-customization/1234/some_key
  @Get(':block_id/:key')
  findOne(
    @Param('block_id') block_id: string,
    @Param('key') key: string,
  ) {
    return this.blockCustomizationService.findOne(block_id, key);
  }

  @Get(':block_id')
  findByBlock(@Param('block_id') block_id: string) {
    return this.blockCustomizationService.findByEdge(block_id);
  }

  @Patch(':block_id/:key')
  update(
    @Param('block_id') block_id: string,
    @Param('key') key: string,
    @Body() updateBlockCustomizationDto: UpdateBlockCustomizationDto
  ) {
    return this.blockCustomizationService.update(block_id, key, updateBlockCustomizationDto);
  }

  @Delete(':block_id/:key')
  remove(@Param('block_id') block_id: string, @Param('key') key: string) {
    return this.blockCustomizationService.remove(block_id, key);
  }
}
