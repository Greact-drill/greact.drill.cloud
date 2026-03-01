import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}
  
    private async assertEdgesExist(edgeIds: string[], options?: { allowEmpty?: boolean }) {
      const uniqueEdgeIds = Array.from(new Set(edgeIds));
      if (!uniqueEdgeIds.length) {
        if (options?.allowEmpty) {
          return [];
        }
        throw new BadRequestException('edge_ids must contain at least one edge id.');
      }

      const edges = await this.prisma.edge.findMany({
        where: { id: { in: uniqueEdgeIds } },
        select: { id: true }
      });

      if (edges.length !== uniqueEdgeIds.length) {
        const existing = new Set(edges.map(edge => edge.id));
        const missing = uniqueEdgeIds.filter(id => !existing.has(id));
        throw new NotFoundException(`Edges not found: ${missing.join(', ')}`);
      }

      return uniqueEdgeIds;
    }

    private mapTagWithEdges(tag: any, edgeIds: string[]) {
      const { edge_ids, ...rest } = tag;
      return {
        ...rest,
        edge_ids: edgeIds
      };
    }

    private async syncEdgeLinksToTag(edgeIds: string[], tagId: string) {
      const edgesWithTag = await this.prisma.edge.findMany({
        where: { tag_ids: { has: tagId } },
        select: { id: true, tag_ids: true }
      });
      const edgeIdsSet = new Set(edgeIds);

      await Promise.all(
        edgesWithTag.map(edgeRecord => {
          const nextTagIds = edgeIdsSet.has(edgeRecord.id)
            ? Array.from(new Set([...(edgeRecord.tag_ids ?? []), tagId]))
            : (edgeRecord.tag_ids ?? []).filter(id => id !== tagId);
          return this.prisma.edge.update({
            where: { id: edgeRecord.id },
            data: { tag_ids: nextTagIds }
          });
        })
      );

      const missingEdgeIds = edgeIds.filter(edgeId => !edgesWithTag.some(edgeRecord => edgeRecord.id === edgeId));
      if (missingEdgeIds.length) {
        const missingEdges = await this.prisma.edge.findMany({
          where: { id: { in: missingEdgeIds } },
          select: { id: true, tag_ids: true }
        });
        await Promise.all(
          missingEdges.map(edgeRecord =>
            this.prisma.edge.update({
              where: { id: edgeRecord.id },
              data: { tag_ids: Array.from(new Set([...(edgeRecord.tag_ids ?? []), tagId])) }
            })
          )
        );
      }
    }

    async create(createTagDto: CreateTagDto) {
      const { edge_ids, ...tagData } = createTagDto;
      const uniqueEdgeIds = await this.assertEdgesExist(edge_ids ?? [], { allowEmpty: true });

      const tag = await this.prisma.$transaction(async tx => {
        const tag = await tx.tag.upsert({
          where: {
            id: tagData.id
          },
          update: {
            name: tagData.name,
            min: tagData.min,
            max: tagData.max,
            comment: tagData.comment,
            unit_of_measurement: tagData.unit_of_measurement,
            edge_ids: uniqueEdgeIds,
          },
          create: {
            ...tagData,
            edge_ids: uniqueEdgeIds,
          },
        });

        return tag;
      });
      await this.syncEdgeLinksToTag(uniqueEdgeIds, tag.id);
      return this.mapTagWithEdges(tag, tag.edge_ids ?? []);
    }

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      orderBy: [{ id: 'asc' }],
    });

    return tags.map(tag => this.mapTagWithEdges(tag, tag.edge_ids ?? []));
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      return null;
    }

    return this.mapTagWithEdges(tag, tag.edge_ids ?? []);
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const { edge_ids, ...tagData } = updateTagDto as UpdateTagDto & { edge_ids?: string[] };

    const tag = await this.prisma.$transaction(async tx => {
      if (edge_ids !== undefined) {
        const uniqueEdgeIds = await this.assertEdgesExist(edge_ids, { allowEmpty: true });
        const tag = await tx.tag.update({
          where: { id },
          data: {
            ...tagData,
            edge_ids: uniqueEdgeIds,
          },
        });
        return tag;
      }

      const tag = await tx.tag.update({
        where: { id },
        data: tagData,
      });
      return tag;
    });

    if (edge_ids !== undefined) {
      const uniqueEdgeIds = Array.from(new Set(edge_ids.filter(Boolean)));
      await this.syncEdgeLinksToTag(uniqueEdgeIds, id);
    }

    return this.mapTagWithEdges(tag, tag.edge_ids ?? []);
  }

  async remove(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: { tag_customizations: { take: 1 } }
    });

    if (!tag) {
      throw new NotFoundException(`Tag not found: ${id}`);
    }

    if (tag.tag_customizations.length > 0) {
      throw new ConflictException(
        'Невозможно удалить тег: он используется в виджетах. Сначала удалите виджеты, использующие этот тег.'
      );
    }

    return this.prisma.$transaction(async tx => {
      const edges = await tx.edge.findMany({
        where: { tag_ids: { has: id } },
        select: { id: true, tag_ids: true }
      });

      await Promise.all(
        edges.map(edgeRecord =>
          tx.edge.update({
            where: { id: edgeRecord.id },
            data: { tag_ids: edgeRecord.tag_ids.filter(tagId => tagId !== id) }
          })
        )
      );

      return tx.tag.delete({
        where: { id },
      });
    });
  }

  async upsertTagsFromApi(tagIds: string[]) {
    const promises = tagIds.map(tagId => {
      return this.prisma.tag.upsert({
        where: { id: tagId },
        update: {
        },
        create: {
          id: tagId,
          name: tagId,
          min: 0,
          max: 100,
          comment: 'Auto-synced from current API',
          unit_of_measurement: 'N/A', 
        },
      });
    });

    return Promise.all(promises);
  }
}
