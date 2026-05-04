import { Shelf } from "../entitites/shelf.entity";

export const SHELF_REPOSITORY = Symbol('SHELF_REPOSITORY');

export interface IShelfRepository {
    create(data: any): Promise<Shelf>;
    findByLockerId(lockerId: string): Promise<Shelf[]>;
}