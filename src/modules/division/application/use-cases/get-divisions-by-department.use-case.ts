import { Inject, Injectable } from '@nestjs/common';
import * as divisionRepositoryInterface from '../../domain/repositories/division.repository.interface';
import { Division } from '../../domain/entities/division.entity';

@Injectable()
export class GetDivisionsByDepartmentUseCase {
  constructor(
    @Inject(divisionRepositoryInterface.DIVISION_REPOSITORY)
    private readonly divisionRepository: divisionRepositoryInterface.IDivisionRepository,
  ) {}

  async execute(departmentId: number): Promise<Division[]> {
    return this.divisionRepository.findByDepartment(departmentId);
  }
}
