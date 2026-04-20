import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RejectDocumentDto {
    @IsString()
    @IsNotEmpty({ message: 'ກະລຸນາລະບຸເຫດຜົນທີ່ບໍ່ອະນຸມັດເອກະສານ' })
    @MaxLength(500)
    reason: string;
}