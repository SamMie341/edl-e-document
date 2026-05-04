import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { CreateShelfUseCase } from "../../application/use-cases/create-shelf.use-case";
import { GetShelvesByLockerUseCase } from "../../application/use-cases/get-shelves-by-locker.use-case";
import { CreateShelfDto } from "../../application/dtos/create-shelf.dto";

@Controller('shelves')
@UseGuards(JwtAuthGuard)
export class ShelfController {
    constructor(
        private readonly createShelfUseCase: CreateShelfUseCase,
        private readonly getShelvesByLockerUseCase: GetShelvesByLockerUseCase,
    ) { }

    @Post()
    async create(@Body() dto: CreateShelfDto) {
        const shelf = await this.createShelfUseCase.execute(dto);
        return { message: 'ເພີ່ມຊັ້ນວາງສຳເລັດ', data: shelf };
    }

    @Get('locker/:lockerId')
    async getByLocker(@Param('lockerId') lockerId: string) {
        const shelves = await this.getShelvesByLockerUseCase.execute(lockerId);
        return { message: 'Success', data: shelves };
    }
}