import { Global, Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { FILE_STORAGE_SERVICE } from './interfaces/file-storage.interface';
import { LocalFileStorageService } from './infrastructure/local-file-storage.service';
// import { MulterConfigService } from './config/multer-config.service';

@Global()
@Module({
  providers: [
    PrismaService,
    JwtStrategy,
    // MulterConfigService,
    {
      provide: FILE_STORAGE_SERVICE,
      useClass: LocalFileStorageService,
    },
  ],
  exports: [PrismaService, FILE_STORAGE_SERVICE,
    //  MulterConfigService
  ],
})
export class CoreModule { }
