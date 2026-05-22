import { Warehouse } from "../entities/warehouse.entity";

export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');

export interface WarehouseFilterParams {
    page?: number;
    limit?: number;
    search?: string;
    branchId?: number;
    status?: string;
}

export interface IWarehouseRepository {
    create(data: any): Promise<Warehouse>;
    findAll(params: WarehouseFilterParams): Promise<{ data: Warehouse[]; total: number }>;
    findByBranchId(branchId: number): Promise<Warehouse[]>;
    update(id: string, data: any): Promise<Warehouse>;
    delete(id: string): Promise<void>;
}