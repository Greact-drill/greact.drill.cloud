import { TagService } from './tag.service';

describe('TagService', () => {
  let service: TagService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      edge: {
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((cb: any) =>
        cb({
          edge: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({}),
          },
          tag: {
            upsert: jest.fn().mockResolvedValue({
              id: 'tag-1',
              name: 'Tag 1',
              min: 0,
              max: 100,
              comment: '',
              unit_of_measurement: 'N/A',
              edge_ids: [],
            }),
            update: jest.fn().mockResolvedValue({
              id: 'tag-1',
              name: 'Tag 1',
              min: 0,
              max: 100,
              comment: '',
              unit_of_measurement: 'N/A',
              edge_ids: [],
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

  it('allows assigning tag to root edge', async () => {
    prismaMock.edge.findMany.mockResolvedValue([
      { id: 'edge-1' },
    ]);

    await expect(service.create({
      id: 'tag-1',
      name: 'Tag 1',
      min: 0,
      max: 100,
      comment: '',
      unit_of_measurement: 'N/A',
      edge_ids: ['edge-1'],
    } as any)).resolves.toBeDefined();
  });
});
