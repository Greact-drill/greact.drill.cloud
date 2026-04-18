import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(() => {
    service = new HistoryService({} as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('collapses duplicate values inside one bucket but keeps neighboring buckets', () => {
    const normalized = (service as any).normalizeBucketRows([
      {
        tag: 'tag-1',
        bucketId: 0,
        timestamp: new Date('2026-04-10T00:00:01.000Z'),
        value: 10,
      },
      {
        tag: 'tag-1',
        bucketId: 0,
        timestamp: new Date('2026-04-10T00:00:10.000Z'),
        value: 10,
      },
      {
        tag: 'tag-1',
        bucketId: 0,
        timestamp: new Date('2026-04-10T00:00:20.000Z'),
        value: 10,
      },
      {
        tag: 'tag-1',
        bucketId: 1,
        timestamp: new Date('2026-04-10T00:01:05.000Z'),
        value: 10,
      },
    ]);

    expect(normalized['tag-1']).toEqual([
      {
        timestamp: new Date('2026-04-10T00:00:01.000Z'),
        value: 10,
      },
      {
        timestamp: new Date('2026-04-10T00:01:05.000Z'),
        value: 10,
      },
    ]);
  });

  it('keeps only meaningful bucket turning points', () => {
    const normalized = (service as any).normalizeBucketRows([
      {
        tag: 'tag-1',
        bucketId: 3,
        timestamp: new Date('2026-04-10T03:00:30.000Z'),
        value: 15,
      },
      {
        tag: 'tag-1',
        bucketId: 3,
        timestamp: new Date('2026-04-10T03:00:05.000Z'),
        value: 10,
      },
      {
        tag: 'tag-1',
        bucketId: 3,
        timestamp: new Date('2026-04-10T03:00:15.000Z'),
        value: 20,
      },
      {
        tag: 'tag-1',
        bucketId: 3,
        timestamp: new Date('2026-04-10T03:00:45.000Z'),
        value: 15,
      },
    ]);

    expect(normalized['tag-1']).toEqual([
      {
        timestamp: new Date('2026-04-10T03:00:05.000Z'),
        value: 10,
      },
      {
        timestamp: new Date('2026-04-10T03:00:15.000Z'),
        value: 20,
      },
      {
        timestamp: new Date('2026-04-10T03:00:30.000Z'),
        value: 15,
      },
    ]);
  });

  it('supports bigint bucket identifiers from postgres', () => {
    const normalized = (service as any).normalizeBucketRows([
      {
        tag: 'tag-1',
        bucketId: 0n,
        timestamp: new Date('2026-04-10T00:00:01.000Z'),
        value: 1,
      },
      {
        tag: 'tag-1',
        bucketId: 1n,
        timestamp: new Date('2026-04-10T00:10:01.000Z'),
        value: 2,
      },
    ]);

    expect(normalized['tag-1']).toEqual([
      {
        timestamp: new Date('2026-04-10T00:00:01.000Z'),
        value: 1,
      },
      {
        timestamp: new Date('2026-04-10T00:10:01.000Z'),
        value: 2,
      },
    ]);
  });
});
