import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateShelfDto {
    @IsNotEmpty({ message: 'ກະລຸນາລະບຸລະຫັດຊັ້ນວາງ' })
    @IsString()
    code: string;

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