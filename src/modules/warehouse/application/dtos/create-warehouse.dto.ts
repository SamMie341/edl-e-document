import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸຊື່ສາງ' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  addressId?: string;
}
