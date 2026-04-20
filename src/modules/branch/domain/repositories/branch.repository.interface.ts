import { Branch } from "../entities/branch.entity";

export const BRANCH_REPOSITORY = Symbol('BRANCH_REPOSITORY');

export interface IBranchRepository {
    findAll(): Promise<Branch[]>;
    findById(id: string): Promise<Branch | null>;
    save(branch: Branch): Promise<void>;
}