import { Module } from '@nestjs/common'
import { TrpcRouter } from './trpc.router.js'
import { TrpcService } from './trpc.service.js'
import { TrpcController } from './trpc.controller.js'
import { FormsModule } from '../forms/forms.module.js'
import { ResponsesModule } from '../responses/responses.module.js'
import { WorkspacesModule } from '../workspaces/workspaces.module.js'
import { WebhooksModule } from '../webhooks/webhooks.module.js'
import { ApiKeysModule } from '../api-keys/api-keys.module.js'
import { StorageModule } from '../storage/storage.module.js'

@Module({
  imports: [FormsModule, ResponsesModule, WorkspacesModule, WebhooksModule, ApiKeysModule, StorageModule],
  controllers: [TrpcController],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService],
})
export class TrpcModule {}
