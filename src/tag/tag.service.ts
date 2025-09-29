import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}
  
    async create(createTagDto: CreateTagDto) {
      return this.prisma.tag.upsert({
        where: {
          id: createTagDto.id
        },
        update: {
          name: createTagDto.name,
          min: createTagDto.min,
          max: createTagDto.max,
          comment: createTagDto.comment
        },
        create: createTagDto,
      });
    }

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: [{ id: 'asc' }],
    });
  }

  async findOne(id: string) {
    return this.prisma.tag.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.tag.delete({
      where: { id },
    })
  }
}
