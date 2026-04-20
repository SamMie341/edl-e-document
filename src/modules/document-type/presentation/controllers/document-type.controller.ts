import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateDocumentTypeUseCase } from '../../application/use-cases/create-document-type.use-case';
import { GetAllDocumentTypesUseCase } from '../../application/use-cases/get-all-document-types.use-case';
import { GetDocumentTypeByIdUseCase } from '../../application/use-cases/get-document-type-by-id.use-case';
import { UpdateDocumentTypeUseCase } from '../../application/use-cases/update-document-type.use-case';
import { DeleteDocumentTypeUseCase } from '../../application/use-cases/delete-document-type.use-case';
import { CreateDocumentTypeDto } from '../../application/dtos/create-document-type.dto';
import { UpdateDocumentTypeDto } from '../../application/dtos/update-document-type.dto';
import { GetDocumentTypeByNameUseCase } from '../../application/use-cases/get-document-type-by-name.use-case';

@Controller('document-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentTypeController {
    constructor(
        private readonly createDocumentTypeUseCase: CreateDocumentTypeUseCase,
        private readonly getAllDocumentTypesUseCase: GetAllDocumentTypesUseCase,
        private readonly getDocumentTypeByIdUseCase: GetDocumentTypeByIdUseCase,
        private readonly updateDocumentTypeUseCase: UpdateDocumentTypeUseCase,
        private readonly deleteDocumentTypeUseCase: DeleteDocumentTypeUseCase,
        private readonly getDocumentTypeByNameUseCase: GetDocumentTypeByNameUseCase,
    ) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
    async create(@Body() dto: CreateDocumentTypeDto) {
        const documentType = await this.createDocumentTypeUseCase.execute(dto);
        return {
            message: 'ເພີ່ມປະເພດເອກະສານສຳເລັດ',
            data: documentType,
        };
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
    async findAll() {
        const documentTypes = await this.getAllDocumentTypesUseCase.execute();
        return { data: documentTypes };
    }

    @Get('name/:name')
    @Roles(Role.USER, Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN)
    async findByName(@Param('name') name: string) {
        const decodedName = decodeURIComponent(name);

        const data = await this.getDocumentTypeByNameUseCase.execute(decodedName);
        return {
            message: 'ຄົ້ນຫາສຳເລັດ',
            data: data,
        };
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
    async findById(@Param('id') id: string) {
        const documentType = await this.getDocumentTypeByIdUseCase.execute(id);
        return { data: documentType };
    }

    @Put(':id')
    @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
    async update(@Param('id') id: string, @Body() dto: UpdateDocumentTypeDto) {
        const documentType = await this.updateDocumentTypeUseCase.execute(id, dto);
        return {
            message: 'ແກ້ໄຂປະເພດເອກະສານສຳເລັດ',
            data: documentType,
        };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles(Role.SUPER_ADMIN)
    async delete(@Param('id') id: string) {
        await this.deleteDocumentTypeUseCase.execute(id);
        return { message: 'ລຶບປະເພດເອກະສານສຳເລັດ' };
    }
}
