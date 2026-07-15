export class SubDocumentEntity {
    constructor(
        public readonly id: string,
        public documentId: string,
        public subDocNo: string,
        public subDocDate: Date,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}
