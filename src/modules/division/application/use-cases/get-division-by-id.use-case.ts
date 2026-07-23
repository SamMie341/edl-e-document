import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as divisionRepositoryInterface from '../../domain/repositories/division.repository.interface';
import { Division } from '../../domain/entities/division.entity';

@Injectable()
export class GetDivisionByIdUseCase {
  constructor(
    @Inject(divisionRepositoryInterface.DIVISION_REPOSITORY)
    private readonly divisionRepository: divisionRepositoryInterface.IDivisionRepository,
  ) { }

  async execute(id: number): Promise<Division> {
    const division = await this.divisionRepository.findById(id);
    if (!division) {
      throw new NotFoundException('ບໍ່ພົບພະແນກນີ້ໃນລະບົບ');
    }
    return division;
  }
}
