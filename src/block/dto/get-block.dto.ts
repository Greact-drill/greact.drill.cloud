import { IsString, IsNotEmpty } from 'class-validator';

export class GetBlockDto {
  @IsString({ message: 'block должен быть строкой' })
  @IsNotEmpty({ message: 'block не может быть пустым' })
  id: string;
}
