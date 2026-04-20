import { Controller, Post, Body, UseGuards, Param, Req, Put, UseInterceptors, UploadedFile, BadRequestException, Res, StreamableFile, Get, Query } from '@nestjs/common';
import { CreateDocumentUseCase } from '../../application/use-cases/create-document.use-case';
import { CreateDocumentDto } from '../../application/dtos/create-document.dto';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/auth/guards/roles.guard';
import { Roles } from '../../../../core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { ApproveDocumentUseCase } from 'src/modules/document/application/use-cases/approve-document.use-case';
import { SubmitDocumentUseCase } from '../../application/use-cases/submit-document.use-case';
import { RejectDocumentUseCase } from '../../application/use-cases/reject-document.use-case';
import { RejectDocumentDto } from '../../application/dtos/reject-document.dto';
import { UploadAttachmentUseCase } from '../../application/use-cases/upload-attachment.use-case';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetAttachmentUseCase } from '../../application/use-cases/get-attachment.use-case';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { GetAllDocumentUseCase } from '../../application/use-cases/get-all-document.use-case';
import { SearchDocumentsUseCase } from '../../application/use-cases/search-documents.use-case';
import { SearchDocumentDto } from '../../application/dtos/search-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
    constructor(
        private readonly createDocumentUseCase: CreateDocumentUseCase,
        private readonly submitDocumentUseCase: SubmitDocumentUseCase,
        private readonly approveDocumentUseCase: ApproveDocumentUseCase,
        private readonly rejectDocumentUseCase: RejectDocumentUseCase,
        private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
        private readonly getAttachmentUseCase: GetAttachmentUseCase,
        // private readonly getAllDocumentUseCase: GetAllDocumentUseCase,
        private readonly searchDocumentUseCase: SearchDocumentsUseCase
    ) { }

    @Get()
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN, Role.USER)
    async searchDocuments(
        @Query() query: SearchDocumentDto,
        @Req() req: any
    ) {
        const result = await this.searchDocumentUseCase.execute(query, req.user);

        return {
            message: 'Success',
            data: result.data,
            meta: result.meta,
        };
    }

    // @Get()
    // @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN, Role.USER)
    // async findAll() {
    //     await this.getAllDocumentUseCase.execute();
    // }

    @Post()
    @Roles(Role.USER, Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async createDocument(@Body() dto: CreateDocumentDto, @Req() req: any) {

        const document = await this.createDocumentUseCase.execute(dto, req.user.userId);

        return {
            message: 'ສ້າງເອກະສຳເລັດ',
            data: document,
        };
    }

    @Put(':id/submit')
    @Roles(Role.USER, Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async submitDocument(@Param('id') id: string, @Req() req: any) {

        await this.submitDocumentUseCase.execute(id, req.user.userId);

        return { message: 'ສົ່ງເອກະສານເພື່ອຂໍອະນຸມັດຮຽບຮ້ອຍແລ້ວ' };
    }

    @Post(':id/approve')
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN)
    async approveDocument(@Param('id') id: string, @Req() req: any) {

        await this.approveDocumentUseCase.execute(id, req.user);

        return { message: 'ອະນຸມັດເອກະສານສຳເລັດ' };
    }

    @Put(':id/reject')
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN)
    async rejectDocument(
        @Param('id') id: string,
        @Body() dto: RejectDocumentDto,
        @Req() req: any,
    ) {

        await this.rejectDocumentUseCase.execute(id, dto, req.user);

        return { message: 'ປະຕິເສດເອກະສານສຳເລັດ' };
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