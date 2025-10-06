import { IsString, IsNotEmpty } from 'class-validator';

export class GetEdgeDto {
  @IsString({ message: 'edge должен быть строкой' })
  @IsNotEmpty({ message: 'edge не может быть пустым' })
  id: string;
}