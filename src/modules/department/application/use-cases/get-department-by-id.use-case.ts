import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';
import { Department } from '../../domain/entities/department.entity';

@Injectable()
export class GetDepartmentByIdUseCase {
  constructor(
    @Inject(departmentRepositoryInterface.DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
  ) { }

  async execute(id: number): Promise<Department> {
    const department = await this.departmentRepository.findById(id);
    if (!department) {
      throw new NotFoundException('ບໍ່ພົບຝ່າຍນີ້ໃນລະບົບ');
    }
    return department;
  }
}
