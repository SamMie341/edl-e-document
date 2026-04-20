import { Inject, Injectable } from "@nestjs/common";
import * as documentRepositoryInterface from "../../domain/repositories/document.repository.interface";
import { SearchDocumentDto } from "../dtos/search-document.dto";
import { PaginatedResult } from "src/core/interfaces/paginated-result.interface";
import { Role } from "src/core/auth/constants/role.enum";
import { Document } from "../../domain/entities/document.entity";

@Injectable()
export class SearchDocumentsUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository
    ) { }

    async execute(dto: SearchDocumentDto, user: any): Promise<PaginatedResult<Document>> {
        const { page = 1, limit = 10, keyword, status, folderId } = dto;

        const where: any = {};

        if (keyword) {
            where.OR = [
                { title: { contains: keyword, mode: 'insentive' } },
                { content: { contains: keyword, mode: 'insentive' } },
            ];
        }

        if (status) where.status = status;
        if (folderId) where.folderId = folderId;

        if (user.role === Role.USER) {
            where.creatorId = user.userId;
        } else if (user.role === Role.BRANCH_ADMIN) {
            where.branchId = user.branchId;
        }

        return this.documentRepository.findManyWithPagination(where, page, limit);
    }
}