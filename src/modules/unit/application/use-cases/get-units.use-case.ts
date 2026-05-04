import { Inject, Injectable } from "@nestjs/common";
import * as unitRepositoryInterface from "../../domain/repositories/unit.repository.interface";
import { Unit } from "../../domain/entities/unit.entity";

@Injectable()
export class GetUnitsUseCase {
    constructor(
        @Inject(unitRepositoryInterface.UNIT_REPOSITORY)
        private readonly unitRepository: unitRepositoryInterface.IUnitRepository,
    ) { }

    async execute(): Promise<Unit[]> {
        const units = await this.unitRepository.findAll();
        return units;
    }
}