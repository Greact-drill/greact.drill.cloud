import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBlockCustomizationDto {

    @IsNotEmpty()
    @IsString()
    block_id: string;

    @IsNotEmpty()
    @IsString()
    key: string;

    @IsNotEmpty()
    @IsString()
    value: string;

}
