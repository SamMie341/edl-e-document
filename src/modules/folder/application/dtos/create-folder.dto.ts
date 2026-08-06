import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFolderDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸຊື່ໂກໂນ' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸລາຍລະອຽດໂກໂນ' })
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ID ຂອງຊັ້ນວາງ' })
  @IsString()
  shelfId: string;
}
