import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAddressDto {

    @IsNotEmpty()
    @IsString()
    code: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    details?: string;

    @IsNotEmpty()
    @IsNumber()
    branchId: number;

    @IsOptional()
    @IsNumber()
    divisionId?: number;
}