import { Inject, Injectable } from "@nestjs/common";
import * as addressRepositoriesInterface from "../../domain/repositories/address.repositories.interface";

@Injectable()
export class GetAddressUseCase {
    constructor(
        @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
        private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
    ) { }

    async execute(branchId: number) {
        return await this.addressRepository.findByBranchId(branchId);
    }
}