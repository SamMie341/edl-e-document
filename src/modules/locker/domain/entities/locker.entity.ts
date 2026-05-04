export class Locker {
    constructor(
        public readonly id: string,
        public name: string | null,
        public description: string | null,
        public status: string,
        public branchId: number | null,
        public departmentId: number | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }
}