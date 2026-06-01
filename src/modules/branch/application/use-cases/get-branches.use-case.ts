import { Inject, Injectable } from '@nestjs/common';
import * as branchRepositoryInterface from '../../domain/repositories/branch.repository.interface';
import { Branch } from '../../domain/entities/branch.entity';

@Injectable()
export class GetBranchesUseCase {
  constructor(
    @Inject(branchRepositoryInterface.BRANCH_REPOSITORY)
    private readonly branchRepository: branchRepositoryInterface.IBranchRepository,
  ) {}

  async execute(): Promise<Branch[]> {
    return this.branchRepository.findAll();
  }
}
