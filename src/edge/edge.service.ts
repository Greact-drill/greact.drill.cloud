import { ConflictException, Injectable } from '@nestjs/common';
import { CreateEdgeDto } from './dto/create-edge.dto';
import { UpdateEdgeDto } from './dto/update-edge.dto';
import { PrismaService } from '../prisma.service';
import { Prisma } from 'generated/prisma';

@Injectable()
export class EdgeService {
  constructor(private prisma: PrismaService) {}

  async create(createEdgeDto: CreateEdgeDto) {
    return this.prisma.edge.upsert({
      where: {
        id: createEdgeDto.id
      },
      update: {
        name: createEdgeDto.name,
      },
      create: createEdgeDto,
    });
  }

  findAll() {
    return this.prisma.edge.findMany({
      orderBy: [{ id: 'asc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.edge.findMany({
      where: { id },
    });
  }

  update(id: string, updateEdgeDto: UpdateEdgeDto) {

    return this.prisma.edge.update({
      where: { id },
      data: updateEdgeDto
    });
  }

  async remove(id: string) {
    return await this.prisma.edge.delete({
      where: { id },
    }).catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') {
            throw new ConflictException(
              `Невозможно удалить Edge с ID "${id}". С ним связаны другие элементы (например, блоки) в базе данных, которые должны быть удалены или отвязаны сначала.`
            );
          }
        }
        throw error;
    });
  }
}
