import { Module } from '@nestjs/common';
import { CoreModule } from '@/core/CoreModule.js';
import { ServerModule } from '@/server/ServerModule.js';
import { GlobalModule } from '@/GlobalModule.js';
import { QueueProcessorModule } from '@/queue/QueueProcessorModule.js';

@Module({
	imports: [
		GlobalModule,
		CoreModule,
		ServerModule,
		QueueProcessorModule,
	],
})
export class AppModule {}
