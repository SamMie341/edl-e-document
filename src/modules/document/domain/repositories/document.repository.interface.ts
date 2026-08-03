import { DocumentEntity } from '../entities/document.entity';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

export interface ExpiredDocumentFilterParams {
  page?: number;
  limit?: number;
  isDestroyed?: boolean | string;
  search?: string;
}

export interface IDocumentRepository {
  create(data: any): Promise<DocumentEntity>;
  findAll(
    params: DocumentFilterParams,
  ): Promise<{ data: DocumentEntity[]; total: number }>;
  findById(id: string): Promise<DocumentEntity | null>;
  update(id: string, data: any): Promise<DocumentEntity>;
  findExpired(
    params?: ExpiredDocumentFilterParams | boolean | string,
  ): Promise<{ data: DocumentEntity[]; total: number }>;       // หมดอายุ + ไม่ติดพันสัญญา (รองรับ pagination & search & isDestroyed)
  deleteExpired(approvalFilePath: string): Promise<number>;               // ลบไฟล์แนบของทั้งหมดที่ findExpired คืน และบันทึกไฟล์อนุมัติ
  deleteDocument(id: string, approvalFilePath: string): Promise<DocumentEntity>; // ลบไฟล์แนบของเอกสารรายฉบับ และบันทึกไฟล์อนุมัติ
  deleteDocuments(ids: string[], approvalFilePath: string): Promise<DocumentEntity[]>; // ลบไฟล์แนบของเอกสารหลายฉบับ และบันทึกไฟล์อนุมัติ
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
  orUserId?: string;
  retentionStatus?: string;
  warehouseId?: string;
  lockerId?: string;
  shelfId?: string;
  isDestroyed?: boolean | string;
}
