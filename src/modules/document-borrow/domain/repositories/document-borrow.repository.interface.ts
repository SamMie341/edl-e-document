import { DocumentBorrowEntity, DocumentBorrowItemEntity } from '../entities/document-borrow.entity';

export const DOCUMENT_BORROW_REPOSITORY = Symbol('DOCUMENT_BORROW_REPOSITORY');

export interface DocumentBorrowFilterParams {
  page?: number;
  limit?: number;
  documentId?: string;
  folderId?: string;
  type?: string;          // 'DOCUMENT' | 'FOLDER'
  borrowerId?: string;
  divisionId?: number;    // ກອງຕາມ division ທີ່ຮັບໄປ
  departmentId?: number;  // ກອງຕາມ department (ສຳລັບ BRANCH_ADMIN)
  activeOnly?: boolean;   // true = ສະເພາະທີ່ຍັງຢືມຢູ່
  borrowedAt?: string;
  returnedAt?: string;
  status?: string;
  search?: string;
}

export interface IDocumentBorrowRepository {
  create(data: CreateDocumentBorrowData): Promise<DocumentBorrowEntity>;
  findAll(params: DocumentBorrowFilterParams): Promise<{ data: DocumentBorrowEntity[]; total: number }>;
  findById(id: string): Promise<DocumentBorrowEntity | null>;
  findByDocumentId(documentId: string, departmentId?: number, divisionId?: number): Promise<DocumentBorrowEntity[]>;
  findByFolderId(folderId: string, departmentId?: number, divisionId?: number): Promise<DocumentBorrowEntity[]>;
  findByDivisionId(divisionId: number, activeOnly?: boolean): Promise<DocumentBorrowEntity[]>;
  findActive(departmentId?: number, divisionId?: number, upcomingDays?: number): Promise<DocumentBorrowEntity[]>;
  return(id: string, returnedAt: Date): Promise<DocumentBorrowEntity>;
  returnItem(itemId: string, returnedAt: Date): Promise<{ item: DocumentBorrowItemEntity; header: DocumentBorrowEntity }>;
  findItemById(itemId: string): Promise<DocumentBorrowItemEntity | null>;
}

export interface CreateDocumentBorrowItemData {
  documentId?: string;
  folderId?: string;
  note?: string;
}

export interface CreateDocumentBorrowData {
  borrower: string;
  phone?: string;
  dueDate?: Date;
  purpose?: string;
  toDivisionId?: number;
  toLocation?: string;
  createdById: string;
  note?: string;
  items: CreateDocumentBorrowItemData[];
}
