export class Shelf {
    constructor(
        public readonly id: string,
        public code: string,
        public description: string | null,
        public status: string,
        public lockerId: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}