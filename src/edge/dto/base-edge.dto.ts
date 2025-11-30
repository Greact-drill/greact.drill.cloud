import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BaseEdgeDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    parent_id?: string;
}