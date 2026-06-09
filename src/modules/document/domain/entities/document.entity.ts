import { DocumentRetentionStatus } from '../value-objects/document-retention-status.enum';

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
        public userId: string,
        public folderId: string | null,
        public documentTypeId: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public attachments: {
            id: string;
            fileName: string;
            filePath: string;
            mimeType: string;
            size: number;
            documentId: string;
            createdAt: Date;
        }[],
        public isContractBound?: boolean, // ຕິດພັນກັບສັນຍາ
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
