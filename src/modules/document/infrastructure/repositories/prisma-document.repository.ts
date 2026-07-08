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
        const docDateObj = new Date(data.docDate);
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
                `ເລກທີ່ເອກະສານ '${data.docNo}' ມີຢູ່ໃນພະແນກນີ້ແລ້ວ (ປີ ${year})`,
            );
        }

        // ─── ເຊັກ subDocNo ຊ້ຳຕາມ docNo ──────────────────────────────────────────────────────
        if (data.subDocNo) {
            const existingSubDocNo = await this.prisma.documentModel.findFirst({
                where: {
                    docNo: data.docNo,
                    subDocNo: data.subDocNo,
                },
            });
            if (existingSubDocNo) {
                throw new ConflictException(
                    `ເລກທີ່ເອກະສານຍ່ອຍ '${data.subDocNo}' ມີຢູ່ແລ້ວພາຍໃຕ້ເລກທີ '${data.docNo}'`,
                );
            }
        }

        const { attachments, ...documentData } = data;

        const model = await this.prisma.documentModel.create({
            data: {
                ...documentData,
                attachments:
                    attachments && attachments.length > 0
                        ? {
                            create: attachments,
                        }
                        : undefined,
            },
            include: {
                attachments: true,
                folder: true,
                documentType: true,
                department: true,
                division: true,
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
            retentionStatus,
        } = params;
        const skip = (page - 1) * limit;
        const whereCondition: any = {};

        if (folderId) whereCondition.folderId = folderId;
        if (userId) whereCondition.userId = userId;
        if (departmentId) whereCondition.departmentId = departmentId;

        if (divisionIds && divisionIds.length > 0) {
            whereCondition.divisionId = { in: divisionIds };
        } else if (divisionId) {
            whereCondition.divisionId = divisionId;
        }

        if (documentTypeId) whereCondition.documentTypeId = Number(documentTypeId);
        if (startDate || endDate) {
            whereCondition.docDate = {};
            if (startDate) {
                whereCondition.docDate.gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                whereCondition.docDate.lte = new Date(`${endDate}T23:59:59.999Z`);
            }
        }

        // ─── retentionStatus filter ───────────────────────────────────────────────
        // retentionStatus เป็น computed property (จาก docDate + isContractBound)
        // ต้องแปลงเป็น Prisma date-range conditions โดยอ้างอิง logic เดียวกับ entity getter
        if (retentionStatus) {
            const now = new Date();
            // d10End: วันสุดท้ายของวันเดียวกันเมื่อ 10 ปีที่แล้ว (local time)
            const d10End = new Date(
                now.getFullYear() - 10,
                now.getMonth(),
                now.getDate(),
                23,
                59,
                59,
                999,
            );

            // d11End: วันสุดท้ายของวันเดียวกันเมื่อ 11 ปีที่แล้ว (local time)
            const d11End = new Date(
                now.getFullYear() - 11,
                now.getMonth(),
                now.getDate(),
                23,
                59,
                59,
                999,
            );

            let retentionDocDate: any = {};

            switch (retentionStatus) {
                case 'ACTIVE':
                    // อายุ < 10 ปี: docDate > d10End AND ไม่ติดพันสัญญา
                    retentionDocDate = { gt: d10End };
                    whereCondition.isContractBound = false;
                    break;

                case 'DESTROYABLE':
                    // อายุ === 10 ปีพอดี: docDate ระหว่าง (d11End, d10End] AND ไม่ติดพันสัญญา
                    retentionDocDate = {
                        gt: d11End,
                        lte: d10End,
                    };
                    whereCondition.isContractBound = false;
                    break;

                case 'DESTROYABLE_HOLD':
                    // ติดพันสัญญา (โดยไม่จำกัดอายุ)
                    whereCondition.isContractBound = true;
                    break;

                case 'EXPIRED':
                    // อายุ > 10 ปี (11 ปีขึ้นไป): docDate <= d11End AND ไม่ติดพันสัญญา
                    retentionDocDate = { lte: d11End };
                    whereCondition.isContractBound = false;
                    break;
            }

            if (Object.keys(retentionDocDate).length > 0) {
                if (whereCondition.docDate) {
                    whereCondition.docDate = {
                        ...whereCondition.docDate,
                        ...retentionDocDate,
                    };
                } else {
                    whereCondition.docDate = retentionDocDate;
                }
            }
        }
        if (search) {
            whereCondition.OR = [
                { docNo: { contains: search, mode: 'insensitive' } },
                { subDocNo: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
                { shortName: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { division: { name: { contains: search, mode: 'insensitive' } } },
                { department: { name: { contains: search, mode: 'insensitive' } } },
                { user: { firstNameLa: { contains: search, mode: 'insensitive' } } },
                { user: { lastNameLa: { contains: search, mode: 'insensitive' } } },
                { user: { firstNameEng: { contains: search, mode: 'insensitive' } } },
                { user: { lastNameEng: { contains: search, mode: 'insensitive' } } },
            ];
        }
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
                                                include: { address: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
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
                                            include: { address: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
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

        // ─── ເຊັກ subDocNo ຊ້ຳຕາມ docNo (ຖ້າ subDocNo ຖືກປ່ຽນ) ──────────────────────────
        const effectiveDocNo = data.docNo || existing.docNo;
        const effectiveSubDocNo = data.subDocNo !== undefined ? data.subDocNo : existing.subDocNo;
        if (effectiveSubDocNo) {
            const subDocNoExists = await this.prisma.documentModel.findFirst({
                where: {
                    docNo: effectiveDocNo,
                    subDocNo: effectiveSubDocNo,
                    id: { not: id },
                },
            });
            if (subDocNoExists) {
                throw new ConflictException(
                    `ເລກທີ່ເອກະສານຍ່ອຍ '${effectiveSubDocNo}' ມີຢູ່ແລ້ວພາຍໃຕ້ເລກທີ '${effectiveDocNo}'`,
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
                        ? {
                            create: attachments,
                        }
                        : undefined,
            },
            include: {
                attachments: true,
                folder: true,
                documentType: true,
                department: true,
                division: true,
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

    async findExpired(): Promise<DocumentEntity[]> {
        const models = await this.prisma.documentModel.findMany({
            where: this.expiredNonContractWhere,
            include: {
                attachments: true,
                documentType: true,
                folder: true,
            },
            orderBy: { docExpire: 'asc' },
        });
        return models.map((m) => DocumentMapper.toDomain(m));
    }

    async deleteExpired(): Promise<number> {
        // ດຶງ IDs + attachments ເຉพาะທີ່ຫົມດອາຍຸ ແລະ ບໍ່ໄດ້ຕິດພັນສັນຍາ
        const expiredDocs = await this.prisma.documentModel.findMany({
            where: this.expiredNonContractWhere,
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

        // ລົບ attachments + documents ໃນ transaction
        await this.prisma.$transaction([
            this.prisma.attachmentModel.deleteMany({
                where: { documentId: { in: expiredIds } },
            }),
            this.prisma.documentModel.deleteMany({
                where: { id: { in: expiredIds } },
            }),
        ]);

        return expiredDocs.length;
    }
}
