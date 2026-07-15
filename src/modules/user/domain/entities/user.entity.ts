export class User {
  constructor(
    public readonly id: string,
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

    public departmentId: number | null,
    public officeId: number | null,
    public unitId: number | null,

    public readonly createdAt: Date,
    public updatedAt: Date,

    public departmentData?: any,
    public officeData?: any,
    public unitData?: any,
    public divisions?: { id: number; name: string; shortName: string; isPrimary: boolean }[],
  ) { }

  getPublicProfile() {
    return {
      id: this.id,
      empCode: this.empCode,
      firstNameLa: this.firstNameLa,
      lastNameLa: this.lastNameLa,
      email: this.email,
      role: this.role,
      gender: this.gender,
      status: this.status,
      department: this.departmentId || null,
      office: this.officeId || null,
      unit: this.unitId || null,
      departmentData: this.departmentData || null,
      divisions: this.divisions || [],
      officeData: this.officeData || null,
      unitData: this.unitData || null,
    };
  }

  hasRole(role: string): boolean {
    return this.role === role;
  }

  updateRole(newRole: string): void {
    this.role = newRole;
  }

  updatePassword(newPasswordHash: string): void {
    this.password = newPasswordHash;
    this.updatedAt = new Date();
  }
}
