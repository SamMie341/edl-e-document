import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as addressRepositoriesInterface from '../../domain/repositories/address.repositories.interface';

@Injectable()
export class GetAddressByIdUseCase {
  constructor(
    @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
    private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
  ) {}

  async execute(id: string) {
    const address = await this.addressRepository.findById(id);
    if (!address) {
      throw new NotFoundException('ບໍ່ພົບສະຖານທີ່ນີ້ໃນລະບົບ');
    }
    return address;
  }
}
