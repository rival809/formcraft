import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module.js'
import { FormsModule } from './forms/forms.module.js'
import { ResponsesModule } from './responses/responses.module.js'
import { WebhooksModule } from './webhooks/webhooks.module.js'
import { WorkspacesModule } from './workspaces/workspaces.module.js'
import { StorageModule } from './storage/storage.module.js'
import { QueueModule } from './queue/queue.module.js'
import { MailModule } from './mail/mail.module.js'
import { ApiKeysModule } from './api-keys/api-keys.module.js'
import { TrpcModule } from './trpc/trpc.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env'] }),
    QueueModule,
    StorageModule,
    MailModule,
    AuthModule,
    WorkspacesModule,
    FormsModule,
    ResponsesModule,
    WebhooksModule,
    ApiKeysModule,
    TrpcModule,
  ],
})
export class AppModule {}
