export const FILE_STORAGE_SERVICE = Symbol('FILE_STORAGE_SERVICE');

export interface UploadedFile {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

export interface SavedFileData {
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
}

export interface IFileStorageService {
    uploadAndCompress(file: UploadedFile): Promise<SavedFileData>;
}