import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTagAlarmLogDto } from './dto/create-tag-alarm-log.dto';
import type { GetTagAlarmLogDto } from './dto/get-tag-alarm-log.dto';

type TagAlarmLogFilters = {
  tag_name?: string;
  alarm_type?: string;
  journal_type?: 'indicator' | 'alarm';
  from?: string;
  to?: string;
};

@Injectable()
export class TagAlarmLogService {
  constructor(private prisma: PrismaService) {}

  private parseDateRange(filters?: Pick<TagAlarmLogFilters, 'from' | 'to'>) {
    const from = filters?.from ? new Date(filters.from) : undefined;
    const to = filters?.to ? new Date(filters.to) : undefined;

    if (from && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Параметр from содержит некорректную дату');
    }

    if (to && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Параметр to содержит некорректную дату');
    }

    if (from && to && from > to) {
      throw new BadRequestException('Параметр from не может быть больше to');
    }

    return { from, to };
  }

  private buildWhere(edge_id?: string, filters?: TagAlarmLogFilters) {
    const where: Record<string, unknown> = {};

    if (edge_id) {
      where.edge_id = edge_id;
    }

    if (filters?.journal_type === 'indicator' || filters?.journal_type === 'alarm') {
      where.journal_type = filters.journal_type;
    }

    if (filters?.tag_name?.trim()) {
      where.tag_name = {
        contains: filters.tag_name.trim(),
        mode: 'insensitive',
      };
    }

    if (filters?.alarm_type === 'min' || filters?.alarm_type === 'max') {
      where.alarm_type = filters.alarm_type;
    }

    const { from, to } = this.parseDateRange(filters);
    if (from || to) {
      where.timestamp = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    return where;
  }

  async create(dto: CreateTagAlarmLogDto) {
    return this.prisma.tagAlarmLog.create({
      data: {
        edge_id: dto.edge_id,
        tag_id: dto.tag_id,
        tag_name: dto.tag_name,
        journal_type: dto.journal_type,
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
    const { edge_id, tag_name, alarm_type, journal_type, from, to, limit = 100, offset = 0 } = query;
    const where = this.buildWhere(edge_id, { tag_name, alarm_type, journal_type, from, to });

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
    filters?: TagAlarmLogFilters
  ) {
    const where = this.buildWhere(edge_id, filters);

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
