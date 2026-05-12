export class Folder {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public status: string,
        public qrCode: string,
        public locationRef: string | null,
        public shelfId: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}