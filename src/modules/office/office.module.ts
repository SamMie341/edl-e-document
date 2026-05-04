import { Module } from "@nestjs/common";
import { SyncOfficesUseCase } from "./application/use-cases/sync-offices.use-case";
import { OFFICE_REPOSITORY } from "./domain/repositories/office.repository.interface";
import { HrmOfficeRepository } from "./infrastructure/repositories/hrm-office.repository";
import { OfficeController } from "./presentation/controller/office.controller";
import { GetOfficesUseCase } from "./application/use-cases/get-offices.use-case";

@Module({
    imports: [],
    controllers: [OfficeController],
    providers: [
        SyncOfficesUseCase,
        GetOfficesUseCase,
        {
            provide: OFFICE_REPOSITORY,
            useClass: HrmOfficeRepository,
        }
    ],
    exports: [OFFICE_REPOSITORY, SyncOfficesUseCase]
})
export class OfficeModule { }