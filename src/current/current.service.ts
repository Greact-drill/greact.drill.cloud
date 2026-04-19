import { Injectable } from '@nestjs/common';
import { CreateCurrentDto } from './dto/create-current.dto';
import { UpdateCurrentDto } from './dto/update-current.dto';
import { PrismaService } from '../prisma.service';

type CurrentValueWithTag = {
  tag: string;
  /** null if there is no row in `current` for this tag on the edge */
  value: number | null;
  name?: string;
  tag_group?: string | null;
  min?: number;
  max?: number;
  comment?: string;
  unit_of_measurement?: string;
  precision?: number;
}

type CustomizationItem = {
  key: string;
  value: string;
};

@Injectable()
export class CurrentService {
  constructor(private prisma: PrismaService) { }

  async create(createCurrentDto: CreateCurrentDto) {
    return this.prisma.current.upsert({
      where: {
        edge_tag: {
          edge: createCurrentDto.edge,
          tag: createCurrentDto.tag,
        },
      },
      update: {
        value: createCurrentDto.value,
      },
      create: createCurrentDto,
    });
  }

  async findAll() {
    return this.prisma.current.findMany({
      orderBy: [{ edge: 'asc' }, { tag: 'asc' }],
    });
  }

  async findOne(id: number) {
    return this.prisma.current.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateCurrentDto: UpdateCurrentDto) {
    return this.prisma.current.update({
      where: { id },
      data: updateCurrentDto,
    });
  }

  async remove(id: number) {
    return this.prisma.current.delete({
      where: { id },
    });
  }

  // Дополнительные методы для работы с текущими значениями
  async findByEdge(edge: string) {
    const edgeRecord = await (this.prisma.edge as any).findUnique({
      where: { id: edge },
      select: {
        tag_ids: true
      }
    }) as { tag_ids?: string[] } | null;
    const allowedTagIds = edgeRecord?.tag_ids ?? [];
    if (!allowedTagIds.length) {
      return [];
    }

    return this.prisma.current.findMany({
      where: {
        edge,
        tag: { in: allowedTagIds }
      },
      orderBy: { tag: 'asc' },
    });
  }

  async findByEdgeAndTag(edge: string, tag: string) {
    return this.prisma.current.findUnique({
      where: {
        edge_tag: { edge, tag },
      },
    });
  }

  // Получить текущие значения для указанного edge в формате { tag: value }
  async findCurrentByEdge(edge: string): Promise<Record<string, number>> {
    const edgeRecord = await (this.prisma.edge as any).findUnique({
      where: { id: edge },
      select: {
        tag_ids: true
      }
    }) as { tag_ids?: string[] } | null;
    const allowedTagIds = edgeRecord?.tag_ids ?? [];
    if (!allowedTagIds.length) {
      return {};
    }

    const records = await this.prisma.current.findMany({
      where: {
        edge,
        tag: { in: allowedTagIds }
      },
      select: {
        tag: true,
        value: true,
      }
    });

    // Преобразуем в формат { tag: value }
    const result: Record<string, number> = {};
    for (const record of records) {
      result[record.tag] = record.value;
    }

    return result;
  }

  async findCurrentByEdgeWithTags(edge: string): Promise<CurrentValueWithTag[]> {
    const edgeRecord = await (this.prisma.edge as any).findUnique({
      where: { id: edge },
      select: {
        tag_ids: true,
      },
    }) as { tag_ids?: string[] } | null;
    const allowedTagIds = edgeRecord?.tag_ids ?? [];
    if (!allowedTagIds.length) {
      return [];
    }

    const currentRecords = await this.prisma.current.findMany({
      where: {
        edge,
        tag: { in: allowedTagIds },
      },
      select: {
        tag: true,
        value: true,
      },
    });
    const currentByTag = new Map(currentRecords.map((r) => [r.tag, r.value]));

    const tagRecords = await this.prisma.tag.findMany({
      where: {
        id: { in: allowedTagIds },
      },
    });

    const customizationRecords = await this.prisma.tag_customization.findMany({
      where: {
        edge_id: edge,
        tag_id: { in: allowedTagIds },
      },
      select: {
        tag_id: true,
        key: true,
        value: true,
      },
    });

    const tagsMap = new Map(tagRecords.map((tag) => [tag.id, tag]));

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

    // Одна строка на каждый tag_id буровой (как в edge.tag_ids), не только те, что есть в `current`
    return allowedTagIds.map((tagId) => {
      const tagInfo = tagsMap.get(tagId);
      const value = currentByTag.get(tagId);

      return {
        tag: tagId,
        value: value ?? null,
        name: tagInfo?.name,
        tag_group: tagInfo?.tag_group ?? null,
        min: tagInfo?.min,
        max: tagInfo?.max,
        comment: tagInfo?.comment,
        unit_of_measurement: tagInfo?.unit_of_measurement,
        precision: tagInfo?.precision ?? undefined,
        customization: customizationMap.get(tagId) ?? [],
      };
    });
  }
}
