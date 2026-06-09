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
import { MulterConfigService } from '../../../../core/config/multer-config.service';


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
    private readonly multerConfigService: MulterConfigService,
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
  ) {
    const user = req.user;
    const isHQ = user.role === Role.HQ_ADMIN || user.role === Role.SUPER_ADMIN;
    // USER / BRANCH_ADMIN: ເຫັນສະເພາະເອກະສານຕົນເອງ
    const userId = isHQ ? undefined : user.userId;

    const params = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      documentTypeId: documentTypeId ? parseInt(documentTypeId) : undefined,
      startDate,
      endDate,
      search,
      folderId,
      userId,
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
  async getDocumentById(@Param('id') id: string) {
    const document = await this.getDocumentByIdUseCase.execute(id);
    return {
      message: 'Success',
      data: document,
    };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────────
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: require('multer').memoryStorage(),
    limits: { fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 52428800), files: Number(process.env.UPLOAD_MAX_FILES ?? 10) },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      const allowed = (process.env.UPLOAD_ALLOWED_MIME_TYPES ?? 'image/jpeg,image/png,image/gif,image/webp,application/pdf').split(',').map((t) => t.trim());
      if (!allowed.includes(file.mimetype)) return cb(new BadRequestException(`ປະເພດໄຟລ໌ "${file.mimetype}" ບໍ່ໄດ້ຮັບອະນຸຍາດ`), false);
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
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: require('multer').memoryStorage(),
    limits: { fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 52428800), files: Number(process.env.UPLOAD_MAX_FILES ?? 10) },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      const allowed = (process.env.UPLOAD_ALLOWED_MIME_TYPES ?? 'image/jpeg,image/png,image/gif,image/webp,application/pdf').split(',').map((t) => t.trim());
      if (!allowed.includes(file.mimetype)) return cb(new BadRequestException(`ປະເພດໄຟລ໌ "${file.mimetype}" ບໍ່ໄດ້ຮັບອະນຸຍາດ`), false);
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
    limits: { fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 52428800), files: 1 },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      const allowed = (process.env.UPLOAD_ALLOWED_MIME_TYPES ?? 'image/jpeg,image/png,image/gif,image/webp,application/pdf').split(',').map((t) => t.trim());
      if (!allowed.includes(file.mimetype)) return cb(new BadRequestException(`ປະເພດໄຟລ໌ "${file.mimetype}" ບໍ່ໄດ້ຮັບອະນຸຍາດ`), false);
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
}
