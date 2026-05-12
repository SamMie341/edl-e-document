export class Warehouse {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public description: string | null,
        public status: string,
        public branchId: number,
        public addressId: string | null,
        // public departmentId: number | null,
        // public divisionId: number | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}