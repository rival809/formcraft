import { Module } from '@nestjs/common'
import { ResponsesService } from './responses.service.js'
import { BullModule } from '@nestjs/bullmq'
import { MailModule } from '../mail/mail.module.js'

@Module({
  imports: [
    BullModule.registerQueue({ name: 'webhooks' }),
    MailModule,
  ],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
