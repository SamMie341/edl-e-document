import { Inject, Injectable } from '@nestjs/common';
import * as officeRepositoryInterface from '../../domain/repositories/office.repository.interface';
import { Office } from '../../domain/entities/office.entity';

@Injectable()
export class GetOfficesUseCase {
  constructor(
    @Inject(officeRepositoryInterface.OFFICE_REPOSITORY)
    private readonly officeRepository: officeRepositoryInterface.IOfficeRepository,
  ) {}

  async execute(): Promise<Office[]> {
    const offices = await this.officeRepository.findAll();
    return offices;
  }
}
