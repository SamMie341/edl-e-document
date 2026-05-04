import { IsNotEmpty, IsString } from "class-validator";

export class UpdateRoleDto {
    @IsNotEmpty({ message: 'ກະລຸນາລະບຸສິດທີ່ຕ້ອງການປ່ຽນ' })
    @IsString()
    role: string;
}