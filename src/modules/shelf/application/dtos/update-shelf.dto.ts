import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateShelfDto {
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
    maxQty?: number;

    @IsOptional()
    @IsString()
    lockerId?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
