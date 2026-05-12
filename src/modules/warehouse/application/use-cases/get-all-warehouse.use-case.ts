import { Inject, Injectable } from "@nestjs/common";
import * as warehouseRepositoryInterface from "../../domain/repositories/warehouse.repository.interface";
import { PaginatedResult } from "src/core/interfaces/paginated-result.interface";

@Injectable()
export class GetAllWarehouseUseCase {
    constructor(
        @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
        private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
    ) { }

    async execute(page: number = 1, limit: number = 10): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const { data, total } = await this.warehouseRepository.findAll(skip, limit);
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: { total, page, limit, totalPages },
        }
    }
}