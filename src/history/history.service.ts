import { Injectable } from '@nestjs/common';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { PrismaService } from '../prisma.service';

type HistoryGroupedWithTag = {
  name: string;
  min?: number;
  max?: number;
  comment?: string;
  unit_of_measurement?: string;
  tag: string;
  history: {
    timestamp: Date;
    value: number;
  }[]
  customization?: CustomizationItem[];
}

type CustomizationItem = {
  key: string;
  value: string;
};

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


  async findLatestByEdgeWithTags(edge: string, limit: number = 20): Promise<HistoryGroupedWithTag[]> {
    const groupedHistory = await this.findLatestByEdge(edge, limit);

    const tagIds = Object.keys(groupedHistory);
    const tagRecords = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds },
      },
    });

    const customizationRecords = await this.prisma.tag_customization.findMany({
      where: {
        edge_id: edge,
        tag_id: { in: tagIds },
      },
      select: {
        tag_id: true,
        key: true,
        value: true,
      }
    });

    const tagsMap = new Map(tagRecords.map(tag => [tag.id, tag]));

    const customizationMap = new Map<string, CustomizationItem[]>();
    for (const record of customizationRecords) {
        if (!customizationMap.has(record.tag_id)) {
            customizationMap.set(record.tag_id, []);
        }
        customizationMap.get(record.tag_id)?.push({
            key: record.key,
            value: record.value,
        });
    }

    const result: HistoryGroupedWithTag[] = tagIds.map(tagId => {
    const tagInfo = tagsMap.get(tagId);
    const customInfo = customizationMap.get(tagId);
    
    return {
      tag: tagId,
      name: tagInfo?.name || tagId,
      min: tagInfo?.min,
      max: tagInfo?.max,
      comment: tagInfo?.comment,
      unit_of_measurement: tagInfo?.unit_of_measurement,
      history: groupedHistory[tagId].map(h => ({
        timestamp: h.timestamp,
        value: h.value,
      })),
      customization: customInfo,
    };
  });

    // Опционально: можно отсортировать по имени тега для лучшей читаемости
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }


}
