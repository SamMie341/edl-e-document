import { Injectable } from '@nestjs/common';
import { IBranchRepository } from '../../domain/repositories/branch.repository.interface';
import { Branch } from '../../domain/entities/branch.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { BranchMapper } from '../mappers/branch.mapper';

@Injectable()
export class PrismaBranchRepositoy implements IBranchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Branch[]> {
    const models = await this.prisma.branchModel.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return models.map(BranchMapper.toDomain);
  }

  async findById(id: number): Promise<Branch | null> {
    const model = await this.prisma.branchModel.findUnique({ where: { id } });
    if (!model) return null;
    return BranchMapper.toDomain(model);
  }
}
