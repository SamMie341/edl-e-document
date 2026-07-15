import { SubDocumentEntity } from '../entities/sub-document.entity';

export const SUB_DOCUMENT_REPOSITORY = Symbol('SUB_DOCUMENT_REPOSITORY');

export interface ISubDocumentRepository {
  create(documentId: string, data: any): Promise<SubDocumentEntity>;
  createMany(documentId: string, dataList: any[]): Promise<SubDocumentEntity[]>;
  findByDocumentId(documentId: string): Promise<SubDocumentEntity[]>;
  findById(id: string): Promise<SubDocumentEntity | null>;
  update(id: string, data: any): Promise<SubDocumentEntity>;
  delete(id: string): Promise<void>;
}
