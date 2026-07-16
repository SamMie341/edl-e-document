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
        departmentId?: number;
        divisionId?: number;
        search?: string;
    }): Promise<{ data: Folder[]; total: number }> {
        const { skip, take, shelfId, departmentId, divisionId, search } = params || {};

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

        if (departmentId || divisionId) {
            const warehouseFilter: any = {};
            if (departmentId) warehouseFilter.departmentId = departmentId;
            if (divisionId) warehouseFilter.divisionId = divisionId;
            where.shelf = {
                is: { locker: { is: { warehouse: { is: warehouseFilter } } } },
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
                                            department: true,
                                            division: true,
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
        // ─── ดึง shelf เพื่อตรวจสอบความสัมพันธ์และตู้ Locker ────────────────
        const shelf = await this.prisma.shelfModel.findUnique({
            where: { id: data.shelfId },
            include: {
                locker: {
                    include: {
                        warehouse: {
                            include: {
                                department: true,
                                division: true,
                            },
                        },
                    },
                },
            },
        });

        if (!shelf) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງໃນລະບົບ');

        let code = data.code?.trim();

        if (!code) {
            // Auto generate folder code using the last 2 digits of the year (YY.NNN format), scoped per locker
            const currentYear = new Date().getFullYear();
            const yearSuffix = String(currentYear).slice(-2); // e.g. "26"

            // ค้นหาโฟลเดอร์ล่าสุดในตู้ Locker เดียวกันที่ขึ้นต้นด้วย YY.
            const lastFolder = await this.prisma.folderModel.findFirst({
                where: {
                    shelf: { lockerId: shelf.lockerId },
                    code: { startsWith: `${yearSuffix}.` },
                },
                orderBy: { createdAt: 'desc' },
            });

            let nextSeq = 1;
            if (lastFolder && lastFolder.code) {
                const parts = lastFolder.code.split('.');
                if (parts.length === 2) {
                    const seqNum = parseInt(parts[1], 10);
                    if (!isNaN(seqNum)) {
                        nextSeq = seqNum + 1;
                    }
                }
            }

            // Ensure uniqueness inside the same locker
            let isUnique = false;
            let attemptSeq = nextSeq;
            while (!isUnique) {
                const codeToCheck = `${yearSuffix}.${String(attemptSeq).padStart(3, '0')}`;
                const existing = await this.prisma.folderModel.findFirst({
                    where: {
                        shelf: { lockerId: shelf.lockerId },
                        code: codeToCheck,
                    },
                });
                if (!existing) {
                    code = codeToCheck;
                    isUnique = true;
                } else {
                    attemptSeq++;
                }
            }
        } else {
            // Check duplicate if manually supplied (scoped to the same locker)
            const existing = await this.prisma.folderModel.findFirst({
                where: {
                    shelf: { lockerId: shelf.lockerId },
                    code,
                },
            });
            if (existing) {
                throw new ConflictException(`ລະຫັດໂກໂນ '${code}' ຖືກໃຊ້ງານແລ້ວໃນຕູ້ Locker ນີ້`);
            }
        }

        const deptCode = shelf.locker.warehouse?.department?.code ?? '';
        const divCode = shelf.locker.warehouse?.division?.shortName ?? '';
        const prefix = deptCode || divCode || 'LOC';
        const locationRef = `${prefix}/${shelf.locker?.warehouse?.code ?? ''}/${shelf.locker?.code ?? ''}`;
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
                                        department: true,
                                        division: true,
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
            const shelfId = data.shelfId || existing.shelfId;
            const shelf = await this.prisma.shelfModel.findUnique({
                where: { id: shelfId },
            });
            if (shelf) {
                const codeExists = await this.prisma.folderModel.findFirst({
                    where: {
                        shelf: { lockerId: shelf.lockerId },
                        code: data.code,
                        NOT: { id },
                    },
                });
                if (codeExists) {
                    throw new ConflictException(`ລະຫັດໂກໂນ '${data.code}' ຖືກໃຊ້ງານແລ້ວໃນຕູ້ Locker ນີ້`);
                }
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
