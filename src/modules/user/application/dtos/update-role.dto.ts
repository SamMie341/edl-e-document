import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from 'src/core/auth/constants/role.enum';

export class UpdateRoleDto {
  @IsNotEmpty({ message: 'ກະລຸນາລະບຸສິດທີ່ຕ້ອງການປ່ຽນ' })
  @IsEnum(Role, { message: 'ສິດການນຳໃຊ້ບໍ່ຖືກຕ້ອງ' })
  role: Role;
}
