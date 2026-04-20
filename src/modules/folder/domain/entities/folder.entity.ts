export class Folder {
    constructor(
        public readonly id: string,
        public name: string,
        public description: string | null,
        public readonly branchId: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    rename(newName: string, newDescription?: string): void {
        this.name = newName;
        if (newDescription !== undefined) {
            this.description = newDescription;
        }
        this.updatedAt = new Date();
    }
}