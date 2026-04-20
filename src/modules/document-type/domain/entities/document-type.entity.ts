export class DocumentType {
    constructor(
        public readonly id: string,
        public name: string,
        public description: string | null,
        public isActive: boolean,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    update(name: string, description?: string | null, isActive?: boolean) {
        this.name = name;
        if (description !== undefined) {
            this.description = description ?? null;
        }
        if (isActive !== undefined) {
            this.isActive = isActive;
        }
        this.updatedAt = new Date();
    }

    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }
}
