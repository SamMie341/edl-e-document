import { Inject, Injectable } from '@nestjs/common';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';

@Injectable()
export class DeleteDepartmentUseCase {
  constructor(
    @Inject(departmentRepositoryInterface.DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
  ) { }

  async execute(id: number): Promise<void> {
    await this.departmentRepository.delete(id);
  }
}
