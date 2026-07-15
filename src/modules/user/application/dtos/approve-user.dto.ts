import { IsEnum, IsNotEmpty, IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/core/auth/constants/role.enum';

export class ApproveUserDto {
  @IsNotEmpty({ message: 'ກະລຸນາກຳນົດສິດໃຫ້ຜູ້ໃຊ້' })
  @IsEnum(Role, { message: 'ສິດການນຳໃຊ້ບໍ່ຖືກຕ້ອງ' })
  role: Role;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  divisionIds?: number[];
}
