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

  /** Edge id + все дочерние (по parent_id), чтобы собрать теги с дочерних установок (burnasos1/2 и т.д.). */
  private async getSubtreeEdgeIds(rootId: string): Promise<string[]> {
    const allEdges = await this.prisma.edge.findMany({
      select: { id: true, parent_id: true },
    });
    if (!allEdges.some((e) => e.id === rootId)) {
      return [];
    }

    const childrenByParent = new Map<string | null, string[]>();
    for (const e of allEdges) {
      const p = e.parent_id ?? null;
      const list = childrenByParent.get(p) ?? [];
      list.push(e.id);
      childrenByParent.set(p, list);
    }

    const result: string[] = [];
    const queue: string[] = [rootId];
    while (queue.length) {
      const id = queue.shift()!;
      result.push(id);
      const children = childrenByParent.get(id) ?? [];
      for (const c of children) {
        queue.push(c);
      }
    }
    return result;
  }

  /**
   * Расширяет набор edge: если у тега в Tag.edge_ids есть и A и B, а A уже в пуле — добавляем B (транзитивно).
   * Так подтягиваются burnasos* и др., если они связаны с буровой через общие теги.
   */
  private async expandEdgePoolWithTagLinkage(seedEdgeIds: string[]): Promise<string[]> {
    const knownEdges = new Set((await this.prisma.edge.findMany({ select: { id: true } })).map((e) => e.id));
    let pool = new Set(seedEdgeIds.filter((id) => knownEdges.has(id)));
    let changed = true;
    while (changed) {
      changed = false;
      const tags = await this.prisma.tag.findMany({
        where: { edge_ids: { hasSome: Array.from(pool) } },
        select: { edge_ids: true },
      });
      for (const t of tags) {
        for (const eid of t.edge_ids ?? []) {
          if (knownEdges.has(eid) && !pool.has(eid)) {
            pool.add(eid);
            changed = true;
          }
        }
      }
    }
    return Array.from(pool);
  }

  /** Объединение tag_ids со всех edge поддерева и тегов, у которых в Tag.edge_ids есть любой из этих edge. */
  private async collectTagIdsForEdgeSubtree(subtreeEdgeIds: string[]): Promise<string[]> {
    if (!subtreeEdgeIds.length) {
      return [];
    }

    const tagIdSet = new Set<string>();

    const edges = await this.prisma.edge.findMany({
      where: { id: { in: subtreeEdgeIds } },
      select: { tag_ids: true },
    });
    for (const e of edges) {
      for (const t of e.tag_ids ?? []) {
        tagIdSet.add(t);
      }
    }

    const linkedByTagTable = await this.prisma.tag.findMany({
      where: { edge_ids: { hasSome: subtreeEdgeIds } },
      select: { id: true },
    });
    for (const row of linkedByTagTable) {
      tagIdSet.add(row.id);
    }

    return Array.from(tagIdSet);
  }

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
    const subtreeEdgeIds = await this.expandEdgePoolWithTagLinkage(await this.getSubtreeEdgeIds(edge));
    if (!subtreeEdgeIds.length) {
      return [];
    }

    const mergedTagIds = await this.collectTagIdsForEdgeSubtree(subtreeEdgeIds);
    if (!mergedTagIds.length) {
      return [];
    }

    const currentRecords = await this.prisma.current.findMany({
      where: {
        edge: { in: subtreeEdgeIds },
        tag: { in: mergedTagIds },
      },
      select: {
        tag: true,
        value: true,
        edge: true,
      },
    });

    const currentByTag = new Map<string, number>();
    for (const r of currentRecords) {
      if (r.edge === edge) {
        currentByTag.set(r.tag, r.value);
      }
    }
    for (const r of currentRecords) {
      if (!currentByTag.has(r.tag)) {
        currentByTag.set(r.tag, r.value);
      }
    }

    const tagRecords = await this.prisma.tag.findMany({
      where: {
        id: { in: mergedTagIds },
      },
    });

    const customizationRecords = await this.prisma.tag_customization.findMany({
      where: {
        edge_id: { in: subtreeEdgeIds },
        tag_id: { in: mergedTagIds },
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

    const sortKey = (tagId: string) => {
      const tagInfo = tagsMap.get(tagId);
      const group = (tagInfo?.tag_group ?? '').trim();
      const groupSort = group || '\uffff';
      const name = tagInfo?.name ?? tagId;
      return { groupSort, name, tagId };
    };

    const orderedTagIds = [...mergedTagIds].sort((a, b) => {
      const ka = sortKey(a);
      const kb = sortKey(b);
      const g = ka.groupSort.localeCompare(kb.groupSort, 'ru');
      if (g !== 0) {
        return g;
      }
      const n = ka.name.localeCompare(kb.name, 'ru');
      if (n !== 0) {
        return n;
      }
      return a.localeCompare(b);
    });

    return orderedTagIds.map((tagId) => {
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
