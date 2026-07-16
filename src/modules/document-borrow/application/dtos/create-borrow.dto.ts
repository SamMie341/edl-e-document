
import { IsString, IsOptional, IsNumber, IsUUID, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBorrowDto {
  @IsUUID('all', { each: true })
  @IsOptional()
  documentIds?: string[]; // ຢືມເອກະສານສະເພາະ (ຫຼາຍລາຍການ)

  @IsUUID('all', { each: true })
  @IsOptional()
  folderIds?: string[]; // ຢືມທັງ folder (ຫຼາຍລາຍການ)

  @IsNotEmpty()
  @IsString()
  borrower: string; // user ທີ່ຢືມ

  @IsString()
  @IsOptional()
  phone?: string; // ເບີໂທ

  @IsString()
  @IsOptional()
  purpose?: string; // ຈຸດປະສົງ

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  toDivisionId?: number; // ພາກສ່ວນທີ່ຮັບໄປ

  @IsString()
  @IsOptional()
  toLocation?: string; // free text (ຫ້ອງ, ຊັ້ນ...)

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  dueDate?: string; // ວັນທີກຳນົດສົ່ງ
}
