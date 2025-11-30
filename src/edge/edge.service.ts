import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEdgeDto } from './dto/create-edge.dto';
import { UpdateEdgeDto } from './dto/update-edge.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EdgeService {
  constructor(private prisma: PrismaService) {}

  async create(createEdgeDto: CreateEdgeDto) {
    // Validate parent exists if parent_id is provided
    if (createEdgeDto.parent_id) {
      const parent = await this.prisma.edge.findUnique({
        where: { id: createEdgeDto.parent_id }
      });
      if (!parent) {
        throw new NotFoundException(`Parent edge with ID "${createEdgeDto.parent_id}" not found`);
      }
    }

    return this.prisma.edge.upsert({
      where: {
        id: createEdgeDto.id
      },
      update: {
        name: createEdgeDto.name,
        parent_id: createEdgeDto.parent_id,
      },
      create: createEdgeDto,
    });
  }

  findAll() {
    return this.prisma.edge.findMany({
      orderBy: [{ id: 'asc' }],
      include: {
        children: true,
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  }

  async findTree() {
    const edges = await this.prisma.edge.findMany({
      include: {
        children: {
          include: {
            children: true // Включаем детей второго уровня
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ id: 'asc' }]
    });

    // Преобразуем в древовидную структуру для TreeTable
    const tree = this.buildTree(edges);
    return tree;
  }

    private buildTree(edges: any[]): any[] {
    const map = new Map();
    const tree: any[] = [];

    // Создаем карту всех элементов
    edges.forEach(edge => {
      const node = { 
        key: edge.id, 
        data: {
          id: edge.id,
          name: edge.name,
          parent_id: edge.parent_id,
          children: edge.children,
          parent: edge.parent
        }, 
        children: [] 
      };
      map.set(edge.id, node);
    });

    // Строим дерево
    edges.forEach(edge => {
      const node = map.get(edge.id);
      if (edge.parent_id) {
        const parent = map.get(edge.parent_id);
        if (parent) {
          parent.children.push(node);
        } else {
          // Если родитель не найден, добавляем в корень
          tree.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  findOne(id: string) {
    return this.prisma.edge.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            children: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true
          }
        },
        edge_customizations: true,
        tag_customizations: {
          include: {
            tag: true
          }
        }
      }
    });
  }

  async findChildren(parentId: string) {
    return this.prisma.edge.findMany({
      where: { parent_id: parentId },
      include: {
        children: true
      }
    });
  }

  update(id: string, updateEdgeDto: UpdateEdgeDto) {
    // Validate parent exists if parent_id is provided
    if (updateEdgeDto.parent_id) {
      // Prevent circular reference
      if (updateEdgeDto.parent_id === id) {
        throw new ConflictException('Edge cannot be its own parent');
      }
    }

    return this.prisma.edge.update({
      where: { id },
      data: updateEdgeDto
    });
  }

  async remove(id: string) {
    // Check if edge has children
    const children = await this.prisma.edge.findMany({
      where: { parent_id: id }
    });

    if (children.length > 0) {
      throw new ConflictException(
        `Cannot delete edge with ID "${id}". It has ${children.length} child edges that must be deleted or reassigned first.`
      );
    }

    try {
      return await this.prisma.edge.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ConflictException(
          `Cannot delete Edge with ID "${id}". It is referenced by other elements in the database that must be deleted or unlinked first.`
        );
      }
      throw error;
    }
  }
}