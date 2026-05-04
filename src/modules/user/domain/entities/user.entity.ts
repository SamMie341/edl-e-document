
export class User {
    constructor(
        public readonly id: string,
        public username: string,
        public password: string,
        public role: string,

        public empId: number | null,
        public empCode: string | null,
        public firstNameLa: string | null,
        public lastNameLa: string | null,
        public firstNameEng: string | null,
        public lastNameEng: string | null,
        public email: string | null,
        public phone: string | null,
        public status: string | null,
        public gender: string | null,
        public image: string | null,

        public branchId: number | null,
        public departmentId: number | null,
        public divisionId: number | null,
        public officeId: number | null,
        public unitId: number | null,

        public readonly createdAt: Date,
        public updatedAt: Date,

        public branchData?: any,
        public departmentData?: any,
        public divisionData?: any,
        public officeData?: any,
        public unitData?: any,
    ) { }

    getPublicProfile() {
        return {
            id: this.id,
            empCode: this.empCode,
            firstNameLa: this.firstNameLa,
            lastNameLa: this.lastNameLa,
            role: this.role,
            gender: this.gender,
            status: this.status,
            branch: this.branchData || null,
            department: this.departmentData || null,
            division: this.divisionData || null,
            office: this.officeData || null,
            unit: this.unitData || null,
        }
    }

    updateRole(newRole: string): void {
        this.role = newRole;

    }

    updatePassword(newPasswordHash: string): void {
        this.password = newPasswordHash;
        this.updatedAt = new Date();
    }
}