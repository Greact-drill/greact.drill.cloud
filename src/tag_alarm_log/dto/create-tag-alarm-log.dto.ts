import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator';

export class CreateTagAlarmLogDto {
  @IsString()
  @IsNotEmpty()
  edge_id: string;

  @IsString()
  @IsNotEmpty()
  tag_id: string;

  @IsString()
  @IsNotEmpty()
  tag_name: string;

  @IsNumber()
  value: number;

  @IsNumber()
  min_limit: number;

  @IsNumber()
  max_limit: number;

  @IsString()
  @IsIn(['min', 'max'])
  alarm_type: 'min' | 'max';

  @IsString()
  unit_of_measurement: string;

  @IsNotEmpty()
  timestamp: Date;
}
