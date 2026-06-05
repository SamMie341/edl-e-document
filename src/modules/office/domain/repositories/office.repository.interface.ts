import { Office } from '../entities/office.entity';

export const OFFICE_REPOSITORY = Symbol('OFFICE_REPOSITORY');

export interface IOfficeRepository {
  findAll(): Promise<Office[]>;
}
