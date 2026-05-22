import { DocumentEntity } from "../entities/document.entity";

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface IDocumentRepository {
    create(data: any): Promise<DocumentEntity>;
    findAll(params: DocumentFilterParams): Promise<{ data: DocumentEntity[], total: number }>;
    findById(id: string): Promise<DocumentEntity | null>;
}

export interface DocumentFilterParams {
    page?: number;
    limit?: number;
    status?: string;
    documentTypeId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    branchId?: number;
}