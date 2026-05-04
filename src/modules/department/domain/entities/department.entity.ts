export class Department {
    constructor(
        public readonly id: number,
        public readonly code: string,
        public readonly name: string,
        public readonly phone: string,
        public readonly email: string,
        public readonly status: string,
    ) { }
}