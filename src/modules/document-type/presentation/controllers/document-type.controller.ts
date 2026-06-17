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
  Query,
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

  // ─── GET ALL — HQ & BRANCH & USER ────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.getAllDocumentTypesUseCase.execute({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 100,
      search,
      status,
    });
    return { message: 'Success', ...result };
  }

  // ─── GET by name — HQ & BRANCH & USER ────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    const decodedName = decodeURIComponent(name);
    const data = await this.getDocumentTypeByNameUseCase.execute(decodedName);
    return { message: 'ຄົ້ນຫາສຳເລັດ', data };
  }

  // ─── GET by id — HQ & BRANCH & USER ──────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get(':id')
  async findById(@Param('id') id: string) {
    const documentType = await this.getDocumentTypeByIdUseCase.execute(id);
    return { data: documentType };
  }

  // ─── CREATE — HQ ເທົ່ານັ້ນ ────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  @Post()
  async create(@Body() dto: CreateDocumentTypeDto) {
    const type = await this.createDocumentTypeUseCase.execute(dto);
    return { message: 'ເພີ່ມປະເພດເອກະສານສຳເລັດ', data: type };
  }

  // ─── UPDATE — HQ ເທົ່ານັ້ນ ────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDocumentTypeDto) {
    const documentType = await this.updateDocumentTypeUseCase.execute(id, dto);
    return { message: 'ແກ້ໄຂປະເພດເອກະສານສຳເລັດ', data: documentType };
  }

  // ─── DELETE — HQ ເທົ່ານັ້ນ ────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.deleteDocumentTypeUseCase.execute(id);
    return { message: 'ລຶບປະເພດເອກະສານສຳເລັດ' };
  }
}
