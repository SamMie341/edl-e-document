import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentTypeDto {
  @IsOptional()
  @IsString()
  code: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
