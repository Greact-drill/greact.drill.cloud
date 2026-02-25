import { TagService } from './tag.service';
import { BadRequestException } from '@nestjs/common';

describe('TagService', () => {
  let service: TagService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      edge: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb: any) =>
        cb({
          tag: {
            upsert: jest.fn().mockResolvedValue({
              id: 'tag-1',
              name: 'Tag 1',
              min: 0,
              max: 100,
              comment: '',
              unit_of_measurement: 'N/A',
            }),
            update: jest.fn().mockResolvedValue({
              id: 'tag-1',
              name: 'Tag 1',
              min: 0,
              max: 100,
              comment: '',
              unit_of_measurement: 'N/A',
              edges: [],
            }),
          },
        })
      ),
      tag: {
        upsert: jest.fn(),
      },
    };
    service = new TagService(prismaMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates unassigned tag when edge_ids omitted', async () => {
    prismaMock.edge.findMany.mockResolvedValue([]);
    const result = await service.create({
      id: 'tag-1',
      name: 'Tag 1',
      min: 0,
      max: 100,
      comment: '',
      unit_of_measurement: 'N/A',
    } as any);

    expect(result.edge_ids).toEqual([]);
  });

  it('rejects assigning tag to root edge', async () => {
    prismaMock.edge.findMany.mockResolvedValue([
      { id: 'edge-1', parent_id: null },
    ]);

    await expect(
      service.create({
        id: 'tag-1',
        name: 'Tag 1',
        min: 0,
        max: 100,
        comment: '',
        unit_of_measurement: 'N/A',
        edge_ids: ['edge-1'],
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
