import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UpdateDocumentDto } from '../dtos/update-document.dto';
import { DocumentEntity } from '../../domain/entities/document.entity';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { Role } from 'src/core/auth/constants/role.enum';
import { AuditLog } from 'src/modules/audit/domain/entities/audit-log.entity';
import * as auditLogRepositoryInterface from 'src/modules/audit/domain/repositories/audit-log.repository.interface';
import { AuditAction } from 'src/core/constants/audit-action.enum';

import { fixUtf8Object, fixUtf8String } from 'src/core/utils/utf8-fix.util';

@Injectable()
export class UpdateDocumentUseCase {
  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
    @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
    private readonly fileStorageService: fileStorageInterface.IFileStorageService,
    private readonly prisma: PrismaService,
    @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
  ) { }

  async execute(
    id: string,
    dto: UpdateDocumentDto,
    user: any,
    files?: Express.Multer.File[],
  ): Promise<DocumentEntity> {
    const fixedDto = fixUtf8Object(dto);

    // 1. Check if document exists, including the owner user info for RBAC checks
    const doc = await this.prisma.documentModel.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doc) {
      throw new NotFoundException('ບໍ່ພົບເອກະສານນີ້ໃນລະບົບ');
    }

    // 2. Perform Role-Based Access Control checks
    if (user.role === Role.USER || user.role === Role.BRANCH_ADMIN) {
      if (doc.userId !== user.userId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂເອກະສານນີ້');
      }
    }

    // 3. Handle file uploads if any files are supplied
    const attachmentsData: {
      fileName: string;
      filePath: string;
      mimeType: string;
      size: number;
    }[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const decodedOriginalName = fixUtf8String(file.originalname);
        const savedFile = await this.fileStorageService.uploadAndCompress({
          buffer: file.buffer,
          originalname: decodedOriginalName,
          mimetype: file.mimetype,
          size: file.size,
        });

        attachmentsData.push({
          fileName: savedFile.fileName,
          filePath: savedFile.filePath,
          mimeType: savedFile.mimeType,
          size: savedFile.size,
        });
      }
    }

    // 4. Build database update payload
    const dataToUpdate: any = {
      ...fixedDto,
    };

    if (attachmentsData.length > 0) {
      dataToUpdate.attachments = attachmentsData;
    }

    // Update qrCode if docNo changes and no new qrCode is provided
    if (fixedDto.docNo && !fixedDto.qrCode) {
      dataToUpdate.qrCode = fixedDto.docNo;
    }

    // 5. Update the document in database
    const updatedDoc = await this.documentRepository.update(id, dataToUpdate);

    // 6. Log the audit activity
    const log = new AuditLog(
      uuidv4(),
      'UPDATED', // Using custom action since UPDATED is not in the AuditAction enum
      `UPDATE BY ${user.userId}`,
      updatedDoc.id,
      'DOCUMENT',
      user.userId,
      new Date(),
    );

    await this.auditLogRepository.save(log);

    return updatedDoc;
  }
}
