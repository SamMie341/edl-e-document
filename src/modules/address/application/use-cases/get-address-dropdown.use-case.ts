import { Inject, Injectable } from '@nestjs/common';
import * as addressRepositoriesInterface from '../../domain/repositories/address.repositories.interface';

@Injectable()
export class GetAddressDropdownUseCase {
  constructor(
    @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
    private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
  ) {}

  async execute(filters?: { departmentId?: number; divisionId?: number; userId?: string }) {
    return await this.addressRepository.getDropdown(filters);
  }
}
