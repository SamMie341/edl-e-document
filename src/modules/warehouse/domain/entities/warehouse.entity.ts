

export class Department {
  constructor(
    public readonly id: number,
    public code: string,
    public name: string,
  ) { }
}

export class Division {
  constructor(
    public readonly id: number,
    public code: string,
    public name: string,
    public shortName: string,
  ) { }
}

export class Locker {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string | null,
    public description: string | null,
  ) { }
}

export class Warehouse {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public description: string | null,
    public status: string,
    public departmentId: number | null,
    public divisionId: number | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public department?: Department | null,
    public division?: Division | null,
    public lockers?: Locker[] | null,
  ) { }
}
