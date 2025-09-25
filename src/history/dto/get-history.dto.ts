import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GetHistoryDto {
  @IsString({ message: 'edge должен быть строкой' })
  @IsNotEmpty({ message: 'edge не может быть пустым' })
  edge: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'limit должен быть числом' })
  @Min(1, { message: 'limit должен быть больше 0' })
  @Max(100, { message: 'limit не может быть больше 100' })
  limit?: number;
}
