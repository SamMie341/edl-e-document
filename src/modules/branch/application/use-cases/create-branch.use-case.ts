import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import * as branchRepositoryInterface from "../../domain/repositories/branch.repository.interface";
import { CreateBranchDto } from "../dtos/create-branch.dto";
import { Branch } from "../../domain/entities/branch.entity";
import { Role } from "src/core/auth/constants/role.enum";
import { v4 as uuidv4 } from 'uuid';
import { AppException } from "src/core/exceptions/app.exception";

@Injectable()
export class CreateBranchUseCase {
    constructor(
        @Inject(branchRepositoryInterface.BRANCH_REPOSITORY)
        private readonly branchRepository: branchRepositoryInterface.IBranchRepository,
    ) { }

    // async execute(dto: CreateBranchDto, userRole: string): Promise<Branch> {
    // if (userRole !== Role.SUPER_ADMIN) {
    //     throw new AppException(
    //         'DO_NOT_CREATE_BRANCH',
    //         'ສະເພາະ Super Admin ເທົ່ານັ້ນທີ່ສາມາດເພີ່ມສາຂາໄດ້',
    //         '',
    //         HttpStatus.NOT_FOUND,
    //     );
    // }

    // const now = new Date();
    // const newBranch = new Branch(
    //     dto.code,
    //     dto.name,
    //     dto.status,
    //     now,
    //     now,
    // );
    // await this.branchRepository.save(newBranch);
    // return newBranch;
    // }
}