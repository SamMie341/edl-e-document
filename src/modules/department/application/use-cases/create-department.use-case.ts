import { Inject, Injectable } from '@nestjs/common';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';
import { CreateDepartmentDto } from '../dtos/create-department.dto';
import { Department } from '../../domain/entities/department.entity';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    @Inject(departmentRepositoryInterface.DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: departmentRepositoryInterface.IDepartmentRepository,
  ) { }

  async execute(dto: CreateDepartmentDto): Promise<Department> {
    return await this.departmentRepository.create(dto);
  }
}
