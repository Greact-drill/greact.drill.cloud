import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEdgeDto } from './dto/create-edge.dto';
import { UpdateEdgeDto } from './dto/update-edge.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EdgeService {
  constructor(private prisma: PrismaService) {}

  async getScopedCurrentByEdgeAndBlock(edgeId: string, blockId: string) {
    const [edge, block] = await Promise.all([
      this.prisma.edge.findUnique({
        where: { id: edgeId },
        select: { id: true, parent_id: true }
      }),
      this.prisma.edge.findUnique({
        where: { id: blockId },
        select: { id: true, parent_id: true }
      })
    ]);

    if (!edge) {
      throw new NotFoundException(`Edge with ID "${edgeId}" not found`);
    }
    if (!block) {
      throw new NotFoundException(`Block edge with ID "${blockId}" not found`);
    }
    if (block.parent_id !== edgeId) {
      throw new BadRequestException(
        `Block "${blockId}" does not belong to edge "${edgeId}".`
      );
    }

    const blockWithTags = await this.prisma.edge.findUnique({
      where: { id: blockId },
      select: {
        tag_ids: true
      }
    });
    const allowedTagIds = blockWithTags?.tag_ids ?? [];
    if (!allowedTagIds.length) {
      return { edgeIds: [edgeId], tags: [], tagMeta: [] };
    }

    const [currentRecords, tagRecords] = await Promise.all([
      this.prisma.current.findMany({
        where: {
          edge: edgeId,
          tag: { in: allowedTagIds }
        },
        select: {
          edge: true,
          tag: true,
          value: true
        }
      }),
      this.prisma.tag.findMany({
        where: {
          id: { in: allowedTagIds }
        }
      })
    ]);

    const tagsMap = new Map(tagRecords.map(tag => [tag.id, tag]));
    const tags = currentRecords.map(record => {
      const tagInfo = tagsMap.get(record.tag);
      return {
        edge: blockId,
        tag: record.tag,
        value: record.value,
        name: tagInfo?.name,
        min: tagInfo?.min,
        max: tagInfo?.max,
        comment: tagInfo?.comment,
        unit_of_measurement: tagInfo?.unit_of_measurement,
        precision: tagInfo?.precision
      };
    });

    const tagMeta = tagRecords.map(tag => ({
      id: tag.id,
      name: tag.name,
      min: tag.min,
      max: tag.max,
      comment: tag.comment,
      unit_of_measurement: tag.unit_of_measurement,
      precision: tag.precision
    }));

    return { edgeIds: [edgeId], tags, tagMeta };
  }

  private async getDescendantEdgeIds(edgeId: string): Promise<string[]> {
    const edges = await this.prisma.edge.findMany({
      select: {
        id: true,
        parent_id: true
      }
    });

    const childrenMap = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!edge.parent_id) {
        return;
      }
      if (!childrenMap.has(edge.parent_id)) {
        childrenMap.set(edge.parent_id, []);
      }
      childrenMap.get(edge.parent_id)!.push(edge.id);
    });

    const result: string[] = [];
    const stack = [edgeId];
    while (stack.length) {
      const current = stack.pop()!;
      result.push(current);
      const children = childrenMap.get(current) ?? [];
      children.forEach(child => stack.push(child));
    }

    return result;
  }

  async getScopedCurrent(edgeId: string, includeChildren: boolean = true) {
    const edgeIds = includeChildren ? await this.getDescendantEdgeIds(edgeId) : [edgeId];

    const tagCustomizations = await this.prisma.tag_customization.findMany({
      where: {
        edge_id: { in: edgeIds },
        key: 'widgetConfig'
      },
      select: {
        edge_id: true,
        tag_id: true
      }
    });

    const tableCustomizations = await this.prisma.edge_customization.findMany({
      where: {
        edge_id: { in: edgeIds },
        key: 'tableConfig'
      },
      select: {
        edge_id: true,
        value: true
      }
    });

    const allowedTagsByEdge = new Map<string, Set<string>>();
    tagCustomizations.forEach(custom => {
      if (!allowedTagsByEdge.has(custom.edge_id)) {
        allowedTagsByEdge.set(custom.edge_id, new Set());
      }
      allowedTagsByEdge.get(custom.edge_id)!.add(custom.tag_id);
    });

    tableCustomizations.forEach(custom => {
      try {
        const config = JSON.parse(custom.value);
        const cells = Array.isArray(config.cells) ? config.cells : [];
        cells.forEach((row: any[]) => {
          if (!Array.isArray(row)) {
            return;
          }
          row.forEach(cell => {
            if (!cell || (cell.type !== 'tag-number' && cell.type !== 'tag-text')) {
              return;
            }
            const tagId = cell.tag_id || cell.value;
            if (!tagId) {
              return;
            }
            if (!allowedTagsByEdge.has(custom.edge_id)) {
              allowedTagsByEdge.set(custom.edge_id, new Set());
            }
            allowedTagsByEdge.get(custom.edge_id)!.add(tagId);
          });
        });
      } catch (error) {
        console.error('Ошибка парсинга tableConfig:', error);
      }
    });

    if (!allowedTagsByEdge.size) {
      return { edgeIds, tags: [], tagMeta: [] };
    }

    const allowedTagIds = new Set<string>();
    allowedTagsByEdge.forEach(tagIds => {
      tagIds.forEach(tagId => allowedTagIds.add(tagId));
    });

    if (!allowedTagIds.size) {
      return { edgeIds, tags: [], tagMeta: [] };
    }

    const edgesWithTags = await this.prisma.edge.findMany({
      where: { id: { in: edgeIds } },
      select: {
        id: true,
        tag_ids: true
      }
    });

    const allowedByEdgeTag = new Map<string, Set<string>>();
    edgesWithTags.forEach(edgeWithTags => {
      const filteredTagIds = edgeWithTags.tag_ids.filter(tagId => allowedTagIds.has(tagId));
      allowedByEdgeTag.set(
        edgeWithTags.id,
        new Set(filteredTagIds)
      );
    });

    allowedTagsByEdge.forEach((tagIds, edge) => {
      const allowedForEdge = allowedByEdgeTag.get(edge);
      if (!allowedForEdge) {
        allowedTagsByEdge.delete(edge);
        return;
      }
      const filtered = new Set(Array.from(tagIds).filter(tagId => allowedForEdge.has(tagId)));
      if (!filtered.size) {
        allowedTagsByEdge.delete(edge);
        return;
      }
      allowedTagsByEdge.set(edge, filtered);
    });

    if (!allowedTagsByEdge.size) {
      return { edgeIds, tags: [], tagMeta: [] };
    }

    const filteredAllowedTagIds = new Set<string>();
    allowedTagsByEdge.forEach(tagIds => {
      tagIds.forEach(tagId => filteredAllowedTagIds.add(tagId));
    });

    const currentRecords = await this.prisma.current.findMany({
      where: {
        edge: { in: edgeIds },
        tag: { in: Array.from(filteredAllowedTagIds) }
      },
      select: {
        edge: true,
        tag: true,
        value: true
      }
    });

    const filteredRecords = currentRecords.filter(record => {
      const allowed = allowedTagsByEdge.get(record.edge);
      return allowed ? allowed.has(record.tag) : false;
    });

    const tagIds = Array.from(filteredAllowedTagIds);
    const tagRecords = await this.prisma.tag.findMany({
      where: {
        id: { in: tagIds }
      }
    });
    const tagsMap = new Map(tagRecords.map(tag => [tag.id, tag]));

    const tags = filteredRecords.map(record => {
      const tagInfo = tagsMap.get(record.tag);
      return {
        edge: record.edge,
        tag: record.tag,
        value: record.value,
        name: tagInfo?.name,
        min: tagInfo?.min,
        max: tagInfo?.max,
        comment: tagInfo?.comment,
        unit_of_measurement: tagInfo?.unit_of_measurement,
        precision: tagInfo?.precision
      };
    });

    const tagMeta = tagRecords.map(tag => ({
      id: tag.id,
      name: tag.name,
      min: tag.min,
      max: tag.max,
      comment: tag.comment,
      unit_of_measurement: tag.unit_of_measurement,
      precision: tag.precision
    }));

    return { edgeIds, tags, tagMeta };
  }

  async getCurrentByTags(edgeId: string, tagIds: string[], includeChildren: boolean = true) {
    const edgeIds = includeChildren ? await this.getDescendantEdgeIds(edgeId) : [edgeId];
    const uniqueTagIds = Array.from(new Set(tagIds.filter(Boolean)));
    if (!uniqueTagIds.length) {
      return { edgeIds, tags: [], tagMeta: [] };
    }

    const edgesWithTags = await this.prisma.edge.findMany({
      where: {
        id: { in: edgeIds }
      },
      select: {
        id: true,
        tag_ids: true
      }
    });
    const hasAnyLinks = edgesWithTags.some(edgeWithTags =>
      edgeWithTags.tag_ids.some(tagId => uniqueTagIds.includes(tagId))
    );
    if (!hasAnyLinks) {
      return { edgeIds, tags: [], tagMeta: [] };
    }

    const allowedByEdge = new Map<string, Set<string>>();
    edgesWithTags.forEach(edgeWithTags => {
      const filteredTagIds = edgeWithTags.tag_ids.filter(tagId => uniqueTagIds.includes(tagId));
      allowedByEdge.set(
        edgeWithTags.id,
        new Set(filteredTagIds)
      );
    });

    const allowedTagIds = new Set(
      edgesWithTags.flatMap(edgeWithTags => edgeWithTags.tag_ids).filter(tagId => uniqueTagIds.includes(tagId))
    );

    const [currentRecords, tagRecords] = await Promise.all([
      this.prisma.current.findMany({
        where: {
          edge: { in: edgeIds },
          tag: { in: Array.from(allowedTagIds) }
        },
        select: {
          edge: true,
          tag: true,
          value: true
        }
      }),
      this.prisma.tag.findMany({
        where: {
          id: { in: Array.from(allowedTagIds) }
        }
      })
    ]);

    const tagsMap = new Map(tagRecords.map(tag => [tag.id, tag]));
    const tags = currentRecords.filter(record => {
      const allowed = allowedByEdge.get(record.edge);
      return allowed ? allowed.has(record.tag) : false;
    }).map(record => {
      const tagInfo = tagsMap.get(record.tag);
      return {
        edge: record.edge,
        tag: record.tag,
        value: record.value,
        name: tagInfo?.name,
        min: tagInfo?.min,
        max: tagInfo?.max,
        comment: tagInfo?.comment,
        unit_of_measurement: tagInfo?.unit_of_measurement,
        precision: tagInfo?.precision
      };
    });

    const tagMeta = tagRecords.map(tag => ({
      id: tag.id,
      name: tag.name,
      min: tag.min,
      max: tag.max,
      comment: tag.comment,
      unit_of_measurement: tag.unit_of_measurement,
      precision: tag.precision
    }));

    return { edgeIds, tags, tagMeta };
  }

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

  async getEdgeTagCustomizations(edgeId: string) {
    const edge = await this.prisma.edge.findUnique({
      where: { id: edgeId },
      select: { id: true, name: true, tag_ids: true }
    });
    if (!edge) {
      throw new NotFoundException(`Edge with ID "${edgeId}" not found`);
    }
    const tagIds = edge.tag_ids ?? [];
    if (!tagIds.length) {
      return { edge: { id: edge.id, name: edge.name, tag_ids: [] }, tags: [], customizations: [] };
    }

    const [tags, customizations] = await Promise.all([
      this.prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true, name: true, min: true, max: true, comment: true, unit_of_measurement: true, precision: true }
      }),
      this.prisma.tag_customization.findMany({
        where: {
          edge_id: edgeId,
          tag_id: { in: tagIds }
        },
        orderBy: [{ tag_id: 'asc' }, { key: 'asc' }]
      })
    ]);

    return {
      edge: { id: edge.id, name: edge.name, tag_ids: tagIds },
      tags,
      customizations: customizations.map(c => ({ tag_id: c.tag_id, key: c.key, value: c.value }))
    };
  }

  /**
   * Возвращает edge_id для поиска в таблице current.
   * По бизнес-логике все теги с одной буровой приходят с одним ключом (родительский edge).
   * Для блоков (дочерних edge) данные в current хранятся под parent_id.
   */
  private async getEdgeIdForCurrentLookup(
    edgeId: string,
    cache?: Map<string, string>
  ): Promise<string> {
    if (cache?.has(edgeId)) {
      return cache.get(edgeId)!;
    }
    const edge = await this.prisma.edge.findUnique({
      where: { id: edgeId },
      select: { parent_id: true }
    });
    const result = edge?.parent_id ?? edgeId;
    cache?.set(edgeId, result);
    return result;
  }

  async getWidgetConfigs(edgeId: string) {
    const edge = await this.prisma.edge.findUnique({
      where: { id: edgeId },
      select: { tag_ids: true }
    });
    const allowedTagIds = edge?.tag_ids ?? [];
    if (!allowedTagIds.length) {
      return [];
    }
    const customizations = await this.prisma.tag_customization.findMany({
      where: { 
        edge_id: edgeId,
        tag_id: { in: allowedTagIds },
        key: 'widgetConfig'
      }
    });

    const currentLookupEdgeId = await this.getEdgeIdForCurrentLookup(edgeId);
    const result: any[] = [];
    
    for (const custom of customizations) {
      try {
        const config = JSON.parse(custom.value);
        const tag = await this.prisma.tag.findUnique({
          where: { id: custom.tag_id }
        });
        
        const current = await this.prisma.current.findUnique({
          where: {
            edge_tag: {
              edge: currentLookupEdgeId,
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
            max: tag?.max,
            precision: tag?.precision
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

    const currentLookupCache = new Map<string, string>();
    const result = [];
    
    for (const custom of customizations) {
      try {
        const config = JSON.parse(custom.value);
        
        // Проверяем, подходит ли конфиг для запрошенной страницы
        if (config.page === page) {
          const tag = await this.prisma.tag.findUnique({
            where: { id: custom.tag_id }
          });
          
          const currentLookupEdgeId = await this.getEdgeIdForCurrentLookup(custom.edge_id, currentLookupCache);
          const current = await this.prisma.current.findUnique({
            where: {
              edge_tag: {
                edge: currentLookupEdgeId,
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
              max: tag?.max,
              precision: tag?.precision
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

    const currentLookupCache = new Map<string, string>();
    const result = [];
    
    for (const custom of customizations) {
      try {
        const config = JSON.parse(custom.value);
        const tag = await this.prisma.tag.findUnique({
          where: { id: custom.tag_id }
        });
        
        const currentLookupEdgeId = await this.getEdgeIdForCurrentLookup(custom.edge_id, currentLookupCache);
        const current = await this.prisma.current.findUnique({
          where: {
            edge_tag: {
              edge: currentLookupEdgeId,
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
            max: tag?.max,
            precision: tag?.precision
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

  // Методы для работы с таблицами
  async getTableConfigsByPage(page: string) {
    // Ищем конфигурацию таблицы для страницы
    // Используем edge_customization, где edge_id = page, key = 'tableConfig'
    const customization = await this.prisma.edge_customization.findUnique({
      where: {
        edge_id_key: {
          edge_id: page,
          key: 'tableConfig'
        }
      }
    });

    if (!customization) {
      return null;
    }

    try {
      const config = JSON.parse(customization.value);
      
      // Загружаем данные для таблицы: значения тегов
      const result: any = {
        id: customization.id,
        page: config.page || page,
        title: config.title || '',
        rows: config.rows || 0,
        cols: config.cols || 0,
        rowHeaders: config.rowHeaders || [],
        colHeaders: config.colHeaders || [],
        cells: config.cells || [],
        data: {} // Данные будут заполнены ниже
      };

      // Загружаем значения тегов для ячеек
      // Нужно получить edge_id для загрузки данных тегов
      // Для этого используем первый доступный edge или edge из page (если page не MAIN_)
      let edgeId = page;
      if (page.startsWith('MAIN_')) {
        edgeId = page.replace('MAIN_', '');
      }

      const currentLookupEdgeId = await this.getEdgeIdForCurrentLookup(edgeId);

      for (let row = 0; row < result.rows; row++) {
        result.data[row] = {};
        for (let col = 0; col < result.cols; col++) {
          const cell = result.cells?.[row]?.[col];
          if (cell && (cell.type === 'tag-number' || cell.type === 'tag-text') && cell.value) {
            const tagId = cell.value;
            
            const current = await this.prisma.current.findUnique({
              where: {
                edge_tag: {
                  edge: currentLookupEdgeId,
                  tag: tagId
                }
              }
            });

            const tag = await this.prisma.tag.findUnique({
              where: { id: tagId }
            });

            result.data[row][col] = {
              value: current?.value ?? null,
              tag: tag ? {
                id: tag.id,
                name: tag.name,
                comment: tag.comment,
                unit_of_measurement: tag.unit_of_measurement,
                min: tag.min,
                max: tag.max,
                precision: tag.precision
              } : null,
              updatedAt: current?.updatedAt ?? null
            };
          } else {
            result.data[row][col] = null;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Ошибка парсинга конфига таблицы:', error);
      return null;
    }
  }

  async getAllTableConfigs() {
    // Находим все конфигурации таблиц
    const customizations = await this.prisma.edge_customization.findMany({
      where: {
        key: 'tableConfig'
      }
    });

    const result = [];
    
    for (const custom of customizations) {
      try {
        const config = JSON.parse(custom.value);
        result.push({
          id: custom.id,
          page: config.page || custom.edge_id,
          title: config.title || '',
          rows: config.rows || 0,
          cols: config.cols || 0
        });
      } catch (error) {
        console.error('Ошибка парсинга конфига таблицы:', error);
      }
    }

    return result;
  }

  async getDiagramConfigByPage(page: string) {
    const customization = await this.prisma.edge_customization.findFirst({
      where: {
        edge_id: page,
        key: {
          in: ['diagramConfig', 'diagramPageConfig'],
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!customization) {
      return null;
    }

    try {
      const config = JSON.parse(customization.value);

      return {
        id: customization.id,
        page,
        backgroundUrl: config.backgroundUrl || '',
        backgroundOpacity: config.backgroundOpacity ?? 0.22,
        backgroundFit: config.backgroundFit || 'contain',
        regions: Array.isArray(config.regions) ? config.regions : [],
      };
    } catch (error) {
      console.error('Ошибка парсинга diagramConfig:', error);
      return null;
    }
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
