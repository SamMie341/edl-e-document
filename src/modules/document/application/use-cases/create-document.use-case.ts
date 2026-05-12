import { Injectable, Inject } from '@nestjs/common';
import { CreateDocumentDto } from '../dtos/create-document.dto';
import { DocumentEntity } from '../../domain/entities/document.entity';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';


@Injectable()
export class CreateDocumentUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
        @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
        private readonly fileStorageService: fileStorageInterface.IFileStorageService,
    ) { }

    async execute(dto: CreateDocumentDto, userId: string, files: Express.Multer.File[]) {
        const qrCode = dto.qrCode || dto.docNo;

        const attachmentsData: { fileName: string; filePath: string; mimeType: string; size: number }[] = [];

        if (files && files.length > 0) {
            for (const file of files) {
                const savedFile = await this.fileStorageService.uploadAndCompress({
                    buffer: file.buffer,
                    originalname: file.originalname,
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

        const dataToSave = {
            ...dto,
            userId,
            qrCode,
            attachments: attachmentsData
        };

        return await this.documentRepository.create(dataToSave);
    }
}