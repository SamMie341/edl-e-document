import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsDate, IsArray, ValidateNested } from 'class-validator';

export class CreateSubDocumentDto {
  @IsNotEmpty({ message: 'ເລກທີ່ເອກະສານຍ່ອຍຫ້າມເປັນຄ່າວ່າງ' })
  @IsString()
  subDocNo: string;

  @IsNotEmpty({ message: 'ວັນທີ່ເອກະສານຍ່ອຍຫ້າມເປັນຄ່າວ່າງ' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  @IsDate()
  subDocDate: Date;
}

export class CreateSubDocumentsDto {
  @IsNotEmpty({ message: 'ລາຍການເອກະສານຍ່ອຍຫ້າມເປັນຄ່າວ່າງ' })
  @IsArray({ message: 'ລາຍການເອກະສານຍ່ອຍຕ້ອງເປັນ Array' })
  @ValidateNested({ each: true })
  @Type(() => CreateSubDocumentDto)
  subDocuments: CreateSubDocumentDto[];
}
