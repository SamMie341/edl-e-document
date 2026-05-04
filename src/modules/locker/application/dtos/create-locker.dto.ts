import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateLockerDto {

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    branchId?: number;

    @IsOptional()
    @IsNumber()
    departmentId?: number;
}