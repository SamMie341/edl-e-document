import { Controller, Post, Body, UseGuards, Param, Req, Put, UseInterceptors, UploadedFile, BadRequestException, Res, StreamableFile, Get, Query, UploadedFiles } from '@nestjs/common';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { CreateDocumentDto } from '../../application/dtos/create-document.dto';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/auth/guards/roles.guard';
import { Roles } from '../../../../core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { RejectDocumentDto } from '../../application/dtos/reject-document.dto';
import { UploadAttachmentUseCase } from '../../application/use-cases/upload-attachment.use-case';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GetAttachmentUseCase } from '../../application/use-cases/get-attachment.use-case';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { GetAllDocumentUseCase } from '../../application/use-cases/get-all-document.use-case';
// import { SearchDocumentsUseCase } from '../../application/use-cases/search-documents.use-case';
import { SearchDocumentDto } from '../../application/dtos/search-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
    constructor(
        private readonly createDocumentUseCase: CreateDocumentUseCase,
        private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
        private readonly getAttachmentUseCase: GetAttachmentUseCase,
        private readonly getAllDocumentUseCase: GetAllDocumentUseCase,
    ) { }


    @Get()
    // @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN, Role.USER)
    async getAllDocument(
        @Req() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('status') status?: string,
        @Query('documentTypeId') documentTypeId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
        @Query('branchId') requestedBranchId?: string,
    ) {
        const user = req.user;
        let finalBranchId: number | undefined = undefined;
        if (user.role === Role.SUPER_ADMIN || user.role === Role.HQ_ADMIN) {
            finalBranchId = requestedBranchId ? parseInt(requestedBranchId) : undefined;
        } else {
            finalBranchId = user.branchId;
        }
        const params = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            status,
            documentTypeId: documentTypeId ? parseInt(documentTypeId) : undefined,
            startDate,
            endDate,
            search,
            branchId: finalBranchId,
        };
        const result = await this.getAllDocumentUseCase.execute(params);
        return {
            message: 'Success',
            ...result,
        };
    }

    @Post()
    @UseInterceptors(FilesInterceptor('files', 10))
    @Roles(Role.USER, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async create(
        @Req() req: any,
        @Body() dto: CreateDocumentDto,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        const userId = req.user.userId;
        const document = await this.createDocumentUseCase.execute(dto, userId, files);
        return {
            message: 'ສ້າງເອກະສຳເລັດ',
            data: document,
        };
    }

    @Post(':id/attachments')
    @Roles(Role.USER, Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    async uploadAttachment(
        @Param('id') documentId: string,
        @UploadedFile() file: any,
        @Req() req: any
    ) {
        if (!file) {
            throw new BadRequestException('ກະລຸນາແນບໄຟລ໌ມາດ້ວຍ');
        }

        const attachment = await this.uploadAttachmentUseCase.execute(documentId, file, req.userId);

        return {
            message: 'ອັບໂຫຼດ ແລະ ບີບອັດໄຟລ໌ສຳເລັດ',
            data: attachment,
        };
    }

    @Post('attachments/:attachmentId')
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN, Role.USER)
    async getAttachment(
        @Param('attachmentId') attachmentId: string,
        @Req() req: any,
        @Res({ passthrough: true }) res: Response
    ): Promise<StreamableFile> {
        const attachment = await this.getAttachmentUseCase.execute(attachmentId, req.user);

        const fileStream = createReadStream(attachment.filePath);

        res.set({
            'Content-Type': attachment.mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`
        });
        return new StreamableFile(fileStream);
    }
}