import { DocumentBorrowEntity } from '../entities/document-borrow.entity';

export const DOCUMENT_BORROW_REPOSITORY = Symbol('DOCUMENT_BORROW_REPOSITORY');

export interface DocumentBorrowFilterParams {
  page?: number;
  limit?: number;
  documentId?: string;
  folderId?: string;
  borrowerId?: string;
  divisionId?: number;    // ກອງຕາມ division ທີ່ຮັບໄປ
  departmentId?: number;  // ກອງຕາມ department (ສຳລັບ BRANCH_ADMIN)
  activeOnly?: boolean;   // true = ສະເພາະທີ່ຍັງຢືມຢູ່
  borrowedAt?: string;
  returnedAt?: string;
  status?: string;
}

export interface IDocumentBorrowRepository {
  create(data: CreateDocumentBorrowData): Promise<DocumentBorrowEntity>;
  createMany(data: CreateDocumentBorrowData[]): Promise<DocumentBorrowEntity[]>;
  findAll(params: DocumentBorrowFilterParams): Promise<{ data: DocumentBorrowEntity[]; total: number }>;
  findById(id: string): Promise<DocumentBorrowEntity | null>;
  findByDocumentId(documentId: string, departmentId?: number, divisionId?: number): Promise<DocumentBorrowEntity[]>;
  findByFolderId(folderId: string, departmentId?: number, divisionId?: number): Promise<DocumentBorrowEntity[]>;
  findByDivisionId(divisionId: number, activeOnly?: boolean): Promise<DocumentBorrowEntity[]>;
  findActive(departmentId?: number, divisionId?: number): Promise<DocumentBorrowEntity[]>;
  return(id: string, returnedAt: Date): Promise<DocumentBorrowEntity>;
}


export interface CreateDocumentBorrowData {
  documentId?: string;
  folderId?: string;
  borrower: string;
  phone?: string;
  purpose?: string;
  toDivisionId?: number;
  toLocation?: string;
  createdById: string;
  note?: string;
  dueDate?: Date;
}
