import { Locker } from "../entities/locker.entity";

export const LOCKER_REPOSITORY = Symbol('LOCKER_REPOSITORY');

export interface LockerFilterParams {
    page?: number;
    limit?: number;
    search?: string;
    warehouseId?: string;
    branchId?: number;
    divisionId?: number;
    status?: string;
}

export interface ILockerRepository {
    create(data: any): Promise<Locker>;
    findAll(params: LockerFilterParams): Promise<{ data: Locker[]; total: number }>;
    findByWarehouseId(warehouseId: string): Promise<Locker[]>;
    update(id: string, data: any): Promise<Locker>;
    delete(id: string): Promise<void>;
}