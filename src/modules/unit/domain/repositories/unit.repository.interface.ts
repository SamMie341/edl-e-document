import { Unit } from '../entities/unit.entity';

export const UNIT_REPOSITORY = Symbol('UNIT_REPOSITORY');

export interface IUnitRepository {
  findAll(): Promise<Unit[]>;
}
