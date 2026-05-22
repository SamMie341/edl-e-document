import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateAddressDto {

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    details?: string;

    @IsOptional()
    @IsNumber()
    branchId?: number;

    @IsOptional()
    @IsNumber()
    divisionId?: number;

    @IsOptional()
    @IsString()
    status?: string;
}
