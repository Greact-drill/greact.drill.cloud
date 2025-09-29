import { Injectable } from '@nestjs/common';
import { CreateTagCustomizationDto } from './dto/create-tag_customization.dto';
import { UpdateTagCustomizationDto } from './dto/update-tag_customization.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TagCustomizationService {
  constructor(private prisma: PrismaService) {}

  async create(createTagCustomizationDto: CreateTagCustomizationDto) {
    return this.prisma.tag_customization.create({
      data: createTagCustomizationDto,
    });
  }

  async findAll() {
    return this.prisma.tag_customization.findMany({
      orderBy: [{ edge_id: 'asc' }, { tag_id: 'asc' }, { key: 'asc' }],
    });
  }

  async findOne(edge_id: string, tag_id: string, key: string) {
    return this.prisma.tag_customization.findUnique({
      where: {
        edge_id_tag_id_key: {
          edge_id: edge_id,
          tag_id: tag_id,
          key: key,
        },
      },
    });
  }

  async findByEdgeAndTag(edge_id: string, tag_id: string) {
    return this.prisma.tag_customization.findMany({
      where: {
        edge_id: edge_id,
        tag_id: tag_id
      },
      orderBy: { key: 'asc' },
    });
  }

  async findByEdge(edge_id: string) {
    return this.prisma.tag_customization.findMany({
      where: { 
        edge_id
      },
      orderBy: { key: 'asc' },
    });
  }

  async update(edge_id: string, tag_id: string, key: string, updateTagCustomizationDto: UpdateTagCustomizationDto) {
    return this.prisma.tag_customization.update({
      where: { 
        edge_id_tag_id_key: {
          edge_id: edge_id,
          tag_id: tag_id,
          key: key,
        },
      },
      data: updateTagCustomizationDto,
    });
  }

  async remove(edge_id: string, tag_id: string, key: string) {
    return this.prisma.tag_customization.delete({
      where: { 
        edge_id_tag_id_key: {
          edge_id: edge_id,
          tag_id: tag_id,
          key: key,
        },
      },
    });
  }
}
