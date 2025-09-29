import { PartialType } from '@nestjs/mapped-types';
import { CreateEdgeCustomizationDto } from './create-edge_customization.dto';

export class UpdateEdgeCustomizationDto extends PartialType(CreateEdgeCustomizationDto) {}
