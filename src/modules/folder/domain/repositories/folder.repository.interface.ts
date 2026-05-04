import { Folder } from "../entities/folder.entity";

export const FOLDER_REPOSITORY = Symbol('FOLDER_REPOSITORY');

export interface IFolderRepository {
    findById(id: string): Promise<Folder | null>;
    save(folder: Folder): Promise<void>;
    delete(id: string): Promise<void>;
}