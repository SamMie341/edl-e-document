// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { DeleteExpiredDocumentsUseCase } from 'src/modules/document/application/use-cases/delete-expired-documents.use-case';

// @Injectable()
// export class DocumentExpireTask {
//   private readonly logger = new Logger(DocumentExpireTask.name);

//   constructor(
//     private readonly deleteExpiredDocumentsUseCase: DeleteExpiredDocumentsUseCase,
//   ) { }

//   // ທຳງານທຸກໆວັນ ເວລາ 00:05 ຕອນກາງຄືນ
//   @Cron('5 0 * * *')
//   async handleExpiredDocuments() {
//     this.logger.log('⏰ ກຳລັງກວດສອບ ແລະ ລົບເອກະສານທີ່ຫົມດອາຍຸ...');
//     try {
//       const result = await this.deleteExpiredDocumentsUseCase.execute();
//       this.logger.log(`✅ ${result.message}`);
//     } catch (error) {
//       this.logger.error(
//         `❌ ເກີດຂໍ້ຜິດພາດໃນການລົບເອກະສານທີ່ຫົມດອາຍຸ: ${error.message}`,
//         error.stack,
//       );
//     }
//   }
// }
