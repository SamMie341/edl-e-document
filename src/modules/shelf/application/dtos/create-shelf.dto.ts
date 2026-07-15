import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';

export class CreateShelfDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'ກະລຸນາກຳນົດຄວາມຈຸຂອງຊັ້ນ' })
  @IsNumber()
  maxQty: number;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ID ຕູ້ Locker' })
  @IsString()
  lockerId: string;
}

export class CreateShelvesDto {
  @IsNotEmpty({ message: 'ລາຍການຊັ້ນວາງຫ້າມເປັນຄ່າວ່າງ' })
  @IsArray({ message: 'ລາຍການຊັ້ນວາງຕ້ອງເປັນ Array' })
  @ValidateNested({ each: true })
  @Type(() => CreateShelfDto)
  shelves: CreateShelfDto[];
}
