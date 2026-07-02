import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ລະຫັດສະຖານທີ່' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ຊື່ສະຖານທີ່' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ຝ່າຍ' })
  @IsNumber()
  departmentId: number;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ພະແນກ/ສາຂາແຂວງ' })
  @IsNumber()
  divisionId: number;
}
