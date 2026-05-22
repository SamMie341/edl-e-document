import { Inject, Injectable } from "@nestjs/common";
import * as addressRepositoriesInterface from "../../domain/repositories/address.repositories.interface";

@Injectable()
export class DeleteAddressUseCase {
    constructor(
        @Inject(addressRepositoriesInterface.ADDRESS_REPOSITORY)
        private readonly addressRepository: addressRepositoriesInterface.IAddressRepository,
    ) { }

    async execute(id: string): Promise<void> {
        await this.addressRepository.delete(id);
    }
}
