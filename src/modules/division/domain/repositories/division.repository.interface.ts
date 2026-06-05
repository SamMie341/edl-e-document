import { Division } from '../entities/division.entity';

export const DIVISION_REPOSITORY = Symbol('DIVISION_REPOSITORY');

export interface IDivisionRepository {
  findAll(): Promise<Division[]>;
}
