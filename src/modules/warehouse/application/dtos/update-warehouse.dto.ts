import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateWarehouseDto {
    @IsOptional()
    @IsString()
    code?: string;

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
    @IsString()
    addressId?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
