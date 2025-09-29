import { Injectable } from '@nestjs/common';
import { CreateEdgeCustomizationDto } from './dto/create-edge_customization.dto';
import { UpdateEdgeCustomizationDto } from './dto/update-edge_customization.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EdgeCustomizationService {
  constructor(private prisma: PrismaService) {}

  async create(createEdgeCustomizationDto: CreateEdgeCustomizationDto) {
    return this.prisma.edge_customization.create({
      data: createEdgeCustomizationDto,
    });
  }

  async findAll() {
    return this.prisma.edge_customization.findMany({
      orderBy: [{ edge_id: 'asc' }, { key: 'asc' }],
    });
  }

  async findOne(edge_id: string, key: string) {
    return this.prisma.edge_customization.findUnique({
      where: {
        edge_id_key: {
          edge_id: edge_id,
          key: key,
        },
      },
    });
  }

  async findByEdge(edge_id: string) {
    return this.prisma.edge_customization.findMany({
      where: { edge_id },
      orderBy: { key: 'asc' },
    });
  }

  async update(edge_id: string, key: string, updateEdgeCustomizationDto: UpdateEdgeCustomizationDto) {
    return this.prisma.edge_customization.update({
      where: { 
        edge_id_key: {
          edge_id: edge_id,
          key: key,
        },
      },
      data: updateEdgeCustomizationDto,
    });
  }

  async remove(edge_id: string, key: string) {
    return this.prisma.edge_customization.delete({
      where: { 
        edge_id_key: {
          edge_id: edge_id,
          key: key,
        },
      },
    });
  }
}
