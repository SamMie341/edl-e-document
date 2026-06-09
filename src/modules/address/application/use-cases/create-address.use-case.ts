import { Inject, Injectable } from '@nestjs/common';
import * as addressRepositoriesInterface from '../../domain/repositories/address.repositories.interface';
import { CreateAddressDto } from '../dtos/create-address.dto';

@Injectable()
export class CreateAddressUseCase {
  constructor(
    @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
    private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
  ) {}

  async execute(dto: CreateAddressDto) {
    return await this.addressRepository.create(dto);
  }
}
