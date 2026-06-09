import { DocumentEntity } from '../entities/document.entity';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface IDocumentRepository {
  create(data: any): Promise<DocumentEntity>;
  findAll(
    params: DocumentFilterParams,
  ): Promise<{ data: DocumentEntity[]; total: number }>;
  findById(id: string): Promise<DocumentEntity | null>;
  update(id: string, data: any): Promise<DocumentEntity>;
}

export interface DocumentFilterParams {
  page?: number;
  limit?: number;

  documentTypeId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  folderId?: string;
  userId?: string;
}
