import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/auth/guards/roles.guard';
import { Roles } from '../../../../core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { BorrowDocumentUseCase } from '../../application/use-cases/borrow-document.use-case';
import { ReturnDocumentUseCase } from '../../application/use-cases/return-document.use-case';
import { GetBorrowHistoryUseCase } from '../../application/use-cases/get-borrow-history.use-case';
import { CreateBorrowDto } from '../../application/dtos/create-borrow.dto';

@Controller('document-borrows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentBorrowController {
  constructor(
    private readonly borrowDocumentUseCase: BorrowDocumentUseCase,
    private readonly returnDocumentUseCase: ReturnDocumentUseCase,
    private readonly getBorrowHistoryUseCase: GetBorrowHistoryUseCase,
  ) { }

  // ─── POST /document-borrows — ຢືມເອກະສານ ─────────────────────────────────
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async borrow(@Body() dto: CreateBorrowDto, @Req() req: any) {
    const record = await this.borrowDocumentUseCase.execute(dto, req.user.userId);
    return { message: 'ຢືມເອກະສານສຳເລັດ', data: record };
  }

  // ─── PUT /document-borrows/:id/return — ຄືນເອກະສານ ──────────────────────
  @Put(':id/return')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async returnDoc(@Param('id') id: string) {
    const record = await this.returnDocumentUseCase.execute(id);
    return { message: 'ຄືນເອກະສານສຳເລັດ', data: record };
  }

  // ─── GET /document-borrows/active — ລາຍການທີ່ຍັງຢືມຢູ່ ──────────────────
  @Get('active')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getActive() {
    const data = await this.getBorrowHistoryUseCase.findActive();
    return { message: 'Success', data };
  }

  // ─── GET /document-borrows — ລາຍການທັງໝົດ (paginated) ───────────────────
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('documentId') documentId?: string,
    @Query('borrowerId') borrowerId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const result = await this.getBorrowHistoryUseCase.findAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      documentId,
      borrowerId,
      activeOnly: activeOnly === 'true',
    });
    return { message: 'Success', ...result };
  }

  // ─── GET /document-borrows/document/:documentId — ປະຫວັດຂອງເອກະສານ ──────
  @Get('document/:documentId')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getByDocument(@Param('documentId') documentId: string) {
    const data = await this.getBorrowHistoryUseCase.findByDocumentId(documentId);
    return { message: 'Success', data };
  }

  // ─── GET /document-borrows/folder/:folderId — ທຸກ borrow ໃນ folder ───────
  @Get('folder/:folderId')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getByFolder(@Param('folderId') folderId: string) {
    const data = await this.getBorrowHistoryUseCase.findByFolderId(folderId);
    return { message: 'Success', data };
  }
}
