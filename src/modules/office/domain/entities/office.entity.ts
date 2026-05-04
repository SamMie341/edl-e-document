export class Office {
    constructor(
        public readonly id: number,
        public readonly code: string,
        public readonly name: string,
        public readonly status: string,
        public readonly divisionId: number,
    ) { }
}