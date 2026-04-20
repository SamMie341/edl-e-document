import { Role } from "src/core/auth/constants/role.enum";

export class User {
    constructor(
        public readonly id: string,
        public readonly username: string,
        public passwordHash: string,
        public role: Role,
        public branchId: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    getPublicProfile() {
        return {
            id: this.id,
            username: this.username,
            role: this.role,
            branchId: this.branchId,
        }
    }

    updatePassword(newPasswordHash: string): void {
        this.passwordHash = newPasswordHash;
        this.updatedAt = new Date();
    }
}