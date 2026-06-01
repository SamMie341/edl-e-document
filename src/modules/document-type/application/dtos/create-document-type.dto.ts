import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentTypeDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
