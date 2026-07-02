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
  findAll(
    params: LockerFilterParams,
  ): Promise<{ data: Locker[]; total: number }>;
  findById(id: string): Promise<Locker | null>;
  create(data: any): Promise<Locker>;
  update(id: string, data: any): Promise<Locker>;
  delete(id: string): Promise<void>;
  getDropdown(params?: {
    warehouseId?: string;
    addressId?: string;
    status?: string;
  }): Promise<any[]>;
}
