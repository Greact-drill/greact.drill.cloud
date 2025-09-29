import { Test, TestingModule } from '@nestjs/testing';
import { BlockCustomizationService } from './block_customization.service';

describe('BlockCustomizationService', () => {
  let service: BlockCustomizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockCustomizationService],
    }).compile();

    service = module.get<BlockCustomizationService>(BlockCustomizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
