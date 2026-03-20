import { IsArray, IsOptional, IsString, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTagDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    tag_group?: string;

    @Type(() => Number)
    @IsNotEmpty()
    @IsNumber()
    min: number;

    @Type(() => Number)
    @IsNotEmpty()
    @IsNumber()
    max: number;

    @IsString()
    comment: string;

    @IsString()
    unit_of_measurement: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(10)
    precision?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    edge_ids?: string[];
}
