import { Inject, Injectable } from '@nestjs/common';
import * as divisionRepositoryInterface from '../../domain/repositories/division.repository.interface';
import { CreateDivisionDto } from '../dtos/create-division.dto';
import { Division } from '../../domain/entities/division.entity';

@Injectable()
export class CreateDivisionUseCase {
  constructor(
    @Inject(divisionRepositoryInterface.DIVISION_REPOSITORY)
    private readonly divisionRepository: divisionRepositoryInterface.IDivisionRepository,
  ) { }

  async execute(dto: CreateDivisionDto): Promise<Division> {
    return await this.divisionRepository.create(dto);
  }
}
