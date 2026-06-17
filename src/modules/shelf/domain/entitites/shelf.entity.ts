
export class Shelf {
  constructor(
    public readonly id: string,
    public name: string | null,
    public description: string | null,
    public status: string,
    public maxQty: number,
    public lockerId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public remainingQty?: number, // maxQty - ຈຳນວນ folder ທີ່ມີຢູ່ແລ້ວ
    public locker?: Locker | null,
  ) { }
}

export class Locker {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string,
    public description: string,
    public status: string,
    public warehouseId: string,
  ) { }
}