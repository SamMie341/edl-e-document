import { Inject, Injectable } from '@nestjs/common';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';
import { Department } from '../../domain/entities/department.entity';

@Injectable()
export class GetDepartmentsUseCase {
  constructor(
    @Inject(departmentRepositoryInterface.DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
  ) {}

  async execute(): Promise<Department[]> {
    const departments = await this.departmentRepository.findAll();
    // return departments.filter(dept => dept.status === 'A');
    return departments;
  }
}
