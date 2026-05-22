import { Inject, Injectable } from "@nestjs/common";
import * as warehouseRepositoryInterface from "../../domain/repositories/warehouse.repository.interface";

@Injectable()
export class GetAllWarehouseUseCase {
    constructor(
        @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
        private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
    ) { }

    async execute(params: warehouseRepositoryInterface.WarehouseFilterParams) {
        const { data, total } = await this.warehouseRepository.findAll(params);
        return {
            data,
            meta: {
                total,
                page: params.page || 1,
                limit: params.limit || 10,
                totalPages: Math.ceil(total / (params.limit || 10)),
            },
        };
    }
}