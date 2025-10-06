import { IsString, IsNotEmpty } from 'class-validator';

export class GetTagCustomization {
  @IsString({ message: 'tag_customization должен быть строкой' })
  @IsNotEmpty({ message: 'tag_customization не может быть пустым' })
  edge_id: string;

  @IsNotEmpty()
  @IsString()
  tag_id: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
