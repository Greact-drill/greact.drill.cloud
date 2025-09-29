import { ConflictException, Injectable } from '@nestjs/common';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { PrismaService } from '../prisma.service';
import { Prisma } from 'generated/prisma';

@Injectable()
export class BlockService {
  constructor(private prisma: PrismaService) {}

  async create(createBlockDto: CreateBlockDto) {
    return this.prisma.block.upsert({
      where: {
        id: createBlockDto.id
      },
      update: {
        name: createBlockDto.name,
      },
      create: createBlockDto,
    });
  }

  async findAll() {
    return this.prisma.block.findMany({
      orderBy: [{ edge_id: 'asc' }, { id: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.block.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateBlockDto: UpdateBlockDto) {
    return this.prisma.block.update({
      where: { id },
      data: updateBlockDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.block.delete({
      where: { id },
    }).catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2003') {
            throw new ConflictException(
              'Невозможно удалить буровую с ID "${id}". С ним связаны другие элементы (например, теги) в базе данных, которые должны быть удалены или отвязаны сначала.'
            );
          }
        }
        throw error;
    });
  }
}
