import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateWarehouseDto {
    @IsNotEmpty({ message: 'ກະລຸນາລະບຸລະຫັດສາງ' })
    @IsString()
    code: string;

    @IsNotEmpty({ message: 'ກະລຸນາລະບຸຊື່ສາງ' })
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty({ message: 'ກະລຸນາລະບຸລະຫັດສາຂາ' })
    @IsNumber()
    branchId: number;

    @IsOptional()
    @IsString()
    addressId: string;
}