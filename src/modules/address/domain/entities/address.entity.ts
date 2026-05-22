export class Address {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public details: string,
        public status: string,
        public branchId: number | null,
        public divisionId: number | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public division?: {
            id: number;
            code: string;
            name: string;
            shortName: string;
            status: string;
            branchId: number | null;
        } | null,
    ) { }
}