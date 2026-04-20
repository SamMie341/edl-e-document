import { DocumentType } from '../entities/document-type.entity';

export const DOCUMENT_TYPE_REPOSITORY = Symbol('DOCUMENT_TYPE_REPOSITORY');

export interface IDocumentTypeRepository {
    findAll(): Promise<DocumentType[]>;
    findById(id: string): Promise<DocumentType | null>;
    findByName(name: string): Promise<DocumentType | null>;
    save(documentType: DocumentType): Promise<void>;
    delete(id: string): Promise<void>;
}
