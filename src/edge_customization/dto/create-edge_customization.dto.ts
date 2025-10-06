import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEdgeCustomizationDto {
    @IsNotEmpty()
    @IsString()
    edge_id: string;

    @IsNotEmpty()
    @IsString()
    key: string;

    @IsNotEmpty()
    @IsString()
    value: string;
}
