

export class Address {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public details: string,
    public status: string,
    public departmentId: number,
    public divisionId: number,
  ) { }
}

export class Warehouse {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public description: string | null,
    public status: string,
    public addressId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public address?: Address | null,
  ) { }
}
