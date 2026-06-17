import { Locker } from '../entities/locker.entity';

export const LOCKER_REPOSITORY = Symbol('LOCKER_REPOSITORY');

export interface LockerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  addressId?: string;
  status?: string;
}

export interface ILockerRepository {
  create(data: any): Promise<Locker>;
  findAll(
    params: LockerFilterParams,
  ): Promise<{ data: Locker[]; total: number }>;
  findById(id: string): Promise<Locker | null>;
  update(id: string, data: any): Promise<Locker>;
  delete(id: string): Promise<void>;
}
