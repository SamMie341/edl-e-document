import { Division } from '../entities/division.entity';

export const DIVISION_REPOSITORY = Symbol('DIVISION_REPOSITORY');

export interface IDivisionRepository {
  findAll(): Promise<Division[]>;
  findByDepartment(departmentId: number): Promise<Division[]>;
  findAllExternal(): Promise<Division[]>;
  findById(id: number): Promise<Division | null>;
  create(data: any): Promise<Division>;
  update(id: number, data: any): Promise<Division>;
  delete(id: number): Promise<void>;
}
