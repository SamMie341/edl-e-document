import { Injectable, Inject } from '@nestjs/common';
import { CreateDocumentDto } from '../dtos/create-document.dto';
import { DocumentEntity } from '../../domain/entities/document.entity';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';
import { PrismaService } from 'src/core/database/prisma.service';

import { fixUtf8Object, fixUtf8String } from 'src/core/utils/utf8-fix.util';

@Injectable()
export class CreateDocumentUseCase {
  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
    @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
    private readonly fileStorageService: fileStorageInterface.IFileStorageService,
    private readonly prisma: PrismaService,
  ) { }

  async execute(
    dto: CreateDocumentDto,
    userId: string,
    files: Express.Multer.File[],
  ) {
    const fixedDto = fixUtf8Object(dto);
    const generatedId = fixedDto.id || uuidv4();
    const qrCode = generatedId;

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

    // ─── Fetch creator's department and primary division ────────────────────
    const creator = await this.prisma.userModel.findUnique({
      where: { id: userId },
      select: {
        departmentId: true,
        userDivisions: {
          where: { isPrimary: true },
          select: { divisionId: true },
          take: 1,
        },
      },
    });
    const primaryDivisionId = creator?.userDivisions?.[0]?.divisionId ?? null;

    const { subDocuments, ...documentDto } = fixedDto;

    const dataToSave = {
      ...documentDto,
      id: generatedId,
      userId,
      qrCode,
      departmentId: fixedDto.departmentId ?? creator?.departmentId ?? null,
      divisionId: fixedDto.divisionId ?? primaryDivisionId ?? null,
      attachments: attachmentsData,
      subDocuments: subDocuments && subDocuments.length > 0
        ? { create: subDocuments }
        : undefined,
    };

    return await this.documentRepository.create(dataToSave);
  }
}
