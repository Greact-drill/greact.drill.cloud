import { Injectable } from '@nestjs/common';
import { CreateBlockCustomizationDto } from './dto/create-block_customization.dto';
import { UpdateBlockCustomizationDto } from './dto/update-block_customization.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BlockCustomizationService {
  constructor(private prisma: PrismaService) {}
  
  async create(createBlockCustomizationDto: CreateBlockCustomizationDto) {
    return this.prisma.block_customization.create({
      data: createBlockCustomizationDto,
    });
  }

  async findAll() {
    return this.prisma.block_customization.findMany({
      orderBy: [{ block_id: 'asc' }, { key: 'asc' }],
    });
  }

  async findOne(block_id: string, key: string) {
    return this.prisma.block_customization.findUnique({
      where: {
        block_id_key: {
          block_id: block_id,
          key: key,
        },
      },
    });
  }

  async findByEdge(block_id: string) {
    return this.prisma.block_customization.findMany({
      where: { block_id },
      orderBy: { key: 'asc' },
    });
  }

  async update(block_id: string, key: string, updateBlockCustomizationDto: UpdateBlockCustomizationDto) {
    return this.prisma.block_customization.update({
      where: { 
        block_id_key: {
          block_id: block_id,
          key: key,
        },
      },
      data: updateBlockCustomizationDto,
    });
  }

  async remove(block_id: string, key: string) {
    return this.prisma.block_customization.delete({
      where: {
        block_id_key: {
          block_id: block_id,
          key: key,
        },
      },
    });
  }
}
