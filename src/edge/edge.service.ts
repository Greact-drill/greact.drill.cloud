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

  async findRoots() {
    return this.prisma.edge.findMany({
      where: { parent_id: null },
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

  async getWidgetConfigs(edgeId: string) {
    // Находим все кастомизации для данного edge
    const customizations = await this.prisma.tag_customization.findMany({
      where: { 
        edge_id: edgeId,
        key: 'widgetConfig'
      }
    });

    const result = [];
    
    for (const custom of customizations) {
      try {
        const config = JSON.parse(custom.value);
        const tag = await this.prisma.tag.findUnique({
          where: { id: custom.tag_id }
        });
        
        const current = await this.prisma.current.findUnique({
          where: {
            edge_tag: {
              edge: custom.edge_id,
              tag: custom.tag_id
            }
          }
        });

        result.push({
          id: custom.id,
          edge_id: custom.edge_id,
          tag_id: custom.tag_id,
          config,
          tag: {
            id: tag?.id,
            name: tag?.name,
            comment: tag?.comment,
            unit_of_measurement: tag?.unit_of_measurement,
            min: tag?.min,
            max: tag?.max
          },
          current: current ? {
            value: current.value,
            updatedAt: current.updatedAt
          } : null
        });
      } catch (error) {
        console.error('Ошибка парсинга конфига:', error);
      }
    }

    return result;
  }

  async getWidgetConfigsByPage(page: string) {
    // Находим все кастомизации
    const customizations = await this.prisma.tag_customization.findMany({
      where: {
        key: 'widgetConfig'
      }
    });

    const result = [];
    
    for (const custom of customizations) {
      try {
        const config = JSON.parse(custom.value);
        
        // Проверяем, подходит ли конфиг для запрошенной страницы
        if (config.page === page) {
          const tag = await this.prisma.tag.findUnique({
            where: { id: custom.tag_id }
          });
          
          const current = await this.prisma.current.findUnique({
            where: {
              edge_tag: {
                edge: custom.edge_id,
                tag: custom.tag_id
              }
            }
          });

          result.push({
            id: custom.id,
            edge_id: custom.edge_id,
            tag_id: custom.tag_id,
            config,
            tag: {
              id: tag?.id,
              name: tag?.name,
              comment: tag?.comment,
              unit_of_measurement: tag?.unit_of_measurement,
              min: tag?.min,
              max: tag?.max
            },
            current: current ? {
              value: current.value,
              updatedAt: current.updatedAt
            } : null
          });
        }
      } catch (error) {
        console.error('Ошибка парсинга конфига:', error);
      }
    }

    return result;
  }

  async getAllWidgetConfigs() {
    // Находим все кастомизации с widgetConfig
    const customizations = await this.prisma.tag_customization.findMany({
      where: {
        key: 'widgetConfig'
      }
    });

    const result = [];
    
    for (const custom of customizations) {
      try {
        const config = JSON.parse(custom.value);
        const tag = await this.prisma.tag.findUnique({
          where: { id: custom.tag_id }
        });
        
        const current = await this.prisma.current.findUnique({
          where: {
            edge_tag: {
              edge: custom.edge_id,
              tag: custom.tag_id
            }
          }
        });

        result.push({
          id: custom.id,
          edge_id: custom.edge_id,
          tag_id: custom.tag_id,
          config,
          tag: {
            id: tag?.id,
            name: tag?.name,
            comment: tag?.comment,
            unit_of_measurement: tag?.unit_of_measurement,
            min: tag?.min,
            max: tag?.max
          },
          current: current ? {
            value: current.value,
            updatedAt: current.updatedAt
          } : null
        });
      } catch (error) {
        console.error('Ошибка парсинга конфига:', error);
      }
    }

    return result;
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