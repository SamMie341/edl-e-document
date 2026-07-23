import { Inject, Injectable } from '@nestjs/common';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';
import { UpdateDepartmentDto } from '../dtos/update-department.dto';
import { Department } from '../../domain/entities/department.entity';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    @Inject(departmentRepositoryInterface.DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
  ) { }

  async execute(id: number, dto: UpdateDepartmentDto): Promise<Department> {
    return await this.departmentRepository.update(id, dto);
  }
}
