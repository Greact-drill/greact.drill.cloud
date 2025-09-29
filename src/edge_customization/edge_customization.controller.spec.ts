import { Test, TestingModule } from '@nestjs/testing';
import { EdgeCustomizationController } from './edge_customization.controller';
import { EdgeCustomizationService } from './edge_customization.service';

describe('EdgeCustomizationController', () => {
  let controller: EdgeCustomizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EdgeCustomizationController],
      providers: [EdgeCustomizationService],
    }).compile();

    controller = module.get<EdgeCustomizationController>(EdgeCustomizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
