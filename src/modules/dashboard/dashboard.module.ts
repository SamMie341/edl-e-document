import { Module } from '@nestjs/common';
import { DashboardController } from './presentation/controllers/dashboard.controller';
import { GetDashboardStatsUseCase } from './application/use-cases/get-dashboard-stats.use-case';

@Module({
  controllers: [DashboardController],
  providers: [GetDashboardStatsUseCase],
  exports: [GetDashboardStatsUseCase],
})
export class DashboardModule {}
