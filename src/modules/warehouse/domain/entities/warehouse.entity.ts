export class Division {
    constructor(
        public readonly id: number,
        public code: string,
        public name: string,
        public shortName: string,
        public status: string,
    ) { }
}

export class Address {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public details: string,
        public status: string,
    ) { }
}

export class Warehouse {
    constructor(
        public readonly id: string,
        public code: string,
        public name: string,
        public description: string | null,
        public status: string,
        public branchId: number,
        public divisionId: number | null,
        public addressId: string | null,
        // public departmentId: number | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public division?: Division | null,
        public address?: Address | null,
    ) { }
}