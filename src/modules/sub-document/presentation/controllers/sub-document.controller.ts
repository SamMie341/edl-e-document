import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateSubDocumentDto, CreateSubDocumentsDto } from '../../application/dtos/create-sub-document.dto';
import { UpdateSubDocumentDto } from '../../application/dtos/update-sub-document.dto';
import { CreateSubDocumentUseCase } from '../../application/use-cases/create-sub-document.use-case';
import { GetSubDocumentsUseCase } from '../../application/use-cases/get-sub-documents.use-case';
import { UpdateSubDocumentUseCase } from '../../application/use-cases/update-sub-document.use-case';
import { DeleteSubDocumentUseCase } from '../../application/use-cases/delete-sub-document.use-case';

@Controller('documents/:documentId/sub-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubDocumentController {
  constructor(
    private readonly createSubDocumentUseCase: CreateSubDocumentUseCase,
    private readonly getSubDocumentsUseCase: GetSubDocumentsUseCase,
    private readonly updateSubDocumentUseCase: UpdateSubDocumentUseCase,
    private readonly deleteSubDocumentUseCase: DeleteSubDocumentUseCase,
  ) { }

  // ─── GET all sub-documents ─────────────────────────────────────────────────
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getAll(@Param('documentId') documentId: string) {
    const data = await this.getSubDocumentsUseCase.execute(documentId);
    return { message: 'Success', data };
  }

  // ─── CREATE sub-document ───────────────────────────────────────────────────
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async create(
    @Param('documentId') documentId: string,
    @Body() dto: CreateSubDocumentsDto,
  ) {
    const data = await this.createSubDocumentUseCase.execute(documentId, dto);
    return { message: 'ສ້າງເອກະສານຍ່ອຍສຳເລັດ', data };
  }

  // ─── UPDATE sub-document ───────────────────────────────────────────────────
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubDocumentDto,
  ) {
    const data = await this.updateSubDocumentUseCase.execute(id, dto);
    return { message: 'ແກ້ໄຂເອກະສານຍ່ອຍສຳເລັດ', data };
  }

  // ─── DELETE sub-document ───────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async delete(@Param('id') id: string) {
    const result = await this.deleteSubDocumentUseCase.execute(id);
    return result;
  }
}
