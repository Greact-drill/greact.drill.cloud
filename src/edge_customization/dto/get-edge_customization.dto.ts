import { IsString, IsNotEmpty } from 'class-validator';

export class GetEdgeCustomizationDto {
  @IsString({ message: 'edge должен быть строкой' })
  @IsNotEmpty({ message: 'edge не может быть пустым' })
  edge_id: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}