import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateFolderDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    branchId: number;
}