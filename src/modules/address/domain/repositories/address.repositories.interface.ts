import { Address } from '../entities/address.entity';

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');

export interface AddressFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: number;
  divisionId?: number;
  status?: string;
}

export interface IAddressRepository {
  create(data: any): Promise<Address>;
  findByBranchId(branchId: number): Promise<Address[]>;
  findByDivisionId(divisionId: number): Promise<Address[]>;
  findAll(
    params: AddressFilterParams,
  ): Promise<{ data: Address[]; total: number }>;
  getDropdown(
    divisionId?: number,
  ): Promise<{ id: string; name: string; divisionId: number | null }[]>;
  update(id: string, data: any): Promise<Address>;
  delete(id: string): Promise<void>;
}
