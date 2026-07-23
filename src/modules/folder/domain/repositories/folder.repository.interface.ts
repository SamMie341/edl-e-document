import { Folder } from '../entities/folder.entity';

export const FOLDER_REPOSITORY = Symbol('FOLDER_REPOSITORY');

export interface FolderFilterParams {
  page?: number;
  limit?: number;
  shelfId?: string;
  lockerId?: string;
  warehouseId?: string;
  departmentId?: number;
  divisionId?: number;
  search?: string;
}

export interface IFolderRepository {
  create(data: any): Promise<Folder>;
  findAll(
    params?: FolderFilterParams & { skip?: number; take?: number },
  ): Promise<{ data: Folder[]; total: number }>;
  findById(id: string): Promise<Folder>;
  update(id: string, data: any): Promise<Folder>;
  delete(id: string): Promise<void>;
  getDropdown(params?: FolderFilterParams): Promise<any[]>;
}
