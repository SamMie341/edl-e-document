import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDate } from 'class-validator';

export class CreateDocumentDto {
    @IsNotEmpty()
    @IsString()
    docNo: string;

    @IsNotEmpty()
    @Transform(({ value }) => value ? new Date(value) : value)
    @IsDate()
    docDate: Date;

    @IsOptional()
    @IsString()
    subDocNo?: string;

    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : value)
    @IsDate()
    subDocDate?: Date;

    @IsNotEmpty({ message: 'ຫົວຂໍ້ເອກະສານຫ້າມເປັນຄ່າວ່າງ' })
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    status: string;

    @IsNotEmpty()
    @Transform(({ value }) => value ? new Date(value) : value)
    @IsDate()
    docExpire: Date;

    @IsOptional()
    @IsString()
    qrCode?: string;

    @IsOptional()
    @IsString()
    userId: string;

    @IsOptional()
    @IsString()
    folderId?: string;

    @IsOptional()
    @IsString()
    documentTypeId?: string;
}