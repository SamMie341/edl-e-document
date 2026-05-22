import { Module } from "@nestjs/common";
import { AddressController } from "./presentation/controllers/address.controller";
import { CreateAddressUseCase } from "./application/use-cases/create-address.use-case";
import { ADDRESS_REPOSITORY } from "./domain/repositories/address.repositories.interface";
import { PrismaAddressRepository } from "./infrastructure/repositories/prisma-address.repository";
import { GetAllAddressUseCase } from "./application/use-cases/get-all-address.use-case";
import { UpdateAddressUseCase } from "./application/use-cases/update-address.use-case";
import { DeleteAddressUseCase } from "./application/use-cases/delete-address.use-case";

@Module({
    controllers: [AddressController],
    providers: [
        CreateAddressUseCase,
        GetAllAddressUseCase,
        UpdateAddressUseCase,
        DeleteAddressUseCase,
        {
            provide: ADDRESS_REPOSITORY,
            useClass: PrismaAddressRepository,
        }
    ],
    exports: [ADDRESS_REPOSITORY]
})
export class AddressModule { }