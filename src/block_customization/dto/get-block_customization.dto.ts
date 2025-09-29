import { IsString, IsNotEmpty } from 'class-validator';

export class GetBlockCustomizationDto {
  @IsString({ message: 'edge должен быть строкой' })
  @IsNotEmpty({ message: 'edge не может быть пустым' })
  block_id: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}