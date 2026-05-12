import { Injectable } from "@nestjs/common";
import { IAddressRepository } from "../../domain/repositories/address.repositories.interface";
import { Address } from "../../domain/entities/address.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { AddressMapper } from "../mappers/address.mapper";

@Injectable()
export class PrismaAddressRepositoy implements IAddressRepository {

    constructor(private readonly prisma: PrismaService) { }

    async create(data: any): Promise<Address> {
        const model = await this.prisma.addressModel.create({ data });
        return AddressMapper.toDomain(model);
    }

    async findByBranchId(branchId: number): Promise<Address[]> {
        const models = await this.prisma.addressModel.findMany({
            where: { branchId, status: 'A' },
            include: { division: true },
        });
        return models.map(AddressMapper.toDomain);
    }

    async findByDivisionId(divisionId: number): Promise<Address[]> {
        const models = await this.prisma.addressModel.findMany({
            where: { divisionId, status: 'A' }
        });
        return models.map(AddressMapper.toDomain);
    }

}