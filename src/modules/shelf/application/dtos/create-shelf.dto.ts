import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateShelfDto {
    @IsNotEmpty()
    @IsString()
    code: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty({ message: 'ກະລຸນາລະບຸ ID ຕູ້ Locker' })
    @IsString()
    lockerId: string;
}