import { DocumentEntity } from "../entities/document.entity";

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface IDocumentRepository {
    create(data: any): Promise<DocumentEntity>;
    findAll(skip?: number, take?: number): Promise<{ data: DocumentEntity[], total: number }>;
    findById(id: string): Promise<DocumentEntity | null>;
}