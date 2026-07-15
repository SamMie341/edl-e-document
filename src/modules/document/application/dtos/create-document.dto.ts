import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsBoolean,
  IsInt,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateSubDocumentDto } from '../../../sub-document/application/dtos/create-sub-document.dto';


export class CreateDocumentDto {

  @IsOptional()
  @IsUUID()
  id: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubDocumentDto)
  subDocuments?: CreateSubDocumentDto[];

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
  userId?: string;

  @IsNotEmpty()
  @IsString()
  folderId: string;

  @IsNotEmpty()
  @IsString()
  documentTypeId: string;

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
