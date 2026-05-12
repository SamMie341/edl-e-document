import { Folder } from "../entities/folder.entity";

export const FOLDER_REPOSITORY = Symbol('FOLDER_REPOSITORY');

export interface IFolderRepository {
    create(data: any): Promise<Folder>;
    findAll(skip?: number, take?: number): Promise<{ data: Folder[], total: number }>;
    findByShelfId(shelfId: string): Promise<Folder[]>;
    delete(id: string): Promise<void>;
}