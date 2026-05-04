export class Unit {
    constructor(
        public readonly id: number,
        public readonly code: string,
        public readonly name: string,
        public readonly type: string,
        public readonly status: string,
        public readonly divisionId: number,
        public readonly officeId: number,
    ) { }
}