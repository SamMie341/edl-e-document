import { Locker } from "../entities/locker.entity";

export const LOCKER_REPOSITORY = Symbol('LOCKER_REPOSITORY');

export interface ILockerRepository {
    create(data: any): Promise<Locker>;
    findAll(skip?: number, take?: number): Promise<{ data: Locker[], total: number }>;
    findByWarehouseId(warehouseId: string): Promise<Locker[]>;
}