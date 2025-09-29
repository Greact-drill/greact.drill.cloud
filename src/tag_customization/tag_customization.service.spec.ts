import { Test, TestingModule } from '@nestjs/testing';
import { TagCustomizationService } from './tag_customization.service';

describe('TagCustomizationService', () => {
  let service: TagCustomizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagCustomizationService],
    }).compile();

    service = module.get<TagCustomizationService>(TagCustomizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
