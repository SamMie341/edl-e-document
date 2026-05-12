import { Module } from "@nestjs/common";
import { AddressController } from "./presentation/controllers/address.controller";
import { CreateAddressUseCase } from "./application/use-cases/create-address.use-case";
import { GetAddressUseCase } from "./application/use-cases/get-address.use-case";
import { ADDRESS_REPOSITORY } from "./domain/repositories/address.repositories.interface";
import { PrismaAddressRepositoy } from "./infrastructure/repositories/prisma-address.repository";

@Module({
    controllers: [AddressController],
    providers: [
        CreateAddressUseCase,
        GetAddressUseCase,
        {
            provide: ADDRESS_REPOSITORY,
            useClass: PrismaAddressRepositoy,
        }
    ],
    exports: [ADDRESS_REPOSITORY]
})
export class AddressModule { }