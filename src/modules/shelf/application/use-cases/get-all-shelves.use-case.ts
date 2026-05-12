import { Inject, Injectable } from "@nestjs/common";
import * as shelfRepositoriesInterface from "../../domain/repositories/shelf.repositories.interface";
import { PaginatedResult } from "src/core/interfaces/paginated-result.interface";

@Injectable()
export class GetAllShelvesUseCase {
    constructor(
        @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
        private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
    ) { }

    async execute(page: number = 1, limit: number = 10): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const { data, total } = await this.shelfRepository.findAll(skip, limit);
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: { total, page, limit, totalPages }
        };
    }
}