import { Inject, Injectable } from '@nestjs/common';
import * as divisionRepositoryInterface from '../../domain/repositories/division.repository.interface';

@Injectable()
export class DeleteDivisionUseCase {
  constructor(
    @Inject(divisionRepositoryInterface.DIVISION_REPOSITORY)
    private readonly divisionRepository: divisionRepositoryInterface.IDivisionRepository,
  ) { }

  async execute(id: number): Promise<void> {
    await this.divisionRepository.delete(id);
  }
}
