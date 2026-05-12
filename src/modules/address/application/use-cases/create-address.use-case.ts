import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import * as addressRepositoriesInterface from "../../domain/repositories/address.repositories.interface";
import { CreateAddressDto } from "../dtos/create-address.dto";

@Injectable()
export class CreateAddressUseCase {
    constructor(
        @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
        private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
    ) { }

    async execute(dto: CreateAddressDto) {
        if (dto.branchId !== 1 && !dto.divisionId) {
            throw new BadRequestException('ກະລຸນາລະບຸສາຂາ');
        }
        // if (dto.divisionId) {
        //     throw new NotFoundException('ບໍ່ພົບສາຂານີ້');
        // }
        return await this.addressRepository.create(dto);
    }
}