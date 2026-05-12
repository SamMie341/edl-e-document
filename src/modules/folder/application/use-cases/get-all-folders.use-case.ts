import { Inject, Injectable } from "@nestjs/common";
import * as folderRepositoryInterface from "../../domain/repositories/folder.repository.interface";
import { PaginatedResult } from "src/core/interfaces/paginated-result.interface";

@Injectable()
export class GetAllFolderUseCase {
    constructor(
        @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
        private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
    ) { }

    async execute(page: number = 1, limit: number = 10): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const { data, total } = await this.folderRepository.findAll(skip, limit);
        const totalPages = Math.ceil(total / limit);

        return { data, meta: { total, page, limit, totalPages } };
    }
}