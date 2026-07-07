import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  StreamableFile,
  Get,
  Query,
  UploadedFiles,
  Put,
  Delete,
  ForbiddenException,
} from '@nestjs/common';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { CreateDocumentDto } from '../../application/dtos/create-document.dto';
import { UpdateDocumentUseCase } from '../../application/use-cases/update-document.use-case';
import { UpdateDocumentDto } from '../../application/dtos/update-document.dto';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/auth/guards/roles.guard';
import { Roles } from '../../../../core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { UploadAttachmentUseCase } from '../../application/use-cases/upload-attachment.use-case';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GetAttachmentUseCase } from '../../application/use-cases/get-attachment.use-case';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { GetAllDocumentUseCase } from '../../application/use-cases/get-all-document.use-case';
import { GetDocumentByIdUseCase } from '../../application/use-cases/get-document-by-id.use-case';
import { DeleteExpiredDocumentsUseCase } from '../../application/use-cases/delete-expired-documents.use-case';
import { GetExpiredDocumentsUseCase } from '../../application/use-cases/get-expired-documents.use-case';
import { PrismaService } from 'src/core/database/prisma.service';


@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
    private readonly getAttachmentUseCase: GetAttachmentUseCase,
    private readonly getAllDocumentUseCase: GetAllDocumentUseCase,
    private readonly getDocumentByIdUseCase: GetDocumentByIdUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly deleteExpiredDocumentsUseCase: DeleteExpiredDocumentsUseCase,
    private readonly getExpiredDocumentsUseCase: GetExpiredDocumentsUseCase,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getAllDocument(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('documentTypeId') documentTypeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('folderId') folderId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('retentionStatus') retentionStatus?: string,
  ) {
    const user = req.user;
    let targetUserId: string | undefined = undefined;
    let targetDivisionId: number | undefined = divisionId ? parseInt(divisionId) : undefined;
    let targetDepartmentId: number | undefined = departmentId ? parseInt(departmentId) : undefined;
    let targetDivisionIds: number[] | undefined = undefined;

    if (user.role === Role.USER) {
      // USER เห็นเฉพาะ document ใน primary division ของตัวเอง
      const primaryDiv = await this.prisma.userDivisionModel.findFirst({
        where: { userId: user.userId, isPrimary: true },
        select: { divisionId: true },
      });
      targetDivisionIds = primaryDiv ? [primaryDiv.divisionId] : [-1];
    } else if (user.role === Role.BRANCH_ADMIN) {
      // BRANCH_ADMIN เห็นเฉพาะ document ใน divisions ที่ถูก assign
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      const allowedDivisionIds = userDivs.map((ud) => ud.divisionId);

      if (targetDivisionId !== undefined) {
        if (allowedDivisionIds.includes(targetDivisionId)) {
          targetDivisionIds = [targetDivisionId];
        } else {
          targetDivisionIds = [-1]; // not authorized for the requested divisionId
        }
      } else {
        targetDivisionIds = allowedDivisionIds.length > 0 ? allowedDivisionIds : [-1];
      }
    } else {
      if (targetDivisionId !== undefined) {
        targetDivisionIds = [targetDivisionId];
      }
    }

    const params = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      documentTypeId: documentTypeId ? parseInt(documentTypeId) : undefined,
      startDate,
      endDate,
      search,
      folderId,
      userId: targetUserId,
      departmentId: targetDepartmentId,
      divisionIds: targetDivisionIds,
      retentionStatus,
    };
    const result = await this.getAllDocumentUseCase.execute(params);
    return {
      message: 'Success',
      ...result,
    };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getDocumentById(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const document = await this.getDocumentByIdUseCase.execute(id);

    if (user.role === Role.USER) {
      // USER เห็นเฉพาะ document ใน primary division ของตัวเอง
      const primaryDiv = await this.prisma.userDivisionModel.findFirst({
        where: { userId: user.userId, isPrimary: true },
        select: { divisionId: true },
      });
      if (!document.divisionId || !primaryDiv || document.divisionId !== primaryDiv.divisionId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງເອກະສານນີ້');
      }
    } else if (user.role === Role.BRANCH_ADMIN) {
      // BRANCH_ADMIN เห็นเฉพาะ document ใน divisions ที่ถูก assign
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      const allowedDivisionIds = userDivs.map((ud) => ud.divisionId);
      if (!document.divisionId || !allowedDivisionIds.includes(document.divisionId)) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງເອກະສານນີ້');
      }
    }

    return {
      message: 'Success',
      data: document,
    };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────────
  @Post()
  @UseInterceptors(FilesInterceptor('files', Number.MAX_SAFE_INTEGER, {
    storage: require('multer').memoryStorage(),
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new BadRequestException(`ອະນຸຍາດສະເພາະໄຟລ໌ PDF ເທົ່ານັ້ນ, ບໍ່ອະນຸຍາດໄຟລ໌"${file.mimetype}"`), false);
      }
      cb(null, true);
    },
  }))
  @Roles(Role.SUPER_ADMIN, Role.USER, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async create(
    @Req() req: any,
    @Body() dto: CreateDocumentDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = req.user.userId;
    const document = await this.createDocumentUseCase.execute(dto, userId, files);
    return {
      message: 'ສ້າງເອກະສຳເລັດ',
      data: document,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────────
  @Put(':id')
  @UseInterceptors(FilesInterceptor('files', Number.MAX_SAFE_INTEGER, {
    storage: require('multer').memoryStorage(),
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new BadRequestException(`ອະນຸຍາດສະເພາະໄຟລ໌ PDF ເທົ່ານັ້ນ, ແຕ່ໄດ້ຮັບ "${file.mimetype}"`), false);
      }
      cb(null, true);
    },
  }))
  @Roles(Role.SUPER_ADMIN, Role.USER, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @Req() req: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const document = await this.updateDocumentUseCase.execute(id, dto, req.user, files);
    return {
      message: 'ແກ້ໄຂເອກະສານສຳເລັດ',
      data: document,
    };
  }

  // ─── UPLOAD ATTACHMENT ────────────────────────────────────────────────────────
  @Post(':id/attachments')
  @Roles(Role.SUPER_ADMIN, Role.USER, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    storage: require('multer').memoryStorage(),
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new BadRequestException(`ອະນຸຍາດສະເພາະໄຟລ໌ PDF ເທົ່ານັ້ນ, ແຕ່ໄດ້ຮັບ "${file.mimetype}"`), false);
      }
      cb(null, true);
    },
  }))
  async uploadAttachment(
    @Param('id') documentId: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('ກະລຸນາແນບໄຟລ໌ມາດ້ວຍ');
    }
    const attachment = await this.uploadAttachmentUseCase.execute(
      documentId,
      file,
      req.user.userId,
    );
    return {
      message: 'ອັບໂຫຼດ ແລະ ບີບອັດໄຟລ໌ສຳເລັດ',
      data: attachment,
    };
  }

  // ─── GET ATTACHMENT (stream file) ─────────────────────────────────────────────
  @Get('attachments/:attachmentId')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const attachment = await this.getAttachmentUseCase.execute(
      attachmentId,
      req.user,
    );
    const fileStream = createReadStream(attachment.filePath);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
    });
    return new StreamableFile(fileStream);
  }

  // ─── DOWNLOAD ATTACHMENT (force download) ─────────────────────────────────────
  @Get('attachments/:attachmentId/download')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async downloadAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const attachment = await this.getAttachmentUseCase.execute(
      attachmentId,
      req.user,
    );
    const fileStream = createReadStream(attachment.filePath);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
      'Content-Length': attachment.size,
    });
    return new StreamableFile(fileStream);
  }

  // ─── GET EXPIRED (list for review) ─────────────────────────────────────────
  @Get('expired')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async getExpiredDocuments() {
    const result = await this.getExpiredDocumentsUseCase.execute();
    return { message: 'Success', ...result };
  }

  // ─── DELETE EXPIRED (bulk delete after review) ────────────────────────────
  @Delete('expired')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async deleteExpiredDocuments() {
    const result = await this.deleteExpiredDocumentsUseCase.execute();
    return { message: result.message, deleted: result.deleted };
  }
}
