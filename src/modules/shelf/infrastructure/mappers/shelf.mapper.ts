import { ShelfModel } from "@prisma/client";
import { Shelf } from "../../domain/entitites/shelf.entity";

export class ShelfMapper {
    static toDomain(model: ShelfModel): Shelf {
        return new Shelf(
            model.id,
            model.code,
            model.description,
            model.status,
            model.lockerId,
            model.createdAt,
            model.updatedAt,
        );
    }
}