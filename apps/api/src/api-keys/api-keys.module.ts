import { Module } from '@nestjs/common'
import { ApiKeysService } from './api-keys.service.js'

@Module({
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
