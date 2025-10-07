import { IsNumber, IsObject, IsString } from 'class-validator';

export class IngestRequestDto {
  @IsNumber()
  timestamp: number;

  @IsObject()
  values: Record<string, number>;
}