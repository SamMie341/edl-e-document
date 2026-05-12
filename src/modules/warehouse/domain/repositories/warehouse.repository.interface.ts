import { Warehouse } from "../entities/warehouse.entity";

export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export interface IWarehouseRepository {
    create(data: any): Promise<Warehouse>;
    findAll(skip?: number, take?: number): Promise<{ data: Warehouse[], total: number }>;
    findByBranchId(branchId: number): Promise<Warehouse[]>;
}