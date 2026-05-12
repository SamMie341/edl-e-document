import { DocStatus } from 'src/core/constants/document-status.enum';
import { DocumentStatus } from '../value-objects/document-status.enum';

export class DocumentEntity {
    constructor(
        public readonly id: string,
        public docNo: string,
        public docDate: Date,
        public subDocNo: string | null,
        public subDocDate: Date | null,
        public title: string,
        public description: string,
        public status: string,
        public docExpire: Date,
        public qrCode: string,
        public userId: string,
        public folderId: string | null,
        public documentTypeId: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public attachments?: any[],
    ) { }
}