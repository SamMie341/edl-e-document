import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateLockerDto {
    @IsNotEmpty({ message: 'ກະລຸນາລະບຸລະຫັດຕູ້' })
    @IsString()
    code: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional({ message: 'ກະລຸນາລະບຸ ID ຂອງສາງເອກະສານ' })
    @IsString()
    warehouseId?: string;
}