import { Module } from "@nestjs/common";
import { LockerController } from "./presentation/controllers/locker.controller";
import { CreateLockerUseCase } from "./application/use-cases/create-locker.use-case";
import { GetAllLockersUseCase } from "./application/use-cases/get-all-lockers.use-case";
import { LOCKER_REPOSITORY } from "./domain/repositories/locker.repository.interface";
import { PrismaLockerRepository } from "./infrastructure/repositories/prisma-locker.repository";

@Module({
    controllers: [LockerController],
    providers: [
        CreateLockerUseCase,
        GetAllLockersUseCase,
        {
            provide: LOCKER_REPOSITORY,
            useClass: PrismaLockerRepository,
        }
    ],
    exports: [LOCKER_REPOSITORY],
})
export class LockerModule { }