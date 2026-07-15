import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateWarehouseDto {
  @IsNotEmpty({ message: 'ກະລຸນາລະບຸລະຫັດສາງ' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸຊື່ສາງ' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @IsOptional()
  @IsNumber()
  divisionId?: number;
}
