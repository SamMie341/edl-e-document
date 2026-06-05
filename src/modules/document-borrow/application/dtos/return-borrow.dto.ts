import { IsOptional, IsString } from 'class-validator';

export class ReturnBorrowDto {
  @IsString()
  @IsOptional()
  note?: string; // ໝາຍເຫດຕອນຄືນ
}
