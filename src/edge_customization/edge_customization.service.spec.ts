import { Test, TestingModule } from '@nestjs/testing';
import { EdgeCustomizationService } from './edge_customization.service';

describe('EdgeCustomizationService', () => {
  let service: EdgeCustomizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EdgeCustomizationService],
    }).compile();

    service = module.get<EdgeCustomizationService>(EdgeCustomizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
