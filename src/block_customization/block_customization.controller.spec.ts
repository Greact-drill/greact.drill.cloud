import { Test, TestingModule } from '@nestjs/testing';
import { BlockCustomizationController } from './block_customization.controller';
import { BlockCustomizationService } from './block_customization.service';

describe('BlockCustomizationController', () => {
  let controller: BlockCustomizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockCustomizationController],
      providers: [BlockCustomizationService],
    }).compile();

    controller = module.get<BlockCustomizationController>(BlockCustomizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
