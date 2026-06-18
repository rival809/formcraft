import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { WebhooksProcessor } from './webhooks.processor.js'
import { WebhooksService } from './webhooks.service.js'

@Module({
  imports: [BullModule.registerQueue({ name: 'webhooks' })],
  providers: [WebhooksProcessor, WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
