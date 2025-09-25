import { Injectable } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) { }

  async create(createHistoryDto: CreateHistoryDto) {
    return this.prisma.history.create({
      data: createHistoryDto,
    });
  }

  async findAll() {
    return this.prisma.history.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.history.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateHistoryDto: UpdateHistoryDto) {
    return this.prisma.history.update({
      where: { id },
      data: updateHistoryDto,
    });
  }

  async remove(id: number) {
    return this.prisma.history.delete({
      where: { id },
    });
  }

  // Дополнительные методы для работы с историей
  async findByEdge(edge: string) {
    return this.prisma.history.findMany({
      where: { edge },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByTag(tag: string) {
    return this.prisma.history.findMany({
      where: { tag },
      orderBy: { timestamp: 'desc' },
    });
  }

  // Получить последние записи для каждого тега по указанному edge, сгруппированные по тегам
  async findLatestByEdge(edge: string, limit: number = 20): Promise<Record<string, { timestamp: Date; value: number }[]>> {
    type HistoryResult = {
      tag: string;
      timestamp: Date;
      value: number;
    };

    const result = await this.prisma.$queryRaw<HistoryResult[]>`
      WITH latest_records AS (
        SELECT 
          edge,
          tag,
          timestamp,
          value,
          ROW_NUMBER() OVER (
            PARTITION BY edge, tag 
            ORDER BY timestamp DESC
          ) as rn
        FROM history 
        WHERE edge = ${edge}
      )
      SELECT 
        tag,
        timestamp,
        value
      FROM latest_records 
      WHERE rn <= ${limit}
      ORDER BY tag, timestamp DESC
    `;

    // Группируем результаты по тегам
    const grouped: Record<string, { timestamp: Date; value: number }[]> = {};

    for (const record of result) {
      if (!grouped[record.tag]) {
        grouped[record.tag] = [];
      }
      grouped[record.tag].push({
        timestamp: record.timestamp,
        value: record.value
      });
    }

    return grouped;
  }
}
