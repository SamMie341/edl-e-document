import { Inject, Injectable } from "@nestjs/common";
import * as shelfRepositoriesInterface from "../../domain/repositories/shelf.repositories.interface";
import { CreateShelfDto } from "../dtos/create-shelf.dto";

@Injectable()
export class CreateShelfUseCase {
    constructor(
        @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
        private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
    ) { }

    async execute(dto: CreateShelfDto) {
        return await this.shelfRepository.create(dto);
    }
}