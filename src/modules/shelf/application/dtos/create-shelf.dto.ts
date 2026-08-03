import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateShelfDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'ກະລຸນາກຳນົດຄວາມຈຸຂອງຊັ້ນ' })
  @IsNumber()
  @Min(1, { message: 'ຄວາມຈຸຂອງຊັ້ນວາງຕ້ອງຫຼາຍກວ່າ 0' })
  maxQty: number;
}

export class CreateShelvesDto {
  @IsOptional()
  @IsString()
  lockerId?: string;

  @IsNotEmpty({ message: 'ລາຍການຊັ້ນວາງຫ້າມເປັນຄ່າວ່າງ' })
  @IsArray({ message: 'ລາຍການຊັ້ນວາງຕ້ອງເປັນ Array' })
  @ValidateNested({ each: true })
  @Type(() => CreateShelfDto)
  shelves: CreateShelfDto[];
}
