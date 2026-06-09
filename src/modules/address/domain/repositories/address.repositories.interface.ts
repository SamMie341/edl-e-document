import { Address } from '../entities/address.entity';

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');

export interface AddressFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface IAddressRepository {
  create(data: any): Promise<Address>;
  findAll(
    params: AddressFilterParams,
  ): Promise<{ data: Address[]; total: number }>;
  getDropdown(): Promise<{ id: string; name: string }[]>;
  update(id: string, data: any): Promise<Address>;
  delete(id: string): Promise<void>;
}
