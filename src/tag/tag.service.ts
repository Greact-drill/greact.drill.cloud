import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
        select: { id: true, parent_id: true }
      });

      if (edges.length !== uniqueEdgeIds.length) {
        const existing = new Set(edges.map(edge => edge.id));
        const missing = uniqueEdgeIds.filter(id => !existing.has(id));
        throw new NotFoundException(`Edges not found: ${missing.join(', ')}`);
      }

      const rootEdgeIds = edges
        .filter(edge => edge.parent_id === null)
        .map(edge => edge.id);
      if (rootEdgeIds.length) {
        throw new BadRequestException(
          `Tags can only be assigned to block edges. Root edges are not allowed: ${rootEdgeIds.join(', ')}`
        );
      }

      return uniqueEdgeIds;
    }

    private mapTagWithEdges(tag: any, edgeIds: string[]) {
      const { edges, ...rest } = tag;
      return {
        ...rest,
        edge_ids: edgeIds
      };
    }

    async create(createTagDto: CreateTagDto) {
      const { edge_ids, ...tagData } = createTagDto;
      const uniqueEdgeIds = await this.assertEdgesExist(edge_ids ?? [], { allowEmpty: true });

      return this.prisma.$transaction(async tx => {
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
            edges: {
              set: uniqueEdgeIds.map(edgeId => ({ id: edgeId }))
            }
          },
          create: {
            ...tagData,
            edges: {
              connect: uniqueEdgeIds.map(edgeId => ({ id: edgeId }))
            }
          },
        });

        return this.mapTagWithEdges(tag, uniqueEdgeIds);
      });
    }

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      orderBy: [{ id: 'asc' }],
      include: {
        edges: {
          select: { id: true }
        }
      }
    });

    return tags.map(tag => this.mapTagWithEdges(
      tag,
      tag.edges.map(edge => edge.id)
    ));
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        edges: {
          select: { id: true }
        }
      }
    });

    if (!tag) {
      return null;
    }

    return this.mapTagWithEdges(
      tag,
      tag.edges.map(edge => edge.id)
    );
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const { edge_ids, ...tagData } = updateTagDto as UpdateTagDto & { edge_ids?: string[] };

    return this.prisma.$transaction(async tx => {
      if (edge_ids !== undefined) {
        const uniqueEdgeIds = await this.assertEdgesExist(edge_ids, { allowEmpty: true });
        const tag = await tx.tag.update({
          where: { id },
          data: {
            ...tagData,
            edges: {
              set: uniqueEdgeIds.map(edgeId => ({ id: edgeId }))
            }
          },
        });

        return this.mapTagWithEdges(tag, uniqueEdgeIds);
      }

      const tag = await tx.tag.update({
        where: { id },
        data: tagData,
        include: {
          edges: {
            select: { id: true }
          }
        }
      });
      return this.mapTagWithEdges(tag, tag.edges.map(edge => edge.id));
    });
  }

  async remove(id: string) {
    return await this.prisma.tag.delete({
      where: { id },
    })
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
