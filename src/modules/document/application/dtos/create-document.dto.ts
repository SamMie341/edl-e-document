import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsEnum,
  IsBoolean,
} from 'class-validator';


export class CreateDocumentDto {
  @IsNotEmpty()
  @IsString()
  docNo: string;

  @IsNotEmpty()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  docDate: Date;

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

  @IsNotEmpty({ message: 'ຫົວຂໍ້ເອກະສານຫ້າມເປັນຄ່າວ່າງ' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  docExpire: Date;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  userId: string;

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
}
