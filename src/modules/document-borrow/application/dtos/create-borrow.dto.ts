import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBorrowDto {
  @IsUUID()
  @IsOptional()
  documentId?: string; // ຢືມເອກະສານສະເພາະ

  @IsUUID()
  @IsOptional()
  folderId?: string; // ຢືມທັງ folder

  @IsUUID()
  borrowerId: string; // user ທີ່ຢືມ

  @IsString()
  @IsOptional()
  purpose?: string; // ຈຸດປະສົງ

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  toBranchId?: number; // ສາຂາທີ່ຮັບໄປ

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
}
