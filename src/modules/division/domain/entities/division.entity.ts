export class Division {
    constructor(
        public readonly id: number,
        public readonly code: string,
        public readonly name: string,
        public readonly shortName: string | null,
        public readonly status: string,
        public readonly departmentId: number | null,
        public readonly hrmBranchId: number | null,
        public readonly branchData: any | null,
    ) { }
}