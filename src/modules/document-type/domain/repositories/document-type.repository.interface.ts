import { DocumentType } from '../entities/document-type.entity';

export const DOCUMENT_TYPE_REPOSITORY = Symbol('DOCUMENT_TYPE_REPOSITORY');

export interface DocumentTypeFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface IDocumentTypeRepository {
  create(data: any): Promise<DocumentType>;
  findAll(
    params: DocumentTypeFilterParams,
  ): Promise<{ data: DocumentType[]; total: number }>;
  findById(id: string): Promise<DocumentType | null>;
  findByName(name: string): Promise<DocumentType | null>;
  update(id: string, data: any): Promise<DocumentType>;
  delete(id: string): Promise<void>;
}
