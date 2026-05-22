import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { AddressFilterParams, IAddressRepository } from "../../domain/repositories/address.repositories.interface";
import { Address } from "../../domain/entities/address.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { AddressMapper } from "../mappers/address.mapper";

@Injectable()
export class PrismaAddressRepository implements IAddressRepository {

    constructor(private readonly prisma: PrismaService) { }

    async create(data: any): Promise<Address> {
        const existing = await this.prisma.addressModel.findUnique({
            where: { code: data.code }
        });
        if (existing) {
            throw new ConflictException('ລະຫັດສະຖານທີ່ນີ້ຖືກໃຊ້ງານແລ້ວ');
        }
        const model = await this.prisma.addressModel.create({ data });
        return AddressMapper.toDomain(model);
    }

    async findByBranchId(branchId: number): Promise<Address[]> {
        // branchId = 2: ດຶງ address ຜ່ານ division ທີ່ຂຶ້ນກັບ branch ນັ້ນ
        if (branchId === 2) {
            const models = await this.prisma.addressModel.findMany({
                where: {
                    status: 'A',
                    division: {
                        branchId: branchId,
                    },
                },
            });
            return models.map(AddressMapper.toDomain);
        }

        // branchId อื่น: ดึงตาม branchId ปกติ
        const models = await this.prisma.addressModel.findMany({
            where: { branchId, status: 'A' },
        });
        return models.map(AddressMapper.toDomain);
    }

    async findByDivisionId(divisionId: number): Promise<Address[]> {
        const models = await this.prisma.addressModel.findMany({
            where: { divisionId, status: 'A' }
        });
        return models.map(AddressMapper.toDomain);
    }

    async findAll(params: AddressFilterParams): Promise<{ data: Address[]; total: number }> {
        const { page = 1, limit = 10, search, branchId, divisionId, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (status) where.status = status;
        if (branchId) where.branchId = branchId;
        if (divisionId) where.divisionId = divisionId;
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { details: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [models, total] = await Promise.all([
            this.prisma.addressModel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.addressModel.count({ where }),
        ]);

        return { data: models.map(AddressMapper.toDomain), total };
    }

    async update(id: string, data: any): Promise<Address> {
        const existing = await this.prisma.addressModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບສະຖານທີ່ນີ້ໃນລະບົບ');
        }
        const model = await this.prisma.addressModel.update({
            where: { id },
            data,
        });
        return AddressMapper.toDomain(model);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.addressModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບສະຖານທີ່ນີ້ໃນລະບົບ');
        }
        await this.prisma.addressModel.delete({ where: { id } });
    }

}