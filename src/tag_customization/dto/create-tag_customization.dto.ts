import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTagCustomizationDto {
    @IsNotEmpty()
    @IsString()
    edge_id: string;

    @IsNotEmpty()
    @IsString()
    tag_id: string;

    @IsNotEmpty()
    @IsString()
    key: string;

    @IsNotEmpty()
    @IsString()
    value: string;
}
