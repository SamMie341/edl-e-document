import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';
import { Folder } from '../../domain/entities/folder.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { FolderMapper } from '../mappers/folder.mapper';

@Injectable()
export class PrismaFolderRepository implements IFolderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params?: {
        skip?: number;
        take?: number;
        shelfId?: string;
        addressId?: string;
        search?: string;
    }): Promise<{ data: Folder[]; total: number }> {
        const { skip, take, shelfId, addressId, search } = params || {};

        const where: any = {};
        if (shelfId) where.shelfId = shelfId;

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { locationRef: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (addressId) {
            where.shelf = {
                is: { locker: { is: { warehouse: { is: { addressId } } } } },
            };
        }

        const [models, total] = await this.prisma.$transaction([
            this.prisma.folderModel.findMany({
                where,
                skip,
                take,
                orderBy: { code: 'asc' },
                include: {
                    shelf: {
                        include: {
                            locker: {
                                include: {
                                    warehouse: {
                                        include: {
                                            address: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _count: { select: { documents: true } }
                },
            }),
            this.prisma.folderModel.count({ where }),
        ]);
        return { data: models.map(FolderMapper.toDomain), total };
    }

    async create(data: any): Promise<Folder> {
        let code = data.code?.trim();

        if (!code) {
            // Auto generate folder code (starts at '0001' and increments)
            let newCode = '0001';
            const lastFolder = await this.prisma.folderModel.findFirst({
                where: { code: { startsWith: '' } },
                orderBy: { createdAt: 'desc' },
            });

            if (lastFolder && lastFolder.code) {
                const match = lastFolder.code.match(/(\d+)/);
                if (match && match[1]) {
                    const nextNumber = parseInt(match[1], 10) + 1;
                    newCode = `${String(nextNumber).padStart(4, '0')}`;
                }
            }

            // Ensure uniqueness
            let isUnique = false;
            let attemptNumber = parseInt(newCode, 10) || 1;
            while (!isUnique) {
                const codeToCheck = `${String(attemptNumber).padStart(4, '0')}`;
                const existing = await this.prisma.folderModel.findUnique({
                    where: { code: codeToCheck },
                });
                if (!existing) {
                    code = codeToCheck;
                    isUnique = true;
                } else {
                    attemptNumber++;
                }
            }
        } else {
            // Check duplicate if manually supplied
            const existing = await this.prisma.folderModel.findUnique({
                where: { code },
            });
            if (existing) {
                throw new ConflictException(`ລະຫັດໂກໂນ '${code}' ຖືກໃຊ້ງານແລ້ວ`);
            }
        }

        // ─── ดึง shelf เพื่อสร้าง locationRef ───────────────────────────────
        const shelf = await this.prisma.shelfModel.findUnique({
            where: { id: data.shelfId },
            include: {
                locker: {
                    include: { warehouse: { include: { address: true } } }
                },
            },
        });

        if (!shelf) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງໃນລະບົບ');

        const locationRef = `${shelf.locker.warehouse?.address?.code ?? ''}/${shelf.locker?.warehouse?.code ?? ''}/${shelf.locker?.code ?? ''}`;
        const qrCode = data.qrCode?.trim() || `${locationRef}`;

        const model = await this.prisma.folderModel.create({
            data: {
                ...data,
                code,
                locationRef,
                qrCode,
            },
        });
        return FolderMapper.toDomain(model);
    }

    async findById(id: string): Promise<Folder> {
        const model = await this.prisma.folderModel.findUnique({
            where: { id },
            include: {
                shelf: {
                    include: {
                        locker: {
                            include: {
                                warehouse: {
                                    include: {
                                        address: {
                                            include: {
                                                division: {
                                                    include: {
                                                        department: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                documents: true,
                _count: { select: { documents: true } },
            },
        });
        if (!model) throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        return FolderMapper.toDomain(model);
    }

    async update(id: string, data: any): Promise<Folder> {
        const existing = await this.prisma.folderModel.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        }

        // ตรวจ code ซ้ำ (ถ้าเปลี่ยน code)
        if (data.code && data.code !== existing.code) {
            const codeExists = await this.prisma.folderModel.findUnique({
                where: { code: data.code },
            });
            if (codeExists) {
                throw new ConflictException(`ລະຫັດໂກໂນ '${data.code}' ຖືກໃຊ້ງານແລ້ວ`);
            }
        }

        if (data.shelfId) {
            const shelf = await this.prisma.shelfModel.findUnique({
                where: { id: data.shelfId },
            });
            if (!shelf) {
                throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງໃນລະບົບ');
            }
        }

        const model = await this.prisma.folderModel.update({ where: { id }, data });
        return FolderMapper.toDomain(model);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.folderModel.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        }

        const documentsCount = await this.prisma.documentModel.count({
            where: { folderId: id },
        });
        if (documentsCount > 0) {
            throw new ConflictException(
                'ບໍ່ສາມາດລົບແຟ້ມເອກະສານນີ້ໄດ້ ເພາະຍັງມີເອກະສານຢູ່ພາຍໃນ. ກະລຸນາຍ້າຍ ຫຼື ລົບເອກະສານທັງໝົດກ່ອນ.',
            );
        }

        await this.prisma.folderModel.delete({ where: { id } });
    }
}
