import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}
  
    private async assertEdgesExist(edgeIds: string[]) {
      const uniqueEdgeIds = Array.from(new Set(edgeIds));
      if (!uniqueEdgeIds.length) {
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
      const { edge_tags, ...rest } = tag;
      return {
        ...rest,
        edge_ids: edgeIds
      };
    }

    async create(createTagDto: CreateTagDto) {
      const { edge_ids, ...tagData } = createTagDto;
      const uniqueEdgeIds = await this.assertEdgesExist(edge_ids);

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
            unit_of_measurement: tagData.unit_of_measurement
          },
          create: tagData,
        });

        await tx.edge_tag.createMany({
          data: uniqueEdgeIds.map(edgeId => ({
            edge_id: edgeId,
            tag_id: tag.id
          })),
          skipDuplicates: true
        });

        return this.mapTagWithEdges(tag, uniqueEdgeIds);
      });
    }

  async findAll() {
    const tags = await this.prisma.tag.findMany({
      orderBy: [{ id: 'asc' }],
      include: {
        edge_tags: {
          select: { edge_id: true }
        }
      }
    });

    return tags.map(tag => this.mapTagWithEdges(
      tag,
      tag.edge_tags.map(edgeTag => edgeTag.edge_id)
    ));
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        edge_tags: {
          select: { edge_id: true }
        }
      }
    });

    if (!tag) {
      return null;
    }

    return this.mapTagWithEdges(
      tag,
      tag.edge_tags.map(edgeTag => edgeTag.edge_id)
    );
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    const { edge_ids, ...tagData } = updateTagDto as UpdateTagDto & { edge_ids?: string[] };

    return this.prisma.$transaction(async tx => {
      const tag = await tx.tag.update({
        where: { id },
        data: tagData,
      });

      if (edge_ids !== undefined) {
        const uniqueEdgeIds = await this.assertEdgesExist(edge_ids);
        await tx.edge_tag.deleteMany({
          where: { tag_id: id }
        });
        await tx.edge_tag.createMany({
          data: uniqueEdgeIds.map(edgeId => ({
            edge_id: edgeId,
            tag_id: id
          })),
          skipDuplicates: true
        });

        return this.mapTagWithEdges(tag, uniqueEdgeIds);
      }

      const existingEdges = await tx.edge_tag.findMany({
        where: { tag_id: id },
        select: { edge_id: true }
      });

      return this.mapTagWithEdges(
        tag,
        existingEdges.map(edgeTag => edgeTag.edge_id)
      );
    });
  }

  async remove(id: string) {
    return await this.prisma.tag.delete({
      where: { id },
    })
  }

  async upsertTagsFromApi(tagIds: string[], edgeId: string) {
    await this.assertEdgesExist([edgeId]);
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

    const tags = await Promise.all(promises);

    await this.prisma.edge_tag.createMany({
      data: tags.map(tag => ({
        edge_id: edgeId,
        tag_id: tag.id
      })),
      skipDuplicates: true
    });

    return tags;
  }
}
