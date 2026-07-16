import { DocumentEntity } from '../entities/document.entity';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface IDocumentRepository {
  create(data: any): Promise<DocumentEntity>;
  findAll(
    params: DocumentFilterParams,
  ): Promise<{ data: DocumentEntity[]; total: number }>;
  findById(id: string): Promise<DocumentEntity | null>;
  update(id: string, data: any): Promise<DocumentEntity>;
  findExpired(): Promise<DocumentEntity[]>;       // หมดอายุ + ไม่ติดพันสัญญา
  deleteExpired(approvalFilePath: string): Promise<number>;               // ลบไฟล์แนบของทั้งหมดที่ findExpired คืน และบันทึกไฟล์อนุมัติ
}

export interface DocumentFilterParams {
  page?: number;
  limit?: number;

  documentTypeId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  folderId?: string;
  userId?: string;
  departmentId?: number;
  divisionId?: number;
  divisionIds?: number[];
  retentionStatus?: string;
  warehouseId?: string;
  lockerId?: string;
  shelfId?: string;
}
