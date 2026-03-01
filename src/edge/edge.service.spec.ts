import { EdgeService } from './edge.service';
import { BadRequestException } from '@nestjs/common';

describe('EdgeService', () => {
  let service: EdgeService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      edge: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      current: {
        findMany: jest.fn(),
      },
      tag: {
        findMany: jest.fn(),
      },
    };
    service = new EdgeService(prismaMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns scoped current by edge and block', async () => {
    prismaMock.edge.findUnique
      .mockResolvedValueOnce({ id: 'edge-1', parent_id: null })
      .mockResolvedValueOnce({ id: 'block-1', parent_id: 'edge-1' });
    prismaMock.edge.findUnique.mockResolvedValueOnce({
      tag_ids: ['tag-1'],
    });
    prismaMock.current.findMany.mockResolvedValue([
      { edge: 'edge-1', tag: 'tag-1', value: 10 },
    ]);
    prismaMock.tag.findMany.mockResolvedValue([
      {
        id: 'tag-1',
        name: 'Tag 1',
        min: 0,
        max: 100,
        comment: 'ok',
        unit_of_measurement: 'bar',
      },
    ]);

    const result = await service.getScopedCurrentByEdgeAndBlock('edge-1', 'block-1');

    expect(result.edgeIds).toEqual(['edge-1']);
    expect(result.tags).toEqual([
      expect.objectContaining({
        edge: 'block-1',
        tag: 'tag-1',
        value: 10,
      }),
    ]);
    expect(result.tagMeta).toHaveLength(1);
  });

  it('throws when block does not belong to edge', async () => {
    prismaMock.edge.findUnique
      .mockResolvedValueOnce({ id: 'edge-1', parent_id: null })
      .mockResolvedValueOnce({ id: 'block-1', parent_id: 'edge-2' });

    await expect(
      service.getScopedCurrentByEdgeAndBlock('edge-1', 'block-1')
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
