import { IsString, IsNotEmpty } from 'class-validator';
import { BaseEdgeDto } from './base-edge.dto';

export class CreateEdgeDto extends BaseEdgeDto {
	@IsNotEmpty()
    @IsString()
	id: string;
}
