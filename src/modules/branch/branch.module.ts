import { Module } from "@nestjs/common";
import { BranchController } from "./presentation/controllers/branch.controller";
import { CreateBranchUseCase } from "./application/use-cases/create-branch.use-case";
import { GetBranchesUseCase } from "./application/use-cases/get-branches.use-case";
import { BRANCH_REPOSITORY } from "./domain/repositories/branch.repository.interface";
import { PrismaBranchRepositoy } from "./infrastructure/repositories/prisma-branch.repository";

@Module({
    controllers: [BranchController],
    providers: [
        CreateBranchUseCase,
        GetBranchesUseCase,
        {
            provide: BRANCH_REPOSITORY,
            useClass: PrismaBranchRepositoy,
        }
    ],
    exports: [BRANCH_REPOSITORY],
})
export class BranchModule { }