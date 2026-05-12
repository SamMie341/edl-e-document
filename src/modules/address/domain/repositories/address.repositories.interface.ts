import { Address } from "../entities/address.entity";

export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');

export interface IAddressRepository {
    create(data: any): Promise<Address>;
    findByBranchId(branchId: number): Promise<Address[]>;
    findByDivisionId(divisionId: number): Promise<Address[]>;
}