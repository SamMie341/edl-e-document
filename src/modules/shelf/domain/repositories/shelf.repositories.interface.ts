import { Shelf } from "../entitites/shelf.entity";

export const SHELF_REPOSITORY = Symbol('SHELF_REPOSITORY');

export interface ShelfFilterParams {
    page?: number;
    limit?: number;
    search?: string;
    lockerId?: string;
    warehouseId?: string;
    branchId?: number;
    divisionId?: number;
    status?: string;
}

export interface IShelfRepository {
    create(data: any): Promise<Shelf>;
    findAll(params: ShelfFilterParams): Promise<{ data: Shelf[], total: number }>;
    findByLockerId(lockerId: string): Promise<Shelf[]>;
    update(id: string, data: any): Promise<Shelf>;
    delete(id: string): Promise<void>;
}