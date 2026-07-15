import { Department } from '../entities/department.entity';

export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');

export interface IDepartmentRepository {
  findAll(): Promise<Department[]>;
  findById(id: number): Promise<Department | null>;
  findAllExternal(): Promise<Department[]>;
}
