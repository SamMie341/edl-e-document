import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';
import { DocumentEntity } from '../../domain/entities/document.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { Role } from 'src/core/auth/constants/role.enum';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { CleanupEmptyFoldersUseCase } from 'src/modules/shelf/application/use-cases/cleanup-empty-folders.use-case';
import { DeleteBatchDocumentsDto } from '../dtos/delete-document.dto';

@Injectable()
export class DeleteBatchDocumentsUseCase {
  private readonly logger = new Logger(DeleteBatchDocumentsUseCase.name);

  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
    @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
    private readonly fileStorageService: fileStorageInterface.IFileStorageService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cleanupEmptyFoldersUseCase: CleanupEmptyFoldersUseCase,
  ) { }

  async execute(
    dto: DeleteBatchDocumentsDto,
    approvalFile: Express.Multer.File,
    user: any,
  ): Promise<{ count: number; documents: DocumentEntity[]; message: string }> {
    // 1. Parse IDs from DTO (supports array, JSON string, or comma-separated string)
    let parsedIds: string[] = [];
    if (Array.isArray(dto.ids)) {
      parsedIds = dto.ids;
    } else if (typeof dto.ids === 'string') {
      try {
        const jsonParsed = JSON.parse(dto.ids);
        if (Array.isArray(jsonParsed)) {
          parsedIds = jsonParsed;
        } else {
          parsedIds = dto.ids.split(',').map((s) => s.trim());
        }
      } catch {
        parsedIds = dto.ids.split(',').map((s) => s.trim());
      }
    }

    parsedIds = Array.from(new Set(parsedIds.filter((id) => Boolean(id && id.trim()))));

    if (parsedIds.length === 0) {
      throw new BadRequestException('ກະລຸນາລະບຸ ID ເອກະສານທີ່ຕ້ອງການລົບ');
    }

    // 2. Validate all target documents exist & verify role/scope permissions
    const docs = await this.prisma.documentModel.findMany({
      where: { id: { in: parsedIds } },
    });

    if (docs.length === 0) {
      throw new NotFoundException('ບໍ່ພົບເອກະສານທີ່ເລືອກໃນລະບົບ');
    }

    // Check contract bound documents
    const contractBoundDocs = docs.filter((d) => d.isContractBound);
    if (contractBoundDocs.length > 0) {
      const boundTitles = contractBoundDocs.map((d) => d.docNo || d.title).join(', ');
      throw new BadRequestException(`ບໍ່ສາມາດລົບເອກະສານທີ່ຕິດພັນກັບສັນຍາໄດ້: ${boundTitles}`);
    }

    // Check Role scope
    if (user.role === Role.BRANCH_ADMIN) {
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      const allowedDivisionIds = userDivs.map((ud) => ud.divisionId);

      const unauthorizedDocs = docs.filter(
        (d) => !d.divisionId || !allowedDivisionIds.includes(d.divisionId),
      );
      if (unauthorizedDocs.length > 0) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບເອກະສານບາງລາຍການທີ່ເລືອກ');
      }
    } else if (user.role === Role.USER) {
      const primaryDiv = await this.prisma.userDivisionModel.findFirst({
        where: { userId: user.userId, isPrimary: true },
        select: { divisionId: true },
      });
      const unauthorizedDocs = docs.filter(
        (d) => !d.divisionId || !primaryDiv || d.divisionId !== primaryDiv.divisionId,
      );
      if (unauthorizedDocs.length > 0) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບເອກະສານບາງລາຍການທີ່ເລືອກ');
      }
    }

    // 3. Upload & save approval file
    const savedFile = await this.fileStorageService.uploadAndCompress({
      buffer: approvalFile.buffer,
      originalname: approvalFile.originalname,
      mimetype: approvalFile.mimetype,
      size: approvalFile.size,
    });

    const validIdsToDestroy = docs.map((d) => d.id);

    // 4. Perform batch destruction
    const updatedDocuments = await this.documentRepository.deleteDocuments(
      validIdsToDestroy,
      savedFile.filePath,
    );

    const destructionDate = dto?.destroyedDate || '';
    const destructionDetails = dto?.details || dto?.reason || '';

    // 5. Audit log for each document
    for (const doc of docs) {
      const logDetails = [
        `ທຳລາຍ/ລຶບເອກະສານ ID ${doc.id} (Batch)`,
        destructionDate ? `ວັນທີທຳລາຍ: ${destructionDate}` : null,
        destructionDetails ? `ລາຍລະອຽດ: ${destructionDetails}` : null,
        `ໄຟລ໌ອະນຸມັດ: ${savedFile.filePath}`,
      ]
        .filter(Boolean)
        .join(' | ');

      await this.auditService.log({
        action: AuditAction.DELETED,
        details: logDetails,
        entityId: doc.id,
        entityType: 'DOCUMENT',
        actorId: user?.userId || user?.id,
        departmentId: user?.departmentId || doc.departmentId,
        divisionId: user?.divisionId || doc.divisionId,
        oldValue: { title: doc.title, docNo: doc.docNo },
        payload: {
          destroyedDate: destructionDate || null,
          details: destructionDetails || null,
          approvalFilePath: savedFile.filePath,
        },
      });
    }

    // 6. Automatically cleanup folders that no longer have active documents
    const affectedFolderIds = Array.from(
      new Set(docs.map((d) => d.folderId).filter((fid): fid is string => Boolean(fid))),
    );

    for (const fid of affectedFolderIds) {
      await this.cleanupEmptyFoldersUseCase.cleanupFolderIfEmpty(fid, user);
    }

    const message = `ລຶບເອກະສານທີ່ເລືອກສຳເລັດ ${updatedDocuments.length} ລາຍການ`;
    this.logger.log(message);

    return {
      count: updatedDocuments.length,
      documents: updatedDocuments,
      message,
    };
  }
}
