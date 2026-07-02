import { DocumentRetentionStatus } from '../value-objects/document-retention-status.enum';

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

export class Address {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public details: string,
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
        public subDocNo: string | null,
        public subDocDate: Date | null,
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
        public isContractBound?: boolean, // ຕິດພັນກັບສັນຍາ
        public department?: Department | null,
        public division?: Division | null,
        public user?: User | null,
        public address?: Address | null,
        public warehouse?: Warehouse | null,
        public locker?: Locker | null,
        public shelf?: Shelf | null,
        public folder?: Folder | null,
        public documentType?: DocumentType | null,
        public attachments?: Attachment | null,

    ) { }

    /**
     * ຄຳນວນສະຖານະການທຳລາຍເອກະສານຕາມອາຍຸ 10 ປີ ໂດຍຄິດໄລ່ຈາກ docDate
     * - ACTIVE           : ອາຍຸເອກະສານຕ່ຳກວ່າ 10 ປີ (ທຳລາຍບໍ່ໄດ້)
     * - DESTROYABLE      : ອາຍຸເອກະສານຄົບ 10 ປີພໍດີ ແລະ ບໍ່ຕິດພັນສັນຍາ (ສາມາດທຳລາຍໄດ້)
     * - DESTROYABLE_HOLD : ຕິດພັນກັບສັນຍາ (ທຳລາຍບໍ່ໄດ້)
     * - EXPIRED          : ອາຍຸເອກະສານເກີນ 10 ປີຂຶ້ນໄປ (ທຳລາຍຖິ້ມໄດ້)
     */
    get retentionStatus(): DocumentRetentionStatus {
        if (this.isContractBound) {
            return DocumentRetentionStatus.DESTROYABLE_HOLD;
        }

        const now = new Date();
        const docDate = new Date(this.docDate);

        // ຄິດໄລ່ອາຍຸເປັນປີ (Age in years)
        let ageInYears = now.getFullYear() - docDate.getFullYear();
        const monthDiff = now.getMonth() - docDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < docDate.getDate())) {
            ageInYears--;
        }

        if (ageInYears < 10) {
            return DocumentRetentionStatus.ACTIVE;
        }

        if (ageInYears === 10) {
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
