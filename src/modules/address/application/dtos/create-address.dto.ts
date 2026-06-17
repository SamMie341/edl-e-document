import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ departmentId' })
  @IsNumber()
  departmentId: number;

  @IsNotEmpty({ message: 'ກະລຸນາລະບຸ divisionId' })
  @IsNumber()
  divisionId: number;
}
