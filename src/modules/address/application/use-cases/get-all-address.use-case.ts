import { Inject, Injectable } from '@nestjs/common';
import * as addressRepositoriesInterface from '../../domain/repositories/address.repositories.interface';

@Injectable()
export class GetAllAddressUseCase {
  constructor(
    @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
    private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
  ) { }

  async execute(params: addressRepositoriesInterface.AddressFilterParams) {
    const { data, total } = await this.addressRepository.findAll(params);
    return {
      data,
      meta: {
        total,
        page: params.page || 1,
        limit: params.limit || 10,

        totalPages: Math.ceil(total / (params.limit || 10)),
      },
    };
  }
}
