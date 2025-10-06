import { PartialType } from '@nestjs/mapped-types';
import { BaseEdgeDto } from './base-edge.dto';

export class UpdateEdgeDto extends PartialType(BaseEdgeDto) {}
