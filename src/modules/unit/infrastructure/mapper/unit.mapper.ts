import { Unit } from "../../domain/entities/unit.entity";

export class UnitMapper {
    static toDomain(raw: any): Unit {
        return new Unit(
            raw.unit_id,
            raw.unit_code,
            raw.unit_name,
            raw.unit_type,
            raw.unit_status,
            raw.division_id,
            raw.office_id,
        );
    }
}