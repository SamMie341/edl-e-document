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
  ) { }
}
