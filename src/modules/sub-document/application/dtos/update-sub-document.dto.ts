import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsDate } from 'class-validator';

export class UpdateSubDocumentDto {
  @IsOptional()
  @IsString()
  subDocNo?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  subDocDate?: Date;
}
