import { Warehouse } from '../entities/warehouse.entity';

export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export interface WarehouseFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  addressId?: string;
  departmentId?: number;
  divisionId?: number;
}

export interface IWarehouseRepository {
  create(data: any): Promise<Warehouse>;
  findAll(
    params: WarehouseFilterParams,
  ): Promise<{ data: Warehouse[]; total: number }>;
  findById(id: string): Promise<Warehouse | null>;
  getDropdown(filters?: { addressId?: string; departmentId?: number; divisionId?: number }): Promise<{ id: string; name: string }[]>;
  update(id: string, data: any): Promise<Warehouse>;
  delete(id: string): Promise<void>;
}
