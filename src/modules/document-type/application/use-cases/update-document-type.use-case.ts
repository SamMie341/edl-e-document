import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { UpdateDocumentTypeDto } from '../dtos/update-document-type.dto';

@Injectable()
export class UpdateDocumentTypeUseCase {
    constructor(
        @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
        private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    ) { }

    async execute(id: string, dto: UpdateDocumentTypeDto): Promise<DocumentType> {
        const documentType = await this.documentTypeRepository.findById(id);
        if (!documentType) {
            throw new AppException(
                'DOCUMENT_TYPE_NOT_FOUND',
                `ບໍ່ພົບປະເພດເອກະສານ`,
                {},
                HttpStatus.NOT_FOUND,
            );
        }

        // ກວດສອບຊື່ຊ້ຳ ຖ້າມີການປ່ຽນຊື່
        if (dto.name && dto.name !== documentType.name) {
            const existing = await this.documentTypeRepository.findByName(dto.name);
            if (existing) {
                throw new AppException(
                    'DOCUMENT_TYPE_ALREADY_EXISTS',
                    `ປະເພດເອກະສານ "${dto.name}" ມີຢູ່ແລ້ວ`,
                    {},
                    HttpStatus.CONFLICT,
                );
            }
        }

        return await this.documentTypeRepository.update(id, dto);
    }
}
