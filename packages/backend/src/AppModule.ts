import { Module } from '@nestjs/common';
import { ServerModule } from '@/server/ServerModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { QueueProcessorModule } from '@/queue/QueueProcessorModule.js';

@Module({
	imports: [
		GlobalModule,
		ServerModule,
		QueueProcessorModule,
	],
})
export class AppModule {}
