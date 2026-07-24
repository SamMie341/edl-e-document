import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
