import { PartialType } from '@nestjs/mapped-types';
import { CreateBlockCustomizationDto } from './create-block_customization.dto';

export class UpdateBlockCustomizationDto extends PartialType(CreateBlockCustomizationDto) {}
