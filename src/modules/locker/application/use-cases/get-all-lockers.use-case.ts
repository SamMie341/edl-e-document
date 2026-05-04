import { Inject, Injectable } from "@nestjs/common";
import * as lockerRepositoryInterface from "../../domain/repositories/locker.repository.interface";
import { PaginatedResult } from "src/core/interfaces/paginated-result.interface";

@Injectable()
export class GetAllLockersUseCase {
    constructor(
        @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
        private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
    ) { }

    async execute(page: number = 1, limit: number = 10): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const { data, total } = await this.lockerRepository.findAll(skip, limit);
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            meta: { total, page, limit, totalPages }
        }
    }
}