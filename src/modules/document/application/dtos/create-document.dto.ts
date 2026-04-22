import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateDocumentDto {
    @IsString()
    @IsNotEmpty({ message: 'ຫົວຂໍ້ເອກະສານຫ້າມເປັນຄ່າວ່າງ' })
    // @MaxLength(200, { message: 'หัวข้อเอกสารต้องยาวไม่เกิน 200 ตัวอักษร' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'ເນື້ອໃນເອກະສານຫ້າມເປັນຄ່າວ່າງ' })
    content: string;

    @IsString()
    @IsNotEmpty({ message: 'ລະຫັດຜູ້ສ້າງເແກະສານຫ້າມເປັນຄ່າວ່າງ' })
    creatorId: string;

    @IsString()
    @IsNotEmpty()
    branchId: string;

    @IsOptional()
    @IsString()
    folderId: string;

    @IsOptional()
    @IsString()
    documentTypeId: string;
}