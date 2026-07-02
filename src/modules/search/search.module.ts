import { Module } from '@nestjs/common';
import { SearchController } from './presentation/controllers/search.controller';
import { GlobalSearchUseCase } from './application/use-cases/global-search.use-case';

@Module({
  controllers: [SearchController],
  providers: [GlobalSearchUseCase],
})
export class SearchModule {}
