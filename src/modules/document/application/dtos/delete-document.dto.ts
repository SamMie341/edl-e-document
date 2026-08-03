import { IsOptional, IsString } from 'class-validator';

export class DeleteDocumentDto {
  @IsOptional()
  @IsString()
  destroyedDate?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
