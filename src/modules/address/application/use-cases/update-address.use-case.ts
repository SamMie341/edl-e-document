import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import * as addressRepositoriesInterface from "../../domain/repositories/address.repositories.interface";
import { UpdateAddressDto } from "../dtos/update-address.dto";

@Injectable()
export class UpdateAddressUseCase {
    constructor(
        @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
        private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
    ) { }

    async execute(id: string, dto: UpdateAddressDto) {
        if (dto.branchId === 2 && dto.divisionId === undefined) {
            throw new BadRequestException('ກະລຸນາລະບຸສາຂາແຂວງ');
        }
        return await this.addressRepository.update(id, dto);
    }
}
