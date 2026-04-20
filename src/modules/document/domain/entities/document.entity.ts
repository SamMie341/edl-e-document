import { DocumentStatus } from '../value-objects/document-status.enum';

export class Document {
    constructor(
        public readonly id: string, // ใช้ string (UUID)
        public title: string,
        public content: string,
        public status: DocumentStatus,
        public readonly creatorId: string,
        public readonly branchId: string,
        public readonly folderId: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    // ---------------------------------------------------------
    // Business Behaviors (กฎของธุรกิจ)
    // ---------------------------------------------------------

    // การส่งเอกสารเพื่อขออนุมัติ
    submitForApproval(): void {
        if (this.status !== DocumentStatus.DRAFT) {
            throw new Error('สามารถส่งขออนุมัติได้เฉพาะเอกสารที่มีสถานะ DRAFT เท่านั้น');
        }
        this.status = DocumentStatus.PENDING;
        this.markAsUpdated();
    }

    // การอนุมัติเอกสาร
    approve(): void {
        if (this.status !== DocumentStatus.PENDING) {
            throw new Error('สามารถอนุมัติได้เฉพาะเอกสารที่รอการตรวจสอบ (PENDING) เท่านั้น');
        }
        this.status = DocumentStatus.APPROVED;
        this.markAsUpdated();
    }

    // การปฏิเสธเอกสาร
    reject(): void {
        if (this.status !== DocumentStatus.PENDING) {
            throw new Error('สามารถปฏิเสธได้เฉพาะเอกสารที่รอการตรวจสอบ (PENDING) เท่านั้น');
        }
        this.status = DocumentStatus.REJECTED;
        this.markAsUpdated();
    }

    private markAsUpdated(): void {
        this.updatedAt = new Date();
    }
}