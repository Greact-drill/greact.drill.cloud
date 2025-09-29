import { PartialType } from '@nestjs/mapped-types';
import { CreateTagCustomizationDto } from './create-tag_customization.dto';

export class UpdateTagCustomizationDto extends PartialType(CreateTagCustomizationDto) {}
