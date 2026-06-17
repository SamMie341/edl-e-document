import { DocumentBorrowEntity } from '../entities/document-borrow.entity';

export const DOCUMENT_BORROW_REPOSITORY = Symbol('DOCUMENT_BORROW_REPOSITORY');

export interface DocumentBorrowFilterParams {
  page?: number;
  limit?: number;
  documentId?: string;
  folderId?: string;
  borrowerId?: string;
  activeOnly?: boolean; // true = ສະເພາະທີ່ຍັງຢືມຢູ່
}

export interface IDocumentBorrowRepository {
  create(data: CreateDocumentBorrowData): Promise<DocumentBorrowEntity>;
  findAll(params: DocumentBorrowFilterParams): Promise<{ data: DocumentBorrowEntity[]; total: number }>;
  findById(id: string): Promise<DocumentBorrowEntity | null>;
  findByDocumentId(documentId: string): Promise<DocumentBorrowEntity[]>;
  findByFolderId(folderId: string): Promise<DocumentBorrowEntity[]>;
  findActive(): Promise<DocumentBorrowEntity[]>;
  return(id: string, returnedAt: Date): Promise<DocumentBorrowEntity>;
}

export interface CreateDocumentBorrowData {
  documentId?: string;
  folderId?: string;
  borrowerId: string;
  purpose?: string;
  toDivisionId?: number;
  toLocation?: string;
  createdById: string;
  note?: string;
}
