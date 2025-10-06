import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBlockDto {
	@IsNotEmpty()
    @IsString()
	id: string;

	@IsNotEmpty()
    @IsString()
	name: string;

	@IsNotEmpty()
    @IsString()
	edge_id: string;
}
