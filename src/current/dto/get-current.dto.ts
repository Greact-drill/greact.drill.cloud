import { IsString, IsNotEmpty } from 'class-validator';

export class GetCurrentDto {
  @IsString({ message: 'edge должен быть строкой' })
  @IsNotEmpty({ message: 'edge не может быть пустым' })
  edge: string;
}
