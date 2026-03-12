import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTagAlarmLogDto } from './dto/create-tag-alarm-log.dto';
import type { GetTagAlarmLogDto } from './dto/get-tag-alarm-log.dto';

@Injectable()
export class TagAlarmLogService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTagAlarmLogDto) {
    return this.prisma.tagAlarmLog.create({
      data: {
        edge_id: dto.edge_id,
        tag_id: dto.tag_id,
        tag_name: dto.tag_name,
        value: dto.value,
        min_limit: dto.min_limit,
        max_limit: dto.max_limit,
        alarm_type: dto.alarm_type,
        unit_of_measurement: dto.unit_of_measurement,
        timestamp: dto.timestamp instanceof Date ? dto.timestamp : new Date(dto.timestamp),
      },
    });
  }

  async findAll(query: GetTagAlarmLogDto) {
    const { edge_id, limit = 100, offset = 0 } = query;

    const where = edge_id ? { edge_id } : {};

    const [items, total] = await Promise.all([
      this.prisma.tagAlarmLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.tagAlarmLog.count({ where }),
    ]);

    return { items, total };
  }

  async findByEdge(
    edge_id: string,
    limit = 100,
    offset = 0,
    filters?: { tag_name?: string; alarm_type?: string }
  ) {
    const where: Record<string, unknown> = { edge_id };
    if (filters?.tag_name?.trim()) {
      (where as { tag_name?: { contains: string; mode: string } }).tag_name = {
        contains: filters.tag_name.trim(),
        mode: 'insensitive',
      };
    }
    if (filters?.alarm_type === 'min' || filters?.alarm_type === 'max') {
      (where as { alarm_type?: string }).alarm_type = filters.alarm_type;
    }

    const [items, total] = await Promise.all([
      this.prisma.tagAlarmLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.tagAlarmLog.count({ where }),
    ]);

    return { items, total };
  }

  async findOne(id: number) {
    return this.prisma.tagAlarmLog.findUnique({
      where: { id },
    });
  }

  async remove(id: number) {
    return this.prisma.tagAlarmLog.delete({
      where: { id },
    });
  }
}
