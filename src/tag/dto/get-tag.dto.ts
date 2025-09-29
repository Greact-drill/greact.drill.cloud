import { IsString, IsNotEmpty } from 'class-validator';

export class GetTagDto {
  @IsString({ message: 'tag должен быть строкой' })
  @IsNotEmpty({ message: 'tag не может быть пустым' })
  id: string;
}
