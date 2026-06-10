import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as shelfRepositoryInterface from '../../domain/repositories/shelf.repositories.interface';
import { Shelf } from '../../domain/entitites/shelf.entity';

@Injectable()
export class GetShelfByIdUseCase {
  constructor(
    @Inject(shelfRepositoryInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoryInterface.IShelfRepository,
  ) { }

  async execute(id: string): Promise<Shelf> {
    const shelf = await this.shelfRepository.findById(id);
    if (!shelf) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງນີ້ໃນລະບົບ');
    return shelf;
  }
}
