import { DocumentRetentionStatus } from '../value-objects/document-retention-status.enum';
import { SubDocumentEntity } from '../../../sub-document/domain/entities/sub-document.entity';

export class DocumentType {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public description: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}

export class Attachment {
    constructor(
        public readonly id: string,
        public fileName: string,
        public filePath: string,
        public mimeType: string,
        public size: number,
        public readonly createdAt: Date,
    ) { }
}

export class Folder {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public status: string,
        public qrCode: string,
        public locationRef: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}

export class Shelf {
    constructor(
        public readonly id: string,
        public name: string,
        public description: string,
        public status: string,
        public maxQty: number,
        public count: number,
        public remainingQty: number,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}

export class Locker {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public description: string,
        public status: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}

export class Warehouse {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public description: string,
        public status: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}


export class User {
    constructor(
        public readonly id: string,
        public role: string,
        public empCode: string,
        public firstNameLa: string,
        public lastNameLa: string,
        public phone: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public department?: Department | null,
        public division?: Division | null,
    ) { }
}

export class Department {
    constructor(
        public readonly id: number,
        public code: string,
        public name: string,
        public phone: string | null,
        public email: string | null,
        public status: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}

export class Division {
    constructor(
        public readonly id: number,
        public code: string,
        public name: string,
        public shortName: string,
        public status: string,
        public departmentId: number | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}

export class DocumentEntity {
    constructor(
        public readonly id: string,
        public docNo: string,
        public shortName: string | null,
        public docDate: Date,
        public title: string,
        public description: string,
        public docExpire: Date,
        public qrCode: string,
        public departmentId: number | null,
        public divisionId: number | null,
        public userId: string,
        public folderId: string | null,
        public documentTypeId: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public isContractBound?: boolean,
        public department?: Department | null,
        public division?: Division | null,
        public user?: User | null,
        public warehouse?: Warehouse | null,
        public locker?: Locker | null,
        public shelf?: Shelf | null,
        public folder?: Folder | null,
        public documentType?: DocumentType | null,
        public attachments?: Attachment[] | null,
        public subDocuments?: SubDocumentEntity[],
        public destructionApprovalPath?: string | null,
    ) { }

    /**
     * ຄຳນວນສະຖານະການທຳລາຍເອກະສານໂດຍອີງໃສ່ docExpire ທີ່ຜູ້ໃຊ້ກຳນົດ
     * - ACTIVE           : ຍັງບໍ່ຮອດກຳນົດໝົດອາຍຸ ( docExpire > ມື້ນີ້ )
     * - DESTROYABLE      : ຮອດກຳນົດໝົດອາຍຸມື້ນີ້ພໍດີ ( docExpire === ມື້ນີ້ ) ແລະ ບໍ່ຕິດພັນສັນຍາ
     * - DESTROYABLE_HOLD : ຕິດພັນກັບສັນຍາ (ທຳລາຍບໍ່ໄດ້)
     * - EXPIRED          : ກາຍກຳນົດໝົດອາຍຸແລ້ວ ( docExpire < ມື້ນີ້ ) ແລະ ບໍ່ຕິດພັນສັນຍາ
     */
    get retentionStatus(): DocumentRetentionStatus {
        if (this.isContractBound) {
            return DocumentRetentionStatus.DESTROYABLE_HOLD;
        }

        const now = new Date();
        const docExpire = new Date(this.docExpire);

        // ທຽບສະເພາະ ວັນ/ເດືອນ/ປີ (ບໍ່ຄິດໄລ່ເວລາ)
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const expireDate = new Date(docExpire.getFullYear(), docExpire.getMonth(), docExpire.getDate());

        if (expireDate > nowDate) {
            return DocumentRetentionStatus.ACTIVE;
        }

        if (expireDate.getTime() === nowDate.getTime()) {
            return DocumentRetentionStatus.DESTROYABLE;
        }

        return DocumentRetentionStatus.EXPIRED;
    }

    toJSON() {
        return {
            ...this,
            retentionStatus: this.retentionStatus,
        };
    }
}
