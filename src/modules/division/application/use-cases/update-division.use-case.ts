import { Inject, Injectable } from '@nestjs/common';
import * as divisionRepositoryInterface from '../../domain/repositories/division.repository.interface';
import { UpdateDivisionDto } from '../dtos/update-division.dto';
import { Division } from '../../domain/entities/division.entity';

@Injectable()
export class UpdateDivisionUseCase {
  constructor(
    @Inject(divisionRepositoryInterface.DIVISION_REPOSITORY)
    private readonly divisionRepository: divisionRepositoryInterface.IDivisionRepository,
  ) { }

  async execute(id: number, dto: UpdateDivisionDto): Promise<Division> {
    return await this.divisionRepository.update(id, dto);
  }
}
