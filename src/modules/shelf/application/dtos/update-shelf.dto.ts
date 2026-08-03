import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateShelfDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'ຄວາມຈຸຂອງຊັ້ນວາງຕ້ອງຫຼາຍກວ່າ 0' })
  maxQty?: number;

  @IsOptional()
  @IsString()
  lockerId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
