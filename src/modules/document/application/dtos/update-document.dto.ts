import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDate,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  docNo?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  docDate?: Date;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsString()
  subDocNo?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  subDocDate?: Date;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  docExpire?: Date;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  documentTypeId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isContractBound?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;
}
