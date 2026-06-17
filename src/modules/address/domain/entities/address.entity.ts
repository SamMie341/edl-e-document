export class Address {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public details: string,
    public status: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public departmentId?: number | null,
    public divisionId?: number | null,
    public departmentData?: any,
    public divisionData?: any,
  ) {}
}
