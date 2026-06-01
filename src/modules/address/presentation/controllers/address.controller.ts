import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
    Put,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { CreateAddressUseCase } from '../../application/use-cases/create-address.use-case';
import { CreateAddressDto } from '../../application/dtos/create-address.dto';
import { GetAllAddressUseCase } from '../../application/use-cases/get-all-address.use-case';
import { UpdateAddressUseCase } from '../../application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from '../../application/use-cases/delete-address.use-case';
import { UpdateAddressDto } from '../../application/dtos/update-address.dto';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { GetAddressDropdownUseCase } from '../../application/use-cases/get-address-dropdown.use-case';

@Controller('addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AddressController {
    constructor(
        private readonly createAddressUseCase: CreateAddressUseCase,
        private readonly getAllAddressUseCase: GetAllAddressUseCase,
        private readonly updateAddressUseCase: UpdateAddressUseCase,
        private readonly deleteAddressUseCase: DeleteAddressUseCase,
        private readonly getAddressDropdownUseCase: GetAddressDropdownUseCase,
    ) { }

    @Roles(Role.HQ_ADMIN)
    @Get()
    async getAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string,
        @Query('branchId') branchId?: string,
        @Query('divisionId') divisionId?: string,
        @Query('status') status?: string,
    ) {
        const result = await this.getAllAddressUseCase.execute({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            search,
            branchId: branchId ? parseInt(branchId) : undefined,
            divisionId: divisionId ? parseInt(divisionId) : undefined,
            status,
        });
        return { message: 'Success', ...result };
    }

    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    @Get('dropdown')
    async getDropdown(@Req() req: any) {
        const data = await this.getAddressDropdownUseCase.execute(
            req.user.role,
            req.user.divisionId,
        );
        return { message: 'Success', data };
    }

    @Roles(Role.HQ_ADMIN)
    @Post()
    async create(@Body() dto: CreateAddressDto) {
        const address = await this.createAddressUseCase.execute(dto);
        return {
            message: 'ບັນທຶກສະຖານທີ່ສຳເລັດ',
            data: address,
        };
    }

    @Roles(Role.HQ_ADMIN)
    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
        const address = await this.updateAddressUseCase.execute(id, dto);
        return {
            message: 'ອັບເດດສະຖານທີ່ສຳເລັດ',
            data: address,
        };
    }

    @Roles(Role.HQ_ADMIN)
    @Delete(':id')
    async delete(@Param('id') id: string) {
        await this.deleteAddressUseCase.execute(id);
        return { message: 'ລົບສະຖານທີ່ສຳເລັດ' };
    }
}
