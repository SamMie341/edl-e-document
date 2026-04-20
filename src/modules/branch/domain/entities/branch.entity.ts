export class Branch {
    constructor(
        public readonly id: string,
        public name: string,
        public address: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    updateDetails(name: string, address?: string) {
        this.name = name;
        if (address !== undefined) {
            this.address = address;
        }
        this.updatedAt = new Date();
    }
}