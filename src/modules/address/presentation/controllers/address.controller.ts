import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { CreateAddressUseCase } from "../../application/use-cases/create-address.use-case";
import { GetAddressUseCase } from "../../application/use-cases/get-address.use-case";
import { CreateAddressDto } from "../../application/dtos/create-address.dto";

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
    constructor(
        private readonly createAddressUseCase: CreateAddressUseCase,
        private readonly getAddressUseCase: GetAddressUseCase,
    ) { }

    @Post()
    async create(@Body() dto: CreateAddressDto) {
        const address = await this.createAddressUseCase.execute(dto);
        return {
            message: 'ບັນທຶກສະຖານທີ່ສຳເລັດ',
            data: address,
        };
    }

    @Get('branch/:branchId')
    async getByBranch(@Param('branchId', ParseIntPipe) branchId: number) {
        const addresses = await this.getAddressUseCase.execute(branchId);
        return { message: 'Success', data: addresses };
    }
}