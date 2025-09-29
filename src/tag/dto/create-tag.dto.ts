import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTagDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

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
}
