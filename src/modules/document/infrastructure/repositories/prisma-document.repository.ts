import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
    DocumentFilterParams,
    IDocumentRepository,
} from '../../domain/repositories/document.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { DocumentEntity } from '../../domain/entities/document.entity';
import { DocumentMapper } from '../mappers/document.mapper';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: any): Promise<DocumentEntity> {
        // ─── ດຶງ primary divisionId ຂອງ user ເພື່ອເຊັກ docNo ຕາມ division ──────────
        const owner = await this.prisma.userModel.findUnique({
            where: { id: data.userId },
            select: {
                userDivisions: {
                    where: { isPrimary: true },
                    select: { divisionId: true },
                    take: 1,
                },
            },
        });
        const ownerPrimaryDivisionId = owner?.userDivisions?.[0]?.divisionId ?? undefined;

        // ─── ຄຳນວນຊ່ວງປີຈາກ docDate ──────────────────────────────────────────────────────────
        let docDateObj = data.docDate ? new Date(data.docDate) : new Date();
        if (isNaN(docDateObj.getTime())) {
            docDateObj = new Date();
        }
        const year = docDateObj.getFullYear();
        const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
        const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

        // ─── ເຊັກ docNo ຊ້ຳຕາມ division + ປີ ────────────────────────────────────────────────
        const existingDocNo = await this.prisma.documentModel.findFirst({
            where: {
                docNo: data.docNo,
                docDate: { gte: yearStart, lte: yearEnd },
                ...(ownerPrimaryDivisionId
                    ? { user: { userDivisions: { some: { divisionId: ownerPrimaryDivisionId, isPrimary: true } } } }
                    : {}),
            },
        });
        if (existingDocNo) {
            throw new ConflictException(
                `ເລກທີ່ເອກະສານ '${data.docNo}' ມີຢູ່ແລ້ວ (ປີ ${year})`,
            );
        }

        const { attachments, subDocuments, ...documentData } = data;

        const model = await this.prisma.documentModel.create({
            data: {
                ...documentData,
                attachments:
                    attachments && attachments.length > 0
                        ? { create: attachments }
                        : undefined,
                subDocuments: subDocuments
                    ? subDocuments
                    : undefined,
            },
            include: {
                attachments: true,
                folder: true,
                documentType: true,
                department: true,
                division: true,
                subDocuments: true,
            },
        });
        return DocumentMapper.toDomain(model);
    }

    async findAll(
        params: DocumentFilterParams,
    ): Promise<{ data: DocumentEntity[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            documentTypeId,
            startDate,
            endDate,
            search,
            folderId,
            userId,
            departmentId,
            divisionId,
            divisionIds,
            orUserId,
            retentionStatus,
            warehouseId,
            lockerId,
            shelfId,
            isDestroyed,
        } = params;
        const skip = (page - 1) * limit;
        const andConditions: any[] = [];

        if (isDestroyed !== undefined && isDestroyed !== null && isDestroyed !== '') {
            const isDest = isDestroyed === true || isDestroyed === 'true' || isDestroyed === '1';
            if (isDest) {
                andConditions.push({ destructionApprovalPath: { not: null } });
            } else {
                andConditions.push({ destructionApprovalPath: null });
            }
        }

        if (folderId) andConditions.push({ folderId });
        if (userId) andConditions.push({ userId });
        if (departmentId) andConditions.push({ departmentId });

        if (shelfId || lockerId || warehouseId) {
            const folderWhere: any = {};
            if (shelfId) {
                folderWhere.shelfId = shelfId;
            }
            if (lockerId || warehouseId) {
                const shelfWhere: any = {};
                if (lockerId) shelfWhere.lockerId = lockerId;
                if (warehouseId) {
                    shelfWhere.locker = { warehouseId };
                }
                folderWhere.shelf = shelfWhere;
            }
            andConditions.push({ folder: folderWhere });
        }

        if (orUserId) {
            const orAccessList: any[] = [{ userId: orUserId }];
            if (divisionIds && divisionIds.length > 0) {
                orAccessList.push({ divisionId: { in: divisionIds } });
            } else if (divisionId) {
                orAccessList.push({ divisionId });
            }
            andConditions.push({ OR: orAccessList });
        } else {
            if (divisionIds && divisionIds.length > 0) {
                andConditions.push({ divisionId: { in: divisionIds } });
            } else if (divisionId) {
                andConditions.push({ divisionId });
            }
        }

        if (documentTypeId) andConditions.push({ documentTypeId });
        if (startDate || endDate) {
            const docDateCond: any = {};
            if (startDate) {
                docDateCond.gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                docDateCond.lte = new Date(`${endDate}T23:59:59.999Z`);
            }
            andConditions.push({ docDate: docDateCond });
        }

        // ─── retentionStatus filter ───────────────────────────────────────────────
        if (retentionStatus) {
            const now = new Date();
            const todayStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                0,
                0,
                0,
                0,
            );
            const todayEnd = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                23,
                59,
                59,
                999,
            );

            let retentionDocExpire: any = {};

            switch (retentionStatus) {
                case 'ACTIVE':
                    retentionDocExpire = { gt: todayEnd };
                    andConditions.push({ isContractBound: false });
                    break;

                case 'DESTROYABLE':
                    retentionDocExpire = {
                        gte: todayStart,
                        lte: todayEnd,
                    };
                    andConditions.push({ isContractBound: false });
                    break;

                case 'DESTROYABLE_HOLD':
                    andConditions.push({ isContractBound: true });
                    break;

                case 'EXPIRED':
                    retentionDocExpire = { lt: todayStart };
                    andConditions.push({ isContractBound: false });
                    break;
            }

            if (Object.keys(retentionDocExpire).length > 0) {
                andConditions.push({ docExpire: retentionDocExpire });
            }
        }

        if (search) {
            andConditions.push({
                OR: [
                    { docNo: { contains: search, mode: 'insensitive' } },
                    {
                        subDocuments: {
                            some: {
                                subDocNo: { contains: search, mode: 'insensitive' },
                            },
                        },
                    },
                    { title: { contains: search, mode: 'insensitive' } },
                    { shortName: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { division: { name: { contains: search, mode: 'insensitive' } } },
                    { department: { name: { contains: search, mode: 'insensitive' } } },
                    { documentType: { name: { contains: search, mode: 'insensitive' } } },
                    { user: { firstNameLa: { contains: search, mode: 'insensitive' } } },
                    { user: { lastNameLa: { contains: search, mode: 'insensitive' } } },
                    { user: { firstNameEng: { contains: search, mode: 'insensitive' } } },
                    { user: { lastNameEng: { contains: search, mode: 'insensitive' } } },
                ],
            });
        }

        const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};
        const [models, total] = await this.prisma.$transaction([
            this.prisma.documentModel.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        include: {
                            // department: true,
                            userDivisions: {
                                where: { isPrimary: true },
                                include: { division: true },
                            },
                        },
                    },
                    department: true,
                    division: true,
                    documentType: true,
                    attachments: true,
                    folder: {
                        include: {
                            shelf: {
                                include: {
                                    _count: {
                                        select: { folders: true },
                                    },
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
                            },
                        },
                    },
                    subDocuments: { orderBy: { createdAt: 'asc' } },
                },
            }),
            this.prisma.documentModel.count({ where: whereCondition }),
        ]);
        return {
            data: models.map((model) => DocumentMapper.toDomain(model)),
            total,
        };
    }

    async findById(id: string): Promise<DocumentEntity | null> {
        const model = await this.prisma.documentModel.findUnique({
            where: { id },
            include: {
                attachments: true,
                documentType: true,
                user: {
                    include: {
                        department: true,
                        userDivisions: {
                            where: { isPrimary: true },
                            include: { division: true },
                        },
                    },
                },
                department: true,
                division: true,
                folder: {
                    include: {
                        shelf: {
                            include: {
                                _count: {
                                    select: { folders: true },
                                },
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
                        },
                    },
                },
                subDocuments: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!model) return null;
        return DocumentMapper.toDomain(model);
    }

    async update(id: string, data: any): Promise<DocumentEntity> {
        const existing = await this.prisma.documentModel.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        userDivisions: {
                            where: { isPrimary: true },
                            select: { divisionId: true },
                            take: 1,
                        },
                    },
                },
            },
        });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບເອກະສານນີ້ໃນລະບົບ');
        }
        const existingPrimaryDivisionId = existing.user?.userDivisions?.[0]?.divisionId ?? undefined;

        // ─── ເຊັກ docNo ຊ້ຳຕາມ division + ປີ (ຖ້າ docNo ຖືກປ່ຽນ) ──────────────────────────
        if (data.docNo && data.docNo !== existing.docNo) {
            const docDate = data.docDate ? new Date(data.docDate) : existing.docDate;
            const year = docDate.getFullYear();
            const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
            const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

            const docNoExists = await this.prisma.documentModel.findFirst({
                where: {
                    docNo: data.docNo,
                    docDate: { gte: yearStart, lte: yearEnd },
                    ...(existingPrimaryDivisionId
                        ? { user: { userDivisions: { some: { divisionId: existingPrimaryDivisionId, isPrimary: true } } } }
                        : {}),
                    id: { not: id },
                },
            });
            if (docNoExists) {
                throw new ConflictException(
                    `ເລກທີ່ເອກະສານ '${data.docNo}' ມີຢູ່ໃນພະແນກນີ້ແລ້ວ (ປີ ${year})`,
                );
            }
        }

        const { attachments, ...documentData } = data;

        const model = await this.prisma.documentModel.update({
            where: { id },
            data: {
                ...documentData,
                attachments:
                    attachments && attachments.length > 0
                        ? { create: attachments }
                        : undefined,
            },
            include: {
                attachments: true,
                folder: true,
                documentType: true,
                department: true,
                division: true,
                subDocuments: { orderBy: { createdAt: 'asc' } },
            },
        });
        return DocumentMapper.toDomain(model);
    }

    // ─── Condition ທີ່ໃຊ້ຮ່ວມກັນ: ຫົມດອາຍຸ + ບໍ່ໄດ້ຕິດພັນສັນຍາ ──────────────────────────
    private get expiredNonContractWhere() {
        return {
            docExpire: { lt: new Date() },
            isContractBound: false,
        };
    }

    async findExpired(
        params?: { page?: number; limit?: number; isDestroyed?: boolean | string; search?: string } | boolean | string,
    ): Promise<{ data: DocumentEntity[]; total: number }> {
        let page = 1;
        let limit = 10;
        let isDestroyed: boolean | string | undefined = undefined;
        let search: string | undefined = undefined;
        let isPaginated = false;

        if (typeof params === 'object' && params !== null) {
            page = params.page || 1;
            limit = params.limit || 10;
            isDestroyed = params.isDestroyed;
            search = params.search;
            if (params.page !== undefined || params.limit !== undefined) {
                isPaginated = true;
            }
        } else {
            isDestroyed = params;
        }

        const whereCondition: any = {
            ...this.expiredNonContractWhere,
        };

        if (isDestroyed === true || isDestroyed === 'true' || isDestroyed === '1') {
            whereCondition.destructionApprovalPath = { not: null };
        } else if (isDestroyed === false || isDestroyed === 'false' || isDestroyed === '0') {
            whereCondition.destructionApprovalPath = null;
        } else if (isDestroyed === undefined || isDestroyed === null || isDestroyed === '') {
            // Default: ດຶງເອກະສານທີ່ຍັງບໍ່ທັນຖືກທຳລາຍ (destructionApprovalPath: null)
            whereCondition.destructionApprovalPath = null;
        }

        if (search) {
            whereCondition.OR = [
                { docNo: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { shortName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { user: { firstNameLa: { contains: search, mode: 'insensitive' } } },
                { user: { lastNameLa: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const findManyOptions: any = {
            where: whereCondition,
            orderBy: { docExpire: 'asc' },
            include: {
                attachments: true,
                documentType: true,
                user: true,
                department: true,
                division: true,
                folder: {
                    include: {
                        shelf: {
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
                        },
                    },
                },
            },
        };

        if (isPaginated) {
            findManyOptions.skip = (page - 1) * limit;
            findManyOptions.take = limit;
        }

        const [models, total] = await Promise.all([
            this.prisma.documentModel.findMany(findManyOptions),
            this.prisma.documentModel.count({ where: whereCondition }),
        ]);

        return {
            data: models.map((m) => DocumentMapper.toDomain(m)),
            total,
        };
    }

    async deleteExpired(approvalFilePath: string): Promise<number> {
        // ດຶງ IDs + attachments ເຉพาะທີ່ຫົມດອາຍຸ, ບໍ່ໄດ້ຕິດພັນສັນຍາ ແລະ ຍັງບໍ່ທັນຖືກທຳລາຍ (destructionApprovalPath == null)
        const expiredDocs = await this.prisma.documentModel.findMany({
            where: {
                ...this.expiredNonContractWhere,
                destructionApprovalPath: null,
            },
            select: {
                id: true,
                attachments: { select: { filePath: true } },
            },
        });

        if (expiredDocs.length === 0) return 0;

        const expiredIds = expiredDocs.map((d) => d.id);

        // ລົບໄຟລ໌ຈາກ disk ກ່ອນ
        const fs = await import('fs');
        for (const doc of expiredDocs) {
            for (const att of doc.attachments) {
                try {
                    if (fs.existsSync(att.filePath)) fs.unlinkSync(att.filePath);
                } catch {
                    // ຂ້າມຖ້າລົບໄຟລ໌ບໍ່ໄດ້
                }
            }
        }

        // ລົບ attachments ແລະ ອັບເດດເອກະสารໃນ transaction
        await this.prisma.$transaction([
            this.prisma.attachmentModel.deleteMany({
                where: { documentId: { in: expiredIds } },
            }),
            this.prisma.documentModel.updateMany({
                where: { id: { in: expiredIds } },
                data: {
                    destructionApprovalPath: approvalFilePath,
                },
            }),
        ]);

        return expiredDocs.length;
    }

    async deleteDocument(id: string, approvalFilePath: string): Promise<DocumentEntity> {
        const doc = await this.prisma.documentModel.findUnique({
            where: { id },
            include: { attachments: true },
        });

        if (!doc) {
            throw new NotFoundException('ບໍ່ພົບເອກະສານນີ້ໃນລະບົບ');
        }

        // ລົບໄຟລ໌ attachments ຈາກ disk
        const fs = await import('fs');
        for (const att of doc.attachments) {
            try {
                if (fs.existsSync(att.filePath)) fs.unlinkSync(att.filePath);
            } catch {
                // ຂ້າມຖ້າລົບໄຟລ໌ບໍ່ໄດ້
            }
        }

        // ລົບ attachments ແລະ ອັບເດດເອກະສານໃນ transaction
        await this.prisma.$transaction([
            this.prisma.attachmentModel.deleteMany({
                where: { documentId: id },
            }),
            this.prisma.documentModel.update({
                where: { id },
                data: {
                    destructionApprovalPath: approvalFilePath,
                },
            }),
        ]);

        const updated = await this.findById(id);
        return updated!;
    }

    async deleteDocuments(ids: string[], approvalFilePath: string): Promise<DocumentEntity[]> {
        if (!ids || ids.length === 0) return [];

        const docs = await this.prisma.documentModel.findMany({
            where: { id: { in: ids } },
            include: { attachments: true },
        });

        if (docs.length === 0) return [];

        const validIds = docs.map((d) => d.id);

        // ລົບໄຟລ໌ attachments ຈາກ disk
        const fs = await import('fs');
        for (const doc of docs) {
            for (const att of doc.attachments) {
                try {
                    if (fs.existsSync(att.filePath)) fs.unlinkSync(att.filePath);
                } catch {
                    // ຂ້າມຖ້າລົບໄຟລ໌ບໍ່ໄດ້
                }
            }
        }

        // ລົບ attachments ແລະ ອັບເດດເອກະສານໃນ transaction
        await this.prisma.$transaction([
            this.prisma.attachmentModel.deleteMany({
                where: { documentId: { in: validIds } },
            }),
            this.prisma.documentModel.updateMany({
                where: { id: { in: validIds } },
                data: {
                    destructionApprovalPath: approvalFilePath,
                },
            }),
        ]);

        const updatedDocs = await this.prisma.documentModel.findMany({
            where: { id: { in: validIds } },
            include: {
                attachments: true,
                documentType: true,
                user: true,
                department: true,
                division: true,
                folder: true,
                subDocuments: { orderBy: { createdAt: 'asc' } },
            },
        });

        return updatedDocs.map((m) => DocumentMapper.toDomain(m));
    }
}
