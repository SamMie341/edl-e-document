import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import * as userRepositoryInterface from "../../domain/repositories/user.repository.interface";
import { PaginatedResult } from "src/core/interfaces/paginated-result.interface";

@Injectable()
export class GetAllUsersUseCase {
    constructor(
        @Inject(userRepositoryInterface.USER_REPOSITORY)
        private readonly userRepository: userRepositoryInterface.IUserRepository,
    ) { }

    async execute(page: number = 1, limit: number = 10): Promise<PaginatedResult<any>> {
        if (page < 1 || limit < 1) throw new BadRequestException();
        const skip = (page - 1) * limit;
        const { data, total } = await this.userRepository.findAll(skip, limit);
        const totalPages = Math.ceil(total / limit);

        return {
            data: data.map(user => user.getPublicProfile()),
            meta: {
                total,
                page,
                limit,
                totalPages,
            }
        }
    }
}