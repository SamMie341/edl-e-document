import { IsOptional, IsString } from "class-validator";

export class UpdateFolderDto {

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    shelfId?: string;

    @IsOptional()
    @IsString()
    qrCode?: string;
}
