import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { Role } from 'src/core/auth/constants/role.enum';

export interface CleanupFolderResult {
  deletedCount: number;
  deletedFolders: Array<{ id: string; code: string; name: string; shelfId: string }>;
  message: string;
}

@Injectable()
export class CleanupEmptyFoldersUseCase {
  private readonly logger = new Logger(CleanupEmptyFoldersUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  /**
   * Execute cleanup for all shelves or a specific shelf.
   * Finds folders where active document count (destructionApprovalPath == null) is 0 and deletes them.
   */
  async execute(shelfId?: string, user?: any): Promise<CleanupFolderResult> {
    const whereCondition: any = {};

    if (shelfId) {
      whereCondition.shelfId = shelfId;
    }

    if (user?.role === Role.BRANCH_ADMIN && user.departmentId) {
      whereCondition.shelf = {
        locker: {
          warehouse: {
            departmentId: user.departmentId,
          },
        },
      };
    } else if (user?.role === Role.USER && user.divisionId) {
      whereCondition.shelf = {
        locker: {
          warehouse: {
            divisionId: user.divisionId,
          },
        },
      };
    }

    const folders = await this.prisma.folderModel.findMany({
      where: whereCondition,
      include: {
        shelf: true,
      },
    });

    const deletedFolders: Array<{ id: string; code: string; name: string; shelfId: string }> = [];

    for (const folder of folders) {
      const isDeleted = await this.cleanupFolderIfEmpty(folder.id, user, folder);
      if (isDeleted) {
        deletedFolders.push({
          id: folder.id,
          code: folder.code,
          name: folder.name,
          shelfId: folder.shelfId,
        });
      }
    }

    const message = deletedFolders.length > 0
      ? `ລຶບແຟ້ມເອກະສານທີ່ບໍ່ມີເອກະສານສຳເລັດ ${deletedFolders.length} ແຟ້ມ`
      : 'ບໍ່ມີແຟ້ມເອກະສານທີ່ຕ້ອງລຶບ';

    this.logger.log(`Cleanup completed: ${deletedFolders.length} folders removed.`);

    return {
      deletedCount: deletedFolders.length,
      deletedFolders,
      message,
    };
  }

  /**
   * Checks if a single folder has 0 active documents, and if so, deletes it from its shelf.
   */
  async cleanupFolderIfEmpty(folderId: string, user?: any, folderData?: any): Promise<boolean> {
    if (!folderId) return false;

    const folder = folderData || await this.prisma.folderModel.findUnique({
      where: { id: folderId },
    });

    if (!folder) return false;

    // Count active documents (where destructionApprovalPath is null)
    const activeDocsCount = await this.prisma.documentModel.count({
      where: {
        folderId: folder.id,
        destructionApprovalPath: null,
      },
    });

    if (activeDocsCount > 0) {
      return false; // Still contains active documents
    }

    // Unlink destroyed documents & document borrows to maintain DB referential integrity
    await this.prisma.$transaction([
      this.prisma.documentModel.updateMany({
        where: { folderId: folder.id },
        data: { folderId: null },
      }),
      this.prisma.documentBorrowModel.updateMany({
        where: { folderId: folder.id },
        data: { folderId: null },
      }),
      this.prisma.folderModel.delete({
        where: { id: folder.id },
      }),
    ]);

    this.logger.log(`Folder '${folder.name || folder.code}' (ID: ${folder.id}) has 0 active documents and was deleted from shelf ${folder.shelfId}.`);

    if (user) {
      try {
        await this.auditService.log({
          action: AuditAction.DELETED,
          details: `ລຶບແຟ້ມເອກະສານທີ່ບໍ່ມີເອກະສານອອກຈາກຊັ້ນວາງອັດຕະໂນມັດ: ${folder.name || folder.code}`,
          entityId: folder.id,
          entityType: 'FOLDER',
          actorId: user?.userId || user?.id,
          departmentId: user?.departmentId,
          divisionId: user?.divisionId,
          oldValue: folder,
        });
      } catch (err) {
        this.logger.warn(`Audit log failed for folder deletion ${folder.id}: ${err.message}`);
      }
    }

    return true;
  }
}
