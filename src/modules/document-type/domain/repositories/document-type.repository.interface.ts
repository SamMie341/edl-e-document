import { DocumentType } from '../entities/document-type.entity';

export const DOCUMENT_TYPE_REPOSITORY = Symbol('DOCUMENT_TYPE_REPOSITORY');

export interface IDocumentTypeRepository {
    create(data: any): Promise<DocumentType>;
    findAll(skip?: number, take?: number): Promise<{ data: DocumentType[], total: number }>;
    findById(id: string): Promise<DocumentType | null>;
    findByName(name: string): Promise<DocumentType | null>;
    delete(id: string): Promise<void>;
}
