import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';
import { DocumentEntity } from '../../domain/entities/document.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { Role } from 'src/core/auth/constants/role.enum';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { CleanupEmptyFoldersUseCase } from 'src/modules/shelf/application/use-cases/cleanup-empty-folders.use-case';

@Injectable()
export class DeleteDocumentUseCase {
  private readonly logger = new Logger(DeleteDocumentUseCase.name);

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
    id: string,
    approvalFile: Express.Multer.File,
    user: any,
    dto?: { destroyedDate?: string; details?: string; reason?: string },
  ): Promise<DocumentEntity> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new NotFoundException('ບໍ່ພົບເອກະສານໃນລະບົບ');
    }

    // ເຊັກເອກະສານຕິດພັນກັບສັນຍາ
    if (document.isContractBound) {
      throw new BadRequestException('ບໍ່ສາມາດລົບ/ທຳລາຍເອກະສານທີ່ຕິດພັນກັບສັນຍາໄດ້');
    }

    // Scope check ຕາມ Role
    if (user.role === Role.BRANCH_ADMIN) {
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      const allowedDivisionIds = userDivs.map((ud) => ud.divisionId);
      if (!document.divisionId || !allowedDivisionIds.includes(document.divisionId)) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບເອກະສານນີ້');
      }
    } else if (user.role === Role.USER) {
      const primaryDiv = await this.prisma.userDivisionModel.findFirst({
        where: { userId: user.userId, isPrimary: true },
        select: { divisionId: true },
      });
      if (!document.divisionId || !primaryDiv || document.divisionId !== primaryDiv.divisionId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບເອກະສານນີ້');
      }
    }

    // 1. Upload/Save the approval file
    const savedFile = await this.fileStorageService.uploadAndCompress({
      buffer: approvalFile.buffer,
      originalname: approvalFile.originalname,
      mimetype: approvalFile.mimetype,
      size: approvalFile.size,
    });

    // 2. Delete attachment files and set destruction approval path
    const updatedDocument = await this.documentRepository.deleteDocument(id, savedFile.filePath);

    const destructionDate = dto?.destroyedDate || '';
    const destructionDetails = dto?.details || dto?.reason || '';

    const logDetails = [
      `ທຳລາຍ/ລຶບເອກະສານ ID ${id}`,
      destructionDate ? `ວັນທີທຳລາຍ: ${destructionDate}` : null,
      destructionDetails ? `ລາຍລະອຽດ: ${destructionDetails}` : null,
      `ໄຟລ໌ອະນຸມັດ: ${savedFile.filePath}`,
    ]
      .filter(Boolean)
      .join(' | ');

    this.logger.log(`ລົບໄຟລ໌ເອກະສານ ID ${id} ສຳເລັດ (${logDetails})`);

    await this.auditService.log({
      action: AuditAction.DELETED,
      details: logDetails,
      entityId: id,
      entityType: 'DOCUMENT',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId || document.departmentId,
      divisionId: user?.divisionId || document.divisionId,
      oldValue: { title: document.title, docNo: document.docNo },
      payload: {
        destroyedDate: destructionDate || null,
        details: destructionDetails || null,
        approvalFilePath: savedFile.filePath,
      },
    });

    // Check and remove the folder from shelf if it no longer has active documents
    if (document.folderId) {
      await this.cleanupEmptyFoldersUseCase.cleanupFolderIfEmpty(document.folderId, user);
    }

    return updatedDocument;
  }
}
