import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { HrmAuthService } from './infrastructure/services/hrm-auth.service';

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [HrmAuthService],
  exports: [HrmAuthService, HttpModule],
})
export class HrmModule {}
