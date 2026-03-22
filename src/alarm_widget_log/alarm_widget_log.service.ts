import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AlarmWidgetLogService {
  constructor(private prisma: PrismaService) {}

  async findByEdge(
    edge_id: string,
    limit = 100,
    offset = 0,
    filters?: { tag_name?: string },
  ) {
    const where: Record<string, unknown> = { edge_id };
    if (filters?.tag_name?.trim()) {
      (where as { tag_name?: { contains: string; mode: string } }).tag_name = {
        contains: filters.tag_name.trim(),
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.alarmWidgetLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.alarmWidgetLog.count({ where }),
    ]);

    return { items, total };
  }
}
