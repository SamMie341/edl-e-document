import { Inject, Injectable } from '@nestjs/common';
import * as addressRepositoriesInterface from '../../domain/repositories/address.repositories.interface';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class GetAddressDropdownUseCase {
  constructor(
    @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
    private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
  ) {}

  async execute(userRole: string, userDivisionId?: number) {
    let filterDivisionId: number | undefined = undefined;
    if (userRole !== Role.HQ_ADMIN) {
      filterDivisionId = userDivisionId || -1;
    }

    return this.addressRepository.getDropdown(filterDivisionId);
  }
}
