import { Warehouse } from '../../../warehouse/domain/entities/warehouse.entity';

export class Locker {
  constructor(
    public readonly id: string,
    public code: string,
    public name: string | null,
    public description: string | null,
    public status: string,
    public warehouseId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public shelvesCount?: number,
    public shelves?: { id: string; name: string }[],
    public warehouse?: Warehouse | null,

  ) { }
}