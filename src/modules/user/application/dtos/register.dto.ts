import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  // @IsEmail({}, { message: 'ຮູບແບບອີເມວບໍ່ຖືກຕ້ອງ' })
  // @IsNotEmpty({ message: 'ກະລຸນາລະບຸອີເມວ' })
  // email: string;

  @IsString()
  @IsNotEmpty({ message: 'ກະລຸນາລະບຸລະຫັດພະນັກງານ' })
  empCode: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງນ້ອຍ 6 ຕົວ' })
  password: 'EDL1234';
}
