import { PaginatedResult } from 'src/core/interfaces/paginated-result.interface';
import { Document } from '../entities/document.entity';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface IDocumentRepository {
    save(document: Document): Promise<void>;
    findById(id: string): Promise<Document | null>;
    findAll(): Promise<Document[]>;
    findManyWithPagination(whereClause: any, page: number, limit: number): Promise<PaginatedResult<Document>>;
}