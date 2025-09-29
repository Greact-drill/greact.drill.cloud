import { Test, TestingModule } from '@nestjs/testing';
import { TagCustomizationController } from './tag_customization.controller';
import { TagCustomizationService } from './tag_customization.service';

describe('TagCustomizationController', () => {
  let controller: TagCustomizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagCustomizationController],
      providers: [TagCustomizationService],
    }).compile();

    controller = module.get<TagCustomizationController>(TagCustomizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
